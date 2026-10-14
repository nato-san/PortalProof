export const PORTALPROOF_ABI = [
  "function createOrder(address client,address creator,uint256 amount,bytes32 termsHash) returns (uint256)",
  "function markDelivered(uint256 orderId,bytes32 deliveryHash,string certificateURI)",
  "function recordVerifiedPayment(uint256 orderId,bytes32 paymentTxHash)",
  "function getOrder(uint256 orderId) view returns (tuple(address client,address creator,uint256 amount,bytes32 termsHash,bytes32 deliveryHash,bytes32 paymentTxHash,string certificateURI,uint8 status,uint256 createdAt,uint256 updatedAt))",
  "event OrderCreated(uint256 indexed orderId,address indexed client,address indexed creator,uint256 amount,bytes32 termsHash)",
  "event DeliverySubmitted(uint256 indexed orderId,bytes32 deliveryHash,string certificateURI)",
  "event PaymentRecorded(uint256 indexed orderId,bytes32 paymentTxHash)"
];
