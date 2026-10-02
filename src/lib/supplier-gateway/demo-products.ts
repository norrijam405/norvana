export type SupplierLabCandidate = {
  id: string;
  name: string;
  lane: "GENERAL_MERCHANDISE" | "POD";
  category: string;
  concept: string;
  targetRetailCents: { min: number; max: number };
  supplierFit: string[];
  truthState: "SIMULATED_CANDIDATE";
  availability: "NOT_FOR_SALE";
  supplierBinding: "UNBOUND";
  riskFlags: string[];
  merchandisingTags: string[];
};

export const SUPPLIER_LAB_CANDIDATES: readonly SupplierLabCandidate[] = [
  {
    id: "travel-tech-organizer",
    name: "Travel Tech Organizer",
    lane: "GENERAL_MERCHANDISE",
    category: "Travel / Tech",
    concept:
      "Compact zip organizer for cables, chargers, adapters, memory cards, and small electronics.",
    targetRetailCents: { min: 2400, max: 3400 },
    supplierFit: ["cjdropshipping", "banggood", "eprolo"],
    truthState: "SIMULATED_CANDIDATE",
    availability: "NOT_FOR_SALE",
    supplierBinding: "UNBOUND",
    riskFlags: ["SUPPLIER_SKU_NOT_SELECTED", "LANDED_COST_UNKNOWN"],
    merchandisingTags: ["travel", "organization", "tech"],
  },
  {
    id: "magnetic-car-mount",
    name: "Low-Profile Magnetic Car Mount",
    lane: "GENERAL_MERCHANDISE",
    category: "Auto / Mobile",
    concept:
      "Minimal dashboard or vent phone mount concept aimed at a clean, compact everyday-carry aesthetic.",
    targetRetailCents: { min: 1800, max: 2800 },
    supplierFit: ["banggood", "cjdropshipping", "eprolo"],
    truthState: "SIMULATED_CANDIDATE",
    availability: "NOT_FOR_SALE",
    supplierBinding: "UNBOUND",
    riskFlags: ["FITMENT_REVIEW_REQUIRED", "SUPPLIER_SKU_NOT_SELECTED"],
    merchandisingTags: ["auto", "mobile", "everyday"],
  },
  {
    id: "portable-fabric-shaver",
    name: "Portable Fabric Shaver",
    lane: "GENERAL_MERCHANDISE",
    category: "Home / Care",
    concept:
      "Rechargeable lint and fabric-care tool positioned as a small-space clothing and upholstery refresh item.",
    targetRetailCents: { min: 2200, max: 3200 },
    supplierFit: ["cjdropshipping", "banggood", "eprolo"],
    truthState: "SIMULATED_CANDIDATE",
    availability: "NOT_FOR_SALE",
    supplierBinding: "UNBOUND",
    riskFlags: ["ELECTRICAL_SPEC_REVIEW_REQUIRED", "LANDED_COST_UNKNOWN"],
    merchandisingTags: ["home", "care", "compact"],
  },
  {
    id: "pet-travel-bottle",
    name: "Pet Travel Water Bottle",
    lane: "GENERAL_MERCHANDISE",
    category: "Pets / Travel",
    concept:
      "One-hand portable water dispenser concept for walks, road trips, and outdoor pet routines.",
    targetRetailCents: { min: 2000, max: 3000 },
    supplierFit: ["eprolo", "cjdropshipping", "banggood"],
    truthState: "SIMULATED_CANDIDATE",
    availability: "NOT_FOR_SALE",
    supplierBinding: "UNBOUND",
    riskFlags: ["MATERIAL_SAFETY_EVIDENCE_REQUIRED", "SUPPLIER_SKU_NOT_SELECTED"],
    merchandisingTags: ["pets", "travel", "outdoors"],
  },
  {
    id: "norvana-heavyweight-tee",
    name: "Norvana Heavyweight Essential Tee",
    lane: "POD",
    category: "Apparel",
    concept:
      "Minimal Norvana-branded heavyweight tee concept for testing white-label POD presentation and margin normalization.",
    targetRetailCents: { min: 2800, max: 4200 },
    supplierFit: ["gelato", "prodigi", "printful"],
    truthState: "SIMULATED_CANDIDATE",
    availability: "NOT_FOR_SALE",
    supplierBinding: "UNBOUND",
    riskFlags: ["PRINT_FILE_NOT_FINAL", "POD_COST_NOT_QUOTED"],
    merchandisingTags: ["apparel", "norvana", "minimal"],
  },
  {
    id: "norvana-tote",
    name: "Norvana Everyday Tote",
    lane: "POD",
    category: "Accessories",
    concept:
      "Simple branded carry tote concept for testing POD branding, shipping, and return-policy normalization.",
    targetRetailCents: { min: 2200, max: 3400 },
    supplierFit: ["printful", "gelato", "prodigi"],
    truthState: "SIMULATED_CANDIDATE",
    availability: "NOT_FOR_SALE",
    supplierBinding: "UNBOUND",
    riskFlags: ["PRINT_FILE_NOT_FINAL", "POD_COST_NOT_QUOTED"],
    merchandisingTags: ["accessories", "norvana", "daily-carry"],
  },
  {
    id: "norvana-studio-mug",
    name: "Norvana Studio Mug",
    lane: "POD",
    category: "Home / Drinkware",
    concept:
      "Clean branded mug concept used to prove provider-neutral POD quote, packaging, and defect-policy handling.",
    targetRetailCents: { min: 1800, max: 2800 },
    supplierFit: ["prodigi", "gelato", "printful"],
    truthState: "SIMULATED_CANDIDATE",
    availability: "NOT_FOR_SALE",
    supplierBinding: "UNBOUND",
    riskFlags: ["BREAKAGE_POLICY_REVIEW_REQUIRED", "POD_COST_NOT_QUOTED"],
    merchandisingTags: ["home", "drinkware", "norvana"],
  },
  {
    id: "norvana-travel-hoodie",
    name: "Norvana Travel Hoodie",
    lane: "POD",
    category: "Apparel",
    concept:
      "Premium-feel hoodie concept for testing higher-ticket POD economics, white-label presentation, and international routing.",
    targetRetailCents: { min: 5200, max: 7800 },
    supplierFit: ["printful", "gelato", "prodigi"],
    truthState: "SIMULATED_CANDIDATE",
    availability: "NOT_FOR_SALE",
    supplierBinding: "UNBOUND",
    riskFlags: ["PRINT_FILE_NOT_FINAL", "SIZE_RETURN_POLICY_REVIEW_REQUIRED", "POD_COST_NOT_QUOTED"],
    merchandisingTags: ["apparel", "travel", "norvana"],
  },
] as const;
