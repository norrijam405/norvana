/**
 * Acre Era-wide consumer safety coverage policy R0.
 * Guidance and synthetic decision checks ONLY: not live incident response,
 * seller certification, food inspection, payment validation or SafeSpot service.
 * IgniAqua owns shared SafeSpot evidence/location/incident controls.
 */
export const ACRE_SAFETY_CONTEXTS = [
  "GARAGE_SALE", "MARKET_FARM", "GOODS", "FINDS_AFFILIATE",
  "ERA_DROP", "PICKUP_DELIVERY", "BUYER_SELLER_CHAT",
] as const;
export type AcreSafetyContext = typeof ACRE_SAFETY_CONTEXTS[number];
export type ClaimStatus = "UNKNOWN" | "REPORTED" | "VERIFIED";
export type SafetyDomain = {
  id: string; title: string; contexts: readonly AcreSafetyContext[];
  customerAdvice: string; accountableOwner: "ACRE_ERA" | "IGNIAQUA" | "SHARED";
  releaseGate: string;
};
export const ACRE_SAFETY_DOMAINS: readonly SafetyDomain[] = [
  { id: "seller", title: "Seller and partner identity", contexts: ["GARAGE_SALE","MARKET_FARM","GOODS","FINDS_AFFILIATE","ERA_DROP"], accountableOwner:"ACRE_ERA", customerAdvice:"Confirm who is offering the item and whether the seller has been reviewed. A profile is not a guarantee.", releaseGate:"Identity/authorization, account recovery, anti-impersonation and tenant separation" },
  { id: "products", title: "Product claims, condition and authenticity", contexts: ["GARAGE_SALE","MARKET_FARM","GOODS","FINDS_AFFILIATE","ERA_DROP"], accountableOwner:"ACRE_ERA", customerAdvice:"Check item condition, source, pricing and disclosures; unverified descriptions are not certified facts.", releaseGate:"Evidence-based claims, moderation, recall/prohibited-item policy, reviews provenance" },
  { id: "food", title: "Food and farm-goods handling", contexts: ["MARKET_FARM"], accountableOwner:"ACRE_ERA", customerAdvice:"Ask about applicable food handling, storage, allergens, temperature and pickup/delivery conditions; do not assume a listing was inspected.", releaseGate:"Jurisdiction-specific regulatory review, allergen and handling disclosures, recall escalation" },
  { id: "payments", title: "Payments, refunds and counterfeit proof", contexts: ["GARAGE_SALE","MARKET_FARM","GOODS","FINDS_AFFILIATE","ERA_DROP"], accountableOwner:"ACRE_ERA", customerAdvice:"Do not rely on payment screenshots, transfer claims or requests to pay outside an approved checkout.", releaseGate:"Authorized payment provider reconciliation, refund controls, chargeback and fraud response" },
  { id: "meetups", title: "Public exchanges and pickup locations", contexts: ["GARAGE_SALE","MARKET_FARM","PICKUP_DELIVERY"], accountableOwner:"IGNIAQUA", customerAdvice:"Check an exchange location's independently sourced designation, hours and suitability. A venue is never a safety guarantee.", releaseGate:"Approved SafeSpot public-venue adapter, evidence age, privacy-preserving location handling" },
  { id: "fulfillment", title: "Delivery, shipping and handoff", contexts: ["MARKET_FARM","GOODS","ERA_DROP","PICKUP_DELIVERY"], accountableOwner:"ACRE_ERA", customerAdvice:"Confirm who fulfills the order, estimated timing, costs and what happens if delivery fails.", releaseGate:"Verified fulfillment terms, carrier/partner handling, address data minimization and refunds" },
  { id: "messages", title: "Messaging, harassment and scams", contexts: ["GARAGE_SALE","BUYER_SELLER_CHAT","PICKUP_DELIVERY"], accountableOwner:"SHARED", customerAdvice:"Keep arrangements in approved channels; don't share sensitive details and report threats or impersonation.", releaseGate:"Authentication, privacy, block/report controls, spam limits and human escalation" },
  { id: "privacy", title: "Personal information and location privacy", contexts: [...ACRE_SAFETY_CONTEXTS], accountableOwner:"SHARED", customerAdvice:"Never publish a private home address or sensitive records by default; share only what a transaction requires.", releaseGate:"Consent, access controls, data minimization, retention/deletion, security review" },
  { id: "incidents", title: "Safety concerns and incident response", contexts: [...ACRE_SAFETY_CONTEXTS], accountableOwner:"IGNIAQUA", customerAdvice:"For immediate danger contact local emergency services. This preview does not submit or monitor reports.", releaseGate:"Confidential authorized reporting, moderation, evidence handling, human-reviewed escalation" },
  { id: "affiliates", title: "Third-party links and seller attribution", contexts: ["FINDS_AFFILIATE","GOODS","ERA_DROP"], accountableOwner:"ACRE_ERA", customerAdvice:"Check the actual merchant, current offer terms, return policy and any disclosed affiliate relationship before buying.", releaseGate:"Partner verification, link safety, truthful sponsorship disclosure and redirect checks" },
];
export type SyntheticSafetyInput = {
  context: AcreSafetyContext;
  vendorVerified?: boolean;
  productClaimsVerified?: boolean;
  paymentConfirmedByProvider?: boolean;
  meetupEvidenceVerified?: boolean;
  containsPrivateAddress?: boolean;
  requestingOffPlatformPayment?: boolean;
  foodHandlingDocumentationReviewed?: boolean;
};
export type SafetyAssessment = { mode: "SYNTHETIC_ONLY"; outcome: "REVIEW_REQUIRED"; flags: string[]; safeToPublish: false; safeToProceed: false };
export function evaluateSyntheticAcreSafety(input: SyntheticSafetyInput): SafetyAssessment {
  const flags: string[] = [];
  if (!input.vendorVerified) flags.push("Seller/partner identity unverified");
  if (!input.productClaimsVerified) flags.push("Product claims unverified");
  if (!input.paymentConfirmedByProvider) flags.push("Payment not provider-confirmed");
  if (input.requestingOffPlatformPayment) flags.push("Unapproved off-platform payment request");
  if (input.containsPrivateAddress) flags.push("Sensitive address exposure");
  if ((input.context === "GARAGE_SALE" || input.context === "PICKUP_DELIVERY") && !input.meetupEvidenceVerified)
    flags.push("Meetup evidence unverified");
  if (input.context === "MARKET_FARM" && !input.foodHandlingDocumentationReviewed)
    flags.push("Food-handling evidence not reviewed");
  // Even if all toy inputs are checked true, the real controls are not deployed.
  return { mode:"SYNTHETIC_ONLY", outcome:"REVIEW_REQUIRED", flags, safeToPublish:false, safeToProceed:false };
}
export function coverageByContext(context: AcreSafetyContext): SafetyDomain[] {
  return ACRE_SAFETY_DOMAINS.filter(domain => domain.contexts.includes(context));
}
