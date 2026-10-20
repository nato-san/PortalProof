export const PORTALPROOF_ABI = [
  "function createOrder(address client,address creator,bytes32 termsHash) returns (bytes32 proofId)",
  "function markDelivered(bytes32 proofId,bytes32 deliveryHash)",
  "function recordVerifiedPayment(bytes32 proofId,bytes32 paymentTxHash)",
  "event OrderCreated(bytes32 indexed proofId,address indexed client,address indexed creator)",
  "event DeliverySubmitted(bytes32 indexed proofId,bytes32 deliveryHash,address indexed submitter)",
  "event PaymentRecorded(bytes32 indexed proofId,bytes32 paymentTxHash,address indexed submitter)"
];
