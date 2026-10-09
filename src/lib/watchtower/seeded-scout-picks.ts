export type SeededScoutPick = {
  sku: string;
  name: string;
  lane: string;
  priority: number;
  supplierPrice: string;
  state: "HOLD";
  reason: string;
  blockers: string[];
};

export const SEEDED_SCOUT_PICKS: SeededScoutPick[] = [
  {
    sku: "CJSJ228498801AZ",
    name: "Desktop Folding Full-Alloy Phone Holder",
    lane: "Goods / Tech / Desk",
    priority: 1,
    supplierPrice: "$0.53–$0.76",
    state: "HOLD",
    reason: "Small, simple, low unit cost, broad desk utility, and low expected support burden.",
    blockers: ["U.S. shipping unknown", "stock unknown", "processing unknown", "delivery unknown", "build quality unverified"],
  },
  {
    sku: "CJSJ206576301AZ",
    name: "Metal Rotating Folding Phone Bracket",
    lane: "Goods / Tech / Desk",
    priority: 2,
    supplierPrice: "$1.40–$1.62",
    state: "HOLD",
    reason: "Useful desk product with clear demo value, modest unit cost, and no battery/electronics support burden.",
    blockers: ["U.S. shipping unknown", "stock unknown", "processing unknown", "delivery unknown", "hinge durability unverified"],
  },
  {
    sku: "CJYD197888501AZ",
    name: "Magnetic Cable Organizer",
    lane: "Goods / Tech / Home Office",
    priority: 3,
    supplierPrice: "$0.05–$8.45 variants",
    state: "HOLD",
    reason: "Everyday cable-management problem, easy demonstration, and potential for a lightweight high-margin variant.",
    blockers: ["exact variant not chosen", "U.S. shipping unknown", "stock unknown", "processing unknown", "adhesive durability unverified"],
  },
  {
    sku: "CJJT174982701AZ",
    name: "Portable Washable Pet Hair Roller",
    lane: "Goods / Pets / Home",
    priority: 4,
    supplierPrice: "$2.63–$4.75",
    state: "HOLD",
    reason: "Evergreen pet-hair problem, reusable, no electronics, and strong before/after content potential.",
    blockers: ["U.S. shipping unknown", "stock unknown", "processing unknown", "delivery unknown", "roller durability unverified"],
  },
  {
    sku: "CJMY200580801AZ",
    name: "2-in-1 Pet Hair Removal Roller",
    lane: "Goods / Pets / Home",
    priority: 5,
    supplierPrice: "$1.39–$5.80",
    state: "HOLD",
    reason: "Simple pet/home utility with clear demo value and no battery or powered-component failure mode.",
    blockers: ["U.S. shipping unknown", "stock unknown", "processing unknown", "delivery unknown", "performance unverified"],
  },
];
