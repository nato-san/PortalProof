// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PortalProofOrder
/// @notice Lightweight append-only proof log for creator work orders.
/// @dev Human-readable job data remains off-chain. Immutable transaction events
/// record its hashes and the wallet that submitted each proof.
contract PortalProofOrder {
    error InvalidProof();
    error NotAllowed();

    event OrderCreated(
        bytes32 indexed proofId,
        address indexed client,
        address indexed creator
    );
    event DeliverySubmitted(bytes32 indexed proofId, bytes32 deliveryHash, address indexed submitter);
    event PaymentRecorded(bytes32 indexed proofId, bytes32 paymentTxHash, address indexed submitter);

    function createOrder(
        address client,
        address creator,
        bytes32 termsHash
    ) external returns (bytes32 proofId) {
        if (client == address(0) || creator == address(0) || termsHash == bytes32(0)) {
            revert InvalidProof();
        }
        if (msg.sender != client && msg.sender != creator) {
            revert NotAllowed();
        }

        proofId = termsHash;
        emit OrderCreated(proofId, client, creator);
    }

    function markDelivered(bytes32 proofId, bytes32 deliveryHash) external {
        if (proofId == bytes32(0) || deliveryHash == bytes32(0)) revert InvalidProof();
        emit DeliverySubmitted(proofId, deliveryHash, msg.sender);
    }

    function recordVerifiedPayment(bytes32 proofId, bytes32 paymentTxHash) external {
        if (proofId == bytes32(0) || paymentTxHash == bytes32(0)) revert InvalidProof();
        emit PaymentRecorded(proofId, paymentTxHash, msg.sender);
    }
}
