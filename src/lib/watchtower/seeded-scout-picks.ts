export type SeededScoutPick = {
  sku: string;
  name: string;
  lane: string;
  priority: number;
  supplierPrice: string;
  state: "HOLD";
  inventorySignal: "VERIFIED_INVENTORY_SURFACE" | "CURRENT_CATALOG";
  sourceUrl: string;
  reason: string;
  blockers: string[];
};

export const SEEDED_SCOUT_PICKS: SeededScoutPick[] = [
  {
    sku: "CJYD233200801AZ",
    name: "Pet Hair Remover Mitt",
    lane: "Goods / Pets / Home",
    priority: 1,
    supplierPrice: "$0.57–$6.96",
    state: "HOLD",
    inventorySignal: "VERIFIED_INVENTORY_SURFACE",
    sourceUrl: "https://www.cjdropshipping.com/product/pet-hair-remover-mitt-pet-hair-remover-gloves-deshedding-brush-glove-for-dog-cat-rabbit-with-long-short-curly-hair-p-2503191148021601200.html",
    reason: "Low-cost, lightweight, obvious pet-owner problem, strong demo potential, no electronics, and currently surfaced by CJ's verified-inventory pet catalog.",
    blockers: ["exact variant not chosen", "U.S. shipping route not calculated", "final stock for chosen variant not captured", "material/fit quality not independently checked"],
  },
  {
    sku: "CJGY174846501AZ",
    name: "Slow Feeder Pet Bowl",
    lane: "Goods / Pets / Home",
    priority: 2,
    supplierPrice: "$1.29–$2.11",
    state: "HOLD",
    inventorySignal: "VERIFIED_INVENTORY_SURFACE",
    sourceUrl: "https://cjdropshipping.com/product/pet-dog-cat-slow-feeder-bowls-anti-choking-slow-feeder-dish-bowl-home-dog-eating-plate-anti-gulping-bowl-supplies-p-1653041912300969984.html",
    reason: "Very low source cost, broad pet-market utility, simple construction, and no powered-component failure mode. Avoid repeating supplier health claims as proof.",
    blockers: ["exact color/variant not chosen", "U.S. shipping route not calculated", "final stock for chosen variant not captured", "material/cleanability quality not independently checked"],
  },
  {
    sku: "CJYD208536601AZ",
    name: "Fruit Drain Basket / Refrigerator Crisper",
    lane: "Goods / Kitchen / Home",
    priority: 3,
    supplierPrice: "$2.11–$4.22",
    state: "HOLD",
    inventorySignal: "CURRENT_CATALOG",
    sourceUrl: "https://cjdropshipping.com/product/fruit-drain-basket-with-lid-vegetable-washing-bowl-foldable-handle-cleaning-colander-plastic-refrigerator-crisper-kitchen-box-kitchen-gadgets-p-2407160828401622500.html",
    reason: "Clear kitchen utility, visual demo value, reusable household use case, and a source price that leaves room for margin if shipping stays reasonable.",
    blockers: ["U.S. shipping route not calculated", "final stock not captured", "size/variant economics need one exact selection", "plastic quality not independently checked"],
  },
  {
    sku: "CJJJJTCF02590-Grey-30x40cm",
    name: "Microfiber Cleaning Cloth",
    lane: "Goods / Home / Cleaning",
    priority: 4,
    supplierPrice: "$0.07–$7.46 variants",
    state: "HOLD",
    inventorySignal: "CURRENT_CATALOG",
    sourceUrl: "https://cjdropshipping.com/product/thickened-magic-cleaning-cloth-microfiber-surface-instant-polishing-household-cleaning-cloth-for-glass-windows-mirrors-car-kitchen-gadgets-p-249AE73F-A7EC-45AD-9F48-E708BC592CC9.html",
    reason: "Extremely low source cost on simple variants, lightweight, broad household usefulness, repeat/bundle potential, and low breakage risk.",
    blockers: ["exact pack/size must be fixed", "U.S. shipping route not calculated", "final stock not captured", "do not repeat exaggerated cleaning claims without evidence"],
  },
  {
    sku: "CJJJJTCF00671-8x9x1cm 2pcs",
    name: "Pasta Portion Measurer",
    lane: "Goods / Kitchen / Everyday",
    priority: 5,
    supplierPrice: "$0.75–$1.50",
    state: "HOLD",
    inventorySignal: "CURRENT_CATALOG",
    sourceUrl: "https://cjdropshipping.com/product/creative-noodle-potentiometer-pasta-measurer-noodle-maker-selector-measurer-kitchen-gadget-p-A1FDB509-C03F-451B-AC08-365658D870F1.html",
    reason: "Tiny, lightweight, low-cost kitchen gadget with straightforward use, low support burden, and strong add-on/bundle potential.",
    blockers: ["U.S. shipping route not calculated", "final stock not captured", "exact 1pc/2pc variant must be fixed", "value proposition depends on keeping landed cost low"],
  },
];
