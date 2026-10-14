// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PortalProofOrder
/// @notice Minimal creator work-order proof for Portaldot V3 EVM testnet.
/// @dev This is intentionally small for the Hacker House MVP. It records agreed
/// terms, delivery proof, and payment evidence without pretending to verify a
/// payment that was not checked by the app or reviewer.
contract PortalProofOrder {
    enum OrderStatus {
        Created,
        Delivered,
        Paid,
        Cancelled
    }

    struct Order {
        address client;
        address creator;
        uint256 amount;
        bytes32 termsHash;
        bytes32 deliveryHash;
        bytes32 paymentTxHash;
        string certificateURI;
        OrderStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    string public name = "PortalProof Order";
    string public symbol = "PPO";
    address public verifier;
    uint256 public nextOrderId = 1;

    mapping(uint256 => Order) private orders;
    mapping(uint256 => address) private owners;
    mapping(address => uint256) private balances;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event OrderCreated(
        uint256 indexed orderId,
        address indexed client,
        address indexed creator,
        uint256 amount,
        bytes32 termsHash
    );
    event DeliverySubmitted(uint256 indexed orderId, bytes32 deliveryHash, string certificateURI);
    event PaymentRecorded(uint256 indexed orderId, bytes32 paymentTxHash);
    event OrderCancelled(uint256 indexed orderId);

    modifier onlyParticipant(uint256 orderId) {
        Order memory order = orders[orderId];
        require(msg.sender == order.client || msg.sender == order.creator || msg.sender == verifier, "not participant");
        _;
    }

    modifier onlyVerifier() {
        require(msg.sender == verifier, "not verifier");
        _;
    }

    constructor() {
        verifier = msg.sender;
    }

    function createOrder(
        address client,
        address creator,
        uint256 amount,
        bytes32 termsHash
    ) external returns (uint256 orderId) {
        require(client != address(0), "client required");
        require(creator != address(0), "creator required");
        require(amount > 0, "amount required");
        require(termsHash != bytes32(0), "terms hash required");
        require(msg.sender == client || msg.sender == creator || msg.sender == verifier, "not allowed");

        orderId = nextOrderId++;
        orders[orderId] = Order({
            client: client,
            creator: creator,
            amount: amount,
            termsHash: termsHash,
            deliveryHash: bytes32(0),
            paymentTxHash: bytes32(0),
            certificateURI: "",
            status: OrderStatus.Created,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        owners[orderId] = client;
        balances[client] += 1;

        emit Transfer(address(0), client, orderId);
        emit OrderCreated(orderId, client, creator, amount, termsHash);
    }

    function markDelivered(
        uint256 orderId,
        bytes32 deliveryHash,
        string calldata certificateURI
    ) external onlyParticipant(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Created, "wrong status");
        require(deliveryHash != bytes32(0), "delivery hash required");
        require(msg.sender == order.creator || msg.sender == verifier, "creator only");

        order.deliveryHash = deliveryHash;
        order.certificateURI = certificateURI;
        order.status = OrderStatus.Delivered;
        order.updatedAt = block.timestamp;

        emit DeliverySubmitted(orderId, deliveryHash, certificateURI);
    }

    function recordVerifiedPayment(uint256 orderId, bytes32 paymentTxHash) external onlyVerifier {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Delivered, "delivery required");
        require(paymentTxHash != bytes32(0), "payment hash required");

        order.paymentTxHash = paymentTxHash;
        order.status = OrderStatus.Paid;
        order.updatedAt = block.timestamp;

        emit PaymentRecorded(orderId, paymentTxHash);
    }

    function cancelOrder(uint256 orderId) external onlyParticipant(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Created, "cannot cancel");
        order.status = OrderStatus.Cancelled;
        order.updatedAt = block.timestamp;
        emit OrderCancelled(orderId);
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        require(owners[orderId] != address(0), "order not found");
        return orders[orderId];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = owners[tokenId];
        require(owner != address(0), "token not found");
        return owner;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "zero address");
        return balances[account];
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(owners[tokenId] != address(0), "token not found");
        return orders[tokenId].certificateURI;
    }
}
