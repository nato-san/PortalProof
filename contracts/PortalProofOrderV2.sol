// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Creator-authored evidence. Does not prove client signatures or payment validity.
/// @dev Non-custodial: no payable entry points or fund transfers.
contract PortalProofOrderV2 {
    enum State { Missing, Recorded, Delivered, Completed }
    struct Order {
        address creator;
        bytes32 termsHash;
        uint256 amountWei;
        bytes32 deliveryUrlHash;
        bytes32 paymentTxHash;
        State state;
    }
    error InvalidInput();
    error NotCreator();
    error InvalidState();
    error DuplicateNonce();
    error PaymentAlreadyUsed();
    mapping(bytes32 => Order) public orders;
    mapping(address => mapping(bytes32 => bool)) public usedNonces;
    mapping(bytes32 => bytes32) public paymentOrders;
    event OrderRecorded(bytes32 indexed orderId, address indexed creator, bytes32 termsHash, uint256 amountWei);
    event DeliveryRecorded(bytes32 indexed orderId, bytes32 deliveryUrlHash);
    event PaymentAcknowledged(bytes32 indexed orderId, bytes32 paymentTxHash);

    function createOrder(bytes32 nonce, bytes32 termsHash, uint256 amountWei) external returns (bytes32 orderId) {
        if (nonce == bytes32(0) || termsHash == bytes32(0) || amountWei == 0) revert InvalidInput();
        if (usedNonces[msg.sender][nonce]) revert DuplicateNonce();
        orderId = keccak256(abi.encode(block.chainid, address(this), msg.sender, nonce));
        usedNonces[msg.sender][nonce] = true;
        orders[orderId] = Order(msg.sender, termsHash, amountWei, bytes32(0), bytes32(0), State.Recorded);
        emit OrderRecorded(orderId, msg.sender, termsHash, amountWei);
    }

    function recordDelivery(bytes32 orderId, bytes32 deliveryUrlHash) external {
        Order storage order = orders[orderId];
        if (order.state != State.Recorded) revert InvalidState();
        if (msg.sender != order.creator) revert NotCreator();
        if (deliveryUrlHash == bytes32(0)) revert InvalidInput();
        order.deliveryUrlHash = deliveryUrlHash;
        order.state = State.Delivered;
        emit DeliveryRecorded(orderId, deliveryUrlHash);
    }

    /// @notice Creator acknowledges a payment reference; independent RPC verification is required.
    function acknowledgePayment(bytes32 orderId, bytes32 paymentTxHash) external {
        Order storage order = orders[orderId];
        if (order.state != State.Delivered) revert InvalidState();
        if (msg.sender != order.creator) revert NotCreator();
        if (paymentTxHash == bytes32(0)) revert InvalidInput();
        if (paymentOrders[paymentTxHash] != bytes32(0)) revert PaymentAlreadyUsed();
        paymentOrders[paymentTxHash] = orderId;
        order.paymentTxHash = paymentTxHash;
        order.state = State.Completed;
        emit PaymentAcknowledged(orderId, paymentTxHash);
    }
}
