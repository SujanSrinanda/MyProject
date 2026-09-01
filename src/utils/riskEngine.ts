import { RiskEvaluationRequest, RiskEvaluationResponse, RiskDecision, RiskLevel, TechnicalRiskDetails, ModelWeights } from '../types';

/**
 * PROTOTYPE / VISUALIZATION CONTROLS ONLY:
 * These client-side weights and functions are strictly used for the interactive
 * Threat Sandbox simulator in the browser UI. Real transactions are evaluated
 * authoritatively on the FastAPI backend risk engine.
 */
export const DEFAULT_MODEL_WEIGHTS: ModelWeights = {
  rfWeight: 0.45,
  isoWeight: 0.35,
  graphWeight: 0.20,
};

export async function evaluateTransactionRisk(
  req: RiskEvaluationRequest,
  weights: ModelWeights = DEFAULT_MODEL_WEIGHTS
): Promise<RiskEvaluationResponse> {
  return calculateLocalRisk(req, weights);
}

export function calculateLocalRisk(
  req: RiskEvaluationRequest,
  weights: ModelWeights = DEFAULT_MODEL_WEIGHTS
): RiskEvaluationResponse {
  const { amount, isNewRecipient, recipientName } = req;

  // Rule 1: High risk trigger (Amount > 50,000 or suspicious recipient keywords)
  const isSuspiciousRecipient = /unknown|scam|crypto|lottery|unverified|urgent/i.test(recipientName);

  if (amount >= 50000 || (amount >= 20000 && isNewRecipient) || isSuspiciousRecipient) {
    const decision: RiskDecision = 'BLOCK';
    const riskLevel: RiskLevel = 'CRITICAL';
    const safetyScore = Math.max(15, Math.floor(40 - (amount / 2000)));

    const humanReasons: string[] = [];
    if (amount >= 20000) humanReasons.push(`This payment of ₹${amount.toLocaleString('en-IN')} is much larger than your usual payments.`);
    if (isNewRecipient) humanReasons.push('This recipient is brand new and has not been verified in your past transactions.');
    humanReasons.push('Our security model detected unusual activity signals associated with this transaction.');
    humanReasons.push('The payment device or network context presented elevated threat characteristics.');

    const technicalDetails: TechnicalRiskDetails = {
      rfScore: 0.89,
      ifScore: 0.84,
      graphRisk: 0.78,
      shapFactors: [
        { factor: 'Transaction Amount vs Historical Baseline', impact: '+0.38', weight: 0.38 },
        { factor: 'New Unverified Recipient Node', impact: '+0.29', weight: 0.29 },
        { factor: 'Neo4j Graph High-Risk Distance', impact: '+0.18', weight: 0.18 },
        { factor: 'Isolation Forest Anomaly Deviation', impact: '+0.14', weight: 0.14 },
      ],
      riskFusionModel: 'Ensembled Random Forest + Isolation Forest + Neo4j Graph Fusion',
      anomaliesDetected: [
        'Out-of-distribution transfer magnitude',
        'Unrecognized destination vertex in knowledge graph',
        'Short account lifespan multiplier',
      ],
    };

    return {
      decision,
      safetyScore,
      riskLevel,
      userMessage: 'SentinelFin stopped this payment to protect your money.',
      humanReasons,
      technicalDetails,
    };
  }

  // Rule 2: High amount trigger (Amount > 3,000)
  // Payments exceeding ₹3,000 require Face Biometric verification before PIN
  if (amount > 3000) {
    const decision: RiskDecision = 'CHALLENGE';
    const riskLevel: RiskLevel = 'HIGH';
    const safetyScore = Math.floor(68 + Math.random() * 8);

    const humanReasons: string[] = [
      `High-value payment of ₹${amount.toLocaleString('en-IN')} exceeds standard ₹3,000 threshold.`,
      'Biometric face verification is required before entering your PIN to protect high-value funds.',
      isNewRecipient
        ? 'First-time high amount transfer requires multi-factor step-up authentication.'
        : 'Enhanced high-value transaction protection active above ₹3,000.',
    ];

    const technicalDetails: TechnicalRiskDetails = {
      rfScore: 0.42,
      ifScore: 0.51,
      graphRisk: 0.35,
      shapFactors: [
        { factor: 'High Transaction Amount Magnitude', impact: '+0.32', weight: 0.32 },
        { factor: 'Multi-Factor Step-Up Policy', impact: '+0.25', weight: 0.25 },
        { factor: 'Device Consistency', impact: '-0.12', weight: -0.12 },
      ],
      riskFusionModel: 'SentinelFin Multi-Factor Risk Fusion',
      anomaliesDetected: ['High amount exceeding standard ₹3,000 limit'],
    };

    return {
      decision,
      safetyScore,
      riskLevel,
      userMessage: `Because this payment exceeds ₹3,000 (₹${amount.toLocaleString('en-IN')}), face biometric verification is required before entering your PIN.`,
      humanReasons,
      technicalDetails,
    };
  }

  // Rule 3: Allow (Normal everyday transaction <= 3,000 - PIN is sufficient, hide Face ID)
  const decision: RiskDecision = 'ALLOW';
  const riskLevel: RiskLevel = 'LOW';
  const safetyScore = Math.floor(92 + Math.random() * 6); // 92-97

  const humanReasons: string[] = [
    `Transaction amount of ₹${amount.toLocaleString('en-IN')} is within low-risk limit (≤ ₹3,000).`,
    'Standard peer-to-peer mobile phone payment verified.',
    'Normal transfer: 4-digit security PIN is sufficient to authorize.',
  ];

  const technicalDetails: TechnicalRiskDetails = {
    rfScore: 0.04,
    ifScore: 0.08,
    graphRisk: 0.02,
    shapFactors: [
      { factor: 'Recognized Recipient History', impact: '-0.35', weight: -0.35 },
      { factor: 'Trusted Device Footprint', impact: '-0.28', weight: -0.28 },
      { factor: 'Normal Spend Envelope', impact: '-0.22', weight: -0.22 },
    ],
    riskFusionModel: 'SentinelFin Baseline Protection',
    anomaliesDetected: [],
  };

  return {
    decision,
    safetyScore,
    riskLevel,
    userMessage: 'This transaction is within the ₹3,000 daily limit. 4-digit security PIN is sufficient.',
    humanReasons,
    technicalDetails,
  };
}
