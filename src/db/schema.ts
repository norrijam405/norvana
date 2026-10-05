import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  real,
  boolean,
  timestamp,
  json,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull().default(""),
  price: real("price").notNull(),
  compareAtPrice: real("compare_at_price"),
  cost: real("cost").default(0), // Cost from supplier for margin tracking
  niche: varchar("niche", { length: 100 }).notNull().default("general"),
  volumeNumber: integer("volume_number").notNull().default(1),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  supplierId: integer("supplier_id"),
  supplierSku: varchar("supplier_sku", { length: 100 }), // SKU at supplier
  commerceModel: varchar("commerce_model", { length: 50 }).notNull().default("QUALIFIED_SUPPLIER"),
  sourceProviderSlug: varchar("source_provider_slug", { length: 120 }),
  brandName: varchar("brand_name", { length: 255 }),
  productCondition: varchar("product_condition", { length: 40 }).notNull().default("NEW"),
  authorizationState: varchar("authorization_state", { length: 60 }).notNull().default("UNVERIFIED"),
  imageRightsState: varchar("image_rights_state", { length: 60 }).notNull().default("LEGACY_UNVERIFIED"),
  externalCheckoutUrl: varchar("external_checkout_url", { length: 1500 }),
  externalSellerName: varchar("external_seller_name", { length: 255 }),
  affiliateNetwork: varchar("affiliate_network", { length: 120 }),
  affiliateProgram: varchar("affiliate_program", { length: 255 }),
  externalProductId: varchar("external_product_id", { length: 255 }),
  productEvidence: json("product_evidence").$type<Record<string, unknown>>().notNull().default({}),
  images: json("images").$type<string[]>().notNull().default([]),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  inventory: integer("inventory").notNull().default(100),
  tags: json("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outboundReferralClicks = pgTable("outbound_referral_clicks", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  providerSlug: varchar("provider_slug", { length: 120 }).notNull(),
  destinationHost: varchar("destination_host", { length: 255 }).notNull(),
  commerceModel: varchar("commerce_model", { length: 50 }).notNull().default("AFFILIATE_REFERRAL"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const partnerCollections = pgTable(
  "partner_collections",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    eyebrow: varchar("eyebrow", { length: 120 }).notNull().default("Partner Finds"),
    description: text("description").notNull().default(""),
    theme: varchar("theme", { length: 120 }).notNull().default("curated"),
    heroImage: varchar("hero_image", { length: 1000 }),
    startDate: varchar("start_date", { length: 50 }).notNull().default(""),
    endDate: varchar("end_date", { length: 50 }).notNull().default(""),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("partner_collections_slug_idx").on(table.slug)]
);

export const partnerCollectionProducts = pgTable(
  "partner_collection_products",
  {
    id: serial("id").primaryKey(),
    collectionId: integer("collection_id").notNull(),
    productId: integer("product_id").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("partner_collection_products_unique_idx").on(
      table.collectionId,
      table.productId
    ),
  ]
);

export const eras = pgTable(
  "eras",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 180 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    eyebrow: varchar("eyebrow", { length: 160 }).notNull().default(""),
    story: text("story").notNull().default(""),
    kind: varchar("kind", { length: 40 }).notNull().default("CATEGORY"),
    lifecycleState: varchar("lifecycle_state", { length: 40 }).notNull().default("DRAFT"),
    visibility: varchar("visibility", { length: 30 }).notNull().default("PRIVATE"),
    isPrimary: boolean("is_primary").notNull().default(false),
    startAt: timestamp("start_at"),
    endAt: timestamp("end_at"),
    themeTokens: json("theme_tokens").$type<Record<string, unknown>>().notNull().default({}),
    watchtowerProfile: json("watchtower_profile").$type<Record<string, unknown>>().notNull().default({}),
    archivePolicy: json("archive_policy").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    contentRevision: integer("content_revision").notNull().default(0),
  },
  (table) => [uniqueIndex("eras_slug_idx").on(table.slug)]
);

export const eraMediaAssets = pgTable("era_media_assets", {
  id: serial("id").primaryKey(),
  eraId: integer("era_id").notNull(),
  assetType: varchar("asset_type", { length: 50 }).notNull(),
  mediaUrl: varchar("media_url", { length: 1500 }).notNull(),
  posterUrl: varchar("poster_url", { length: 1500 }),
  rightsState: varchar("rights_state", { length: 60 }).notNull().default("PENDING_VERIFICATION"),
  rightsEvidenceRef: varchar("rights_evidence_ref", { length: 1500 }),
  sourceLabel: varchar("source_label", { length: 255 }),
  sourceUrl: varchar("source_url", { length: 1500 }),
  brandName: varchar("brand_name", { length: 255 }),
  providerSlug: varchar("provider_slug", { length: 120 }),
  rightsStartsAt: timestamp("rights_starts_at"),
  rightsEndsAt: timestamp("rights_ends_at"),
  status: varchar("status", { length: 30 }).notNull().default("DRAFT"),
  sha256: varchar("sha256", { length: 64 }),
  altText: varchar("alt_text", { length: 500 }).notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eraSections = pgTable(
  "era_sections",
  {
    id: serial("id").primaryKey(),
    eraId: integer("era_id").notNull(),
    sectionType: varchar("section_type", { length: 60 }).notNull(),
    position: integer("position").notNull().default(0),
    config: json("config").$type<Record<string, unknown>>().notNull().default({}),
    status: varchar("status", { length: 30 }).notNull().default("ENABLED"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("era_sections_position_idx").on(table.eraId, table.position)]
);

export const eraProducts = pgTable(
  "era_products",
  {
    id: serial("id").primaryKey(),
    eraId: integer("era_id").notNull(),
    productId: integer("product_id").notNull(),
    position: integer("position").notNull().default(0),
    role: varchar("role", { length: 30 }).notNull().default("STANDARD"),
    curationReason: text("curation_reason").notNull().default(""),
    evidenceRef: varchar("evidence_ref", { length: 1500 }),
    status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    removedAt: timestamp("removed_at"),
  },
  (table) => [uniqueIndex("era_products_unique_idx").on(table.eraId, table.productId)]
);

export const eraWatchtowerBindings = pgTable(
  "era_watchtower_bindings",
  {
    id: serial("id").primaryKey(),
    eraId: integer("era_id").notNull(),
    watchJobSlug: varchar("watch_job_slug", { length: 160 }).notNull(),
    importance: integer("importance").notNull().default(50),
    publicFacet: varchar("public_facet", { length: 80 }),
    config: json("config").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("era_watchtower_bindings_unique_idx").on(
      table.eraId,
      table.watchJobSlug
    ),
  ]
);

export const eraEvents = pgTable("era_events", {
  id: serial("id").primaryKey(),
  eraId: integer("era_id").notNull(),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  actor: varchar("actor", { length: 120 }).notNull().default("system"),
  payload: json("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eraArchiveSnapshots = pgTable(
  "era_archive_snapshots",
  {
    id: serial("id").primaryKey(),
    eraId: integer("era_id").notNull(),
    snapshotKind: varchar("snapshot_kind", { length: 40 }).notNull().default("CLOSURE"),
    snapshotDigest: varchar("snapshot_digest", { length: 64 }).notNull(),
    snapshot: json("snapshot").$type<Record<string, unknown>>().notNull(),
    evidenceRef: varchar("evidence_ref", { length: 1500 }).notNull(),
    actor: varchar("actor", { length: 120 }).notNull().default("owner"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("era_archive_snapshots_digest_idx").on(table.snapshotDigest),
  ]
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull(),
    author: varchar("author", { length: 255 }).notNull(),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 255 }).notNull().default(""),
    body: text("body").notNull().default(""),
    verified: boolean("verified").notNull().default(false),
    buyerType: varchar("buyer_type", { length: 30 }).notNull().default("INDIVIDUAL"),
    businessName: varchar("business_name", { length: 255 }),
    fulfillmentRating: integer("fulfillment_rating"),
    purchaseExperienceRating: integer("purchase_experience_rating"),
    purchaseQuantityBand: varchar("purchase_quantity_band", { length: 30 }),
    repeatBuyer: boolean("repeat_buyer"),
    verificationState: varchar("verification_state", { length: 40 })
      .notNull()
      .default("UNVERIFIED"),
    moderationState: varchar("moderation_state", { length: 30 })
      .notNull()
      .default("PUBLISHED"),
    sourceChannel: varchar("source_channel", { length: 60 })
      .notNull()
      .default("NORVANA"),
    sourceLabel: varchar("source_label", { length: 255 })
      .notNull()
      .default("Norvana"),
    sourceOrderId: integer("source_order_id"),
    sourceReviewId: varchar("source_review_id", { length: 255 }),
    sourceUrl: varchar("source_url", { length: 1000 }),
    helpfulCount: integer("helpful_count").notNull().default(0),
    notHelpfulCount: integer("not_helpful_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("reviews_verified_order_product_idx")
      .on(table.productId, table.sourceOrderId)
      .where(sql`${table.sourceOrderId} IS NOT NULL`),
    uniqueIndex("reviews_external_source_id_idx")
      .on(table.sourceChannel, table.sourceLabel, table.sourceReviewId)
      .where(sql`${table.sourceReviewId} IS NOT NULL`),
  ]
);

export const reviewEvents = pgTable("review_events", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  eventType: varchar("event_type", { length: 60 }).notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewReactions = pgTable(
  "review_reactions",
  {
    id: serial("id").primaryKey(),
    reviewId: integer("review_id").notNull(),
    actorKeyHash: varchar("actor_key_hash", { length: 64 }).notNull(),
    reaction: varchar("reaction", { length: 30 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("review_reactions_review_actor_idx").on(
      table.reviewId,
      table.actorKeyHash
    ),
  ]
);

export const customerVoiceThrottle = pgTable(
  "customer_voice_throttle",
  {
    keyHash: varchar("key_hash", { length: 64 }).notNull(),
    action: varchar("action", { length: 30 }).notNull(),
    windowStartedAt: timestamp("window_started_at").notNull(),
    requestCount: integer("request_count").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customer_voice_throttle_key_action_idx").on(
      table.keyHash,
      table.action
    ),
  ]
);

export const marketRequests = pgTable(
  "market_requests",
  {
    id: serial("id").primaryKey(),
    requestKey: varchar("request_key", { length: 64 }).notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    category: varchar("category", { length: 30 }).notNull().default("product"),
    note: text("note").notNull().default(""),
    requestCount: integer("request_count").notNull().default(1),
    status: varchar("status", { length: 30 }).notNull().default("REQUESTED"),
    statusEvidenceRef: varchar("status_evidence_ref", { length: 1500 }),
    watchtowerCandidateId: integer("watchtower_candidate_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("market_requests_request_key_idx").on(table.requestKey)]
);


export const marketRequestEvents = pgTable("market_request_events", {
  id: serial("id").primaryKey(),
  marketRequestId: integer("market_request_id").notNull(),
  eventType: varchar("event_type", { length: 60 }).notNull(),
  fromStatus: varchar("from_status", { length: 30 }),
  toStatus: varchar("to_status", { length: 30 }),
  evidenceRef: varchar("evidence_ref", { length: 1500 }),
  publicNote: text("public_note").notNull().default(""),
  actor: varchar("actor", { length: 120 }).notNull().default("system"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customerWatchItems = pgTable(
  "customer_watch_items",
  {
    id: serial("id").primaryKey(),
    actorKeyHash: varchar("actor_key_hash", { length: 64 }).notNull(),
    targetType: varchar("target_type", { length: 30 }).notNull(),
    targetKey: varchar("target_key", { length: 255 }).notNull(),
    alertTypes: json("alert_types").$type<string[]>().notNull().default([]),
    priceThresholdCents: integer("price_threshold_cents"),
    status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customer_watch_items_actor_target_idx").on(
      table.actorKeyHash,
      table.targetType,
      table.targetKey
    ),
  ]
);

export const customerAlertEvents = pgTable(
  "customer_alert_events",
  {
    id: serial("id").primaryKey(),
    watchItemId: integer("watch_item_id").notNull(),
    eventType: varchar("event_type", { length: 60 }).notNull(),
    signalKey: varchar("signal_key", { length: 255 }).notNull(),
    fingerprint: varchar("fingerprint", { length: 64 }).notNull(),
    evidenceRef: varchar("evidence_ref", { length: 1500 }),
    payload: json("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: varchar("status", { length: 30 }).notNull().default("PENDING"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deliveredAt: timestamp("delivered_at"),
  },
  (table) => [
    uniqueIndex("customer_alert_events_fingerprint_idx").on(table.fingerprint),
  ]
);

export const productRoutes = pgTable("product_routes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  routeType: varchar("route_type", { length: 50 }).notNull(),
  providerSlug: varchar("provider_slug", { length: 120 }),
  sellerName: varchar("seller_name", { length: 255 }).notNull(),
  checkoutOwner: varchar("checkout_owner", { length: 30 }).notNull(),
  checkoutUrl: varchar("checkout_url", { length: 1500 }),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  productCondition: varchar("product_condition", { length: 40 }).notNull().default("NEW"),
  itemPriceCents: integer("item_price_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  estimatedTaxCents: integer("estimated_tax_cents"),
  totalCustomerPriceCents: integer("total_customer_price_cents").notNull(),
  deliveryMinDays: integer("delivery_min_days"),
  deliveryMaxDays: integer("delivery_max_days"),
  warrantySummary: text("warranty_summary").notNull().default(""),
  returnSummary: text("return_summary").notNull().default(""),
  authorizationState: varchar("authorization_state", { length: 60 }).notNull().default("UNVERIFIED"),
  provenanceState: varchar("provenance_state", { length: 60 }).notNull().default("UNVERIFIED"),
  status: varchar("status", { length: 30 }).notNull().default("QUALIFYING"),
  evidenceRef: varchar("evidence_ref", { length: 1500 }),
  lastVerifiedAt: timestamp("last_verified_at"),
  internalContributionCents: integer("internal_contribution_cents"),
  internalContributionMarginBps: integer("internal_contribution_margin_bps"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productRouteObservations = pgTable("product_route_observations", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull(),
  itemPriceCents: integer("item_price_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  estimatedTaxCents: integer("estimated_tax_cents"),
  totalCustomerPriceCents: integer("total_customer_price_cents").notNull(),
  stockState: varchar("stock_state", { length: 40 }).notNull().default("UNKNOWN"),
  deliveryMinDays: integer("delivery_min_days"),
  deliveryMaxDays: integer("delivery_max_days"),
  sourceDigest: varchar("source_digest", { length: 128 }),
  evidenceRef: varchar("evidence_ref", { length: 1500 }),
  observedAt: timestamp("observed_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  shippingAddress: text("shipping_address").notNull(),
  items: json("items").$type<OrderItem[]>().notNull().default([]),
  subtotal: real("subtotal").notNull(),
  shipping: real("shipping").notNull().default(0),
  total: real("total").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("unpaid"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  supplierOrderIds: json("supplier_order_ids").$type<Record<string, string>>().default({}), // Track orders placed with suppliers
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrderItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  supplierId?: number;
  supplierSku?: string;
};

// Enhanced suppliers table with API integration support
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("manual"), // manual, api, dropship, wholesale
  platform: varchar("platform", { length: 100 }), // shopify, woocommerce, alibaba, faire, etc.
  url: varchar("url", { length: 500 }).notNull().default(""),
  contactEmail: varchar("contact_email", { length: 255 }).notNull().default(""),
  notes: text("notes").notNull().default(""),
  niches: json("niches").$type<string[]>().notNull().default([]), // Which niches this supplier covers
  isActive: boolean("is_active").notNull().default(true),
  autoFulfill: boolean("auto_fulfill").notNull().default(false), // Automatically send orders
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Store API credentials securely (encrypted in production)
export const supplierCredentials = pgTable("supplier_credentials", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  apiKey: varchar("api_key", { length: 500 }),
  apiSecret: varchar("api_secret", { length: 500 }),
  accessToken: varchar("access_token", { length: 1000 }),
  refreshToken: varchar("refresh_token", { length: 1000 }),
  shopDomain: varchar("shop_domain", { length: 255 }), // For Shopify suppliers
  webhookSecret: varchar("webhook_secret", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  additionalConfig: json("additional_config").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Track supplier product catalog sync
export const supplierProducts = pgTable("supplier_products", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  externalId: varchar("external_id", { length: 255 }).notNull(), // Product ID at supplier
  sku: varchar("sku", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  wholesalePrice: real("wholesale_price").notNull(),
  retailPrice: real("retail_price"),
  inventory: integer("inventory").notNull().default(0),
  category: varchar("category", { length: 100 }),
  images: json("images").$type<string[]>().notNull().default([]),
  variants: json("variants").$type<ProductVariant[]>().default([]),
  isImported: boolean("is_imported").notNull().default(false), // If imported to our catalog
  localProductId: integer("local_product_id"), // Link to our products table
  lastSyncAt: timestamp("last_sync_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProductVariant = {
  id: string;
  name: string;
  sku?: string;
  price: number;
  inventory: number;
  options: Record<string, string>;
};

// Track orders sent to suppliers
export const supplierOrders = pgTable("supplier_orders", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(), // Our order ID
  supplierId: integer("supplier_id").notNull(),
  externalOrderId: varchar("external_order_id", { length: 255 }), // Order ID at supplier
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, submitted, confirmed, shipped, delivered, failed
  trackingNumber: varchar("tracking_number", { length: 255 }),
  trackingUrl: varchar("tracking_url", { length: 500 }),
  shippingCarrier: varchar("shipping_carrier", { length: 100 }),
  items: json("items").$type<SupplierOrderItem[]>().notNull().default([]),
  totalCost: real("total_cost").notNull().default(0),
  response: json("response").$type<Record<string, unknown>>().default({}), // API response
  errorMessage: text("error_message"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SupplierOrderItem = {
  supplierProductId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
};

export const nicheVolumes = pgTable("niche_volumes", {
  id: serial("id").primaryKey(),
  volumeNumber: integer("volume_number").notNull(),
  niche: varchar("niche", { length: 100 }).notNull(),
  description: text("description").notNull().default(""),
  heroImage: varchar("hero_image", { length: 500 }).notNull().default(""),
  startDate: varchar("start_date", { length: 50 }).notNull().default(""),
  endDate: varchar("end_date", { length: 50 }).notNull().default(""),
  isActive: boolean("is_active").notNull().default(false),
});

export const subscribers = pgTable(
  "subscribers",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("subscribers_email_idx").on(table.email)]
);

export const debugLogs = pgTable("debug_logs", {
  id: serial("id").primaryKey(),
  scanId: varchar("scan_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  summary: text("summary").notNull().default(""),
  issues: json("issues").$type<string[]>().notNull().default([]),
  backupCreated: boolean("backup_created").notNull().default(false),
  fixesApplied: integer("fixes_applied").notNull().default(0),
  duration: integer("duration").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const codeBackups = pgTable("code_backups", {
  id: serial("id").primaryKey(),
  scanId: varchar("scan_id", { length: 100 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  content: text("content").notNull(),
  checksum: varchar("checksum", { length: 100 }).notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const progressNotes = pgTable("progress_notes", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull().default("note"),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull().default(""),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  priority: varchar("priority", { length: 50 }).notNull().default("medium"),
  category: varchar("category", { length: 100 }).notNull().default("general"),
  dueDate: varchar("due_date", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stripe payment records
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).notNull(),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  amount: integer("amount").notNull(), // In cents
  currency: varchar("currency", { length: 10 }).notNull().default("usd"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  customerEmail: varchar("customer_email", { length: 255 }),
  receiptUrl: varchar("receipt_url", { length: 500 }),
  metadata: json("metadata").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const watchJobs = pgTable(
  "watch_jobs",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 80 }).notNull().default("general"),
    description: text("description").notNull().default(""),
    instructions: text("instructions").notNull().default(""),
    authority: varchar("authority", { length: 30 }).notNull().default("OBSERVE"),
    status: varchar("status", { length: 30 }).notNull().default("PAUSED"),
    cadenceMinutes: integer("cadence_minutes").notNull().default(1440),
    budgetCents: integer("budget_cents").notNull().default(0),
    notifyOnMaterialOnly: boolean("notify_on_material_only").notNull().default(true),
    sourcePolicy: json("source_policy").$type<Record<string, unknown>>().notNull().default({}),
    nextRunAt: timestamp("next_run_at"),
    lastRunAt: timestamp("last_run_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("watch_jobs_slug_idx").on(table.slug)]
);

export const watchRuns = pgTable("watch_runs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("QUEUED"),
  trigger: varchar("trigger", { length: 30 }).notNull().default("SCHEDULE"),
  runtimeId: varchar("runtime_id", { length: 255 }),
  summary: text("summary").notNull().default(""),
  findings: json("findings").$type<Record<string, unknown>[]>().notNull().default([]),
  evidenceRefs: json("evidence_refs").$type<Record<string, unknown>[]>().notNull().default([]),
  modelProvider: varchar("model_provider", { length: 100 }),
  estimatedCostCents: integer("estimated_cost_cents").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchCandidates = pgTable("watch_candidates", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  runId: integer("run_id"),
  title: varchar("title", { length: 255 }).notNull(),
  lane: varchar("lane", { length: 60 }).notNull().default("general"),
  sourceName: varchar("source_name", { length: 255 }).notNull().default(""),
  sourceUrl: varchar("source_url", { length: 1000 }).notNull().default(""),
  sourceCountry: varchar("source_country", { length: 100 }),
  truthState: varchar("truth_state", { length: 60 }).notNull().default("DISCOVERED"),
  economics: json("economics").$type<Record<string, unknown>>().notNull().default({}),
  riskFlags: json("risk_flags").$type<string[]>().notNull().default([]),
  evidence: json("evidence").$type<Record<string, unknown>[]>().notNull().default([]),
  recommendation: text("recommendation").notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("NEW"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const watchCandidateSnapshots = pgTable("watch_candidate_snapshots", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  providerSlug: varchar("provider_slug", { length: 120 }),
  sourceKind: varchar("source_kind", { length: 80 }).notNull().default("WEB"),
  identity: json("identity").$type<Record<string, unknown>>().notNull().default({}),
  pricing: json("pricing").$type<Record<string, unknown>>().notNull().default({}),
  supply: json("supply").$type<Record<string, unknown>>().notNull().default({}),
  trust: json("trust").$type<Record<string, unknown>>().notNull().default({}),
  demand: json("demand").$type<Record<string, unknown>>().notNull().default({}),
  economics: json("economics").$type<Record<string, unknown>>().notNull().default({}),
  scorecard: json("scorecard").$type<Record<string, unknown>>().notNull().default({}),
  riskFlags: json("risk_flags").$type<string[]>().notNull().default([]),
  evidenceRefs: json("evidence_refs").$type<Record<string, unknown>[]>().notNull().default([]),
  sourceDigest: varchar("source_digest", { length: 128 }),
  observedAt: timestamp("observed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const demandObservations = pgTable("demand_observations", {
  id: serial("id").primaryKey(),
  subjectType: varchar("subject_type", { length: 40 }).notNull(),
  subjectKey: varchar("subject_key", { length: 255 }).notNull(),
  internalRequests: integer("internal_requests"),
  sellThroughRate: real("sell_through_rate"),
  repeatPurchaseRate: real("repeat_purchase_rate"),
  searchTrendIndex: real("search_trend_index"),
  customerVoiceScore: real("customer_voice_score"),
  velocityIndex: real("velocity_index"),
  sampleSize: integer("sample_size"),
  evidenceRef: varchar("evidence_ref", { length: 1500 }).notNull(),
  observedAt: timestamp("observed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveryObservations = pgTable("delivery_observations", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id"),
  supplierId: integer("supplier_id"),
  carrier: varchar("carrier", { length: 120 }).notNull().default(""),
  serviceLevel: varchar("service_level", { length: 120 }).notNull().default(""),
  originRegion: varchar("origin_region", { length: 160 }).notNull().default(""),
  destinationRegion: varchar("destination_region", { length: 160 }).notNull().default(""),
  handlingHours: integer("handling_hours").notNull().default(0),
  transitHours: integer("transit_hours").notNull().default(0),
  promisedHours: integer("promised_hours"),
  deliveredOnTime: boolean("delivered_on_time").notNull().default(false),
  lost: boolean("lost").notNull().default(false),
  damaged: boolean("damaged").notNull().default(false),
  trackingGapHours: integer("tracking_gap_hours"),
  evidenceRef: varchar("evidence_ref", { length: 1500 }).notNull(),
  observedAt: timestamp("observed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const darwinEvaluations = pgTable("darwin_evaluations", {
  id: serial("id").primaryKey(),
  subjectType: varchar("subject_type", { length: 40 }).notNull(),
  subjectKey: varchar("subject_key", { length: 255 }).notNull(),
  candidateKey: varchar("candidate_key", { length: 255 }).notNull(),
  policyVersion: varchar("policy_version", { length: 80 }).notNull().default("DARWIN_R0"),
  eligible: boolean("eligible").notNull(),
  fitnessScore: integer("fitness_score").notNull(),
  rejectionCodes: json("rejection_codes").$type<string[]>().notNull().default([]),
  economics: json("economics").$type<Record<string, unknown>>().notNull().default({}),
  demand: json("demand").$type<Record<string, unknown>>().notNull().default({}),
  delivery: json("delivery").$type<Record<string, unknown>>().notNull().default({}),
  risks: json("risks").$type<Record<string, unknown>>().notNull().default({}),
  evidenceRefs: json("evidence_refs").$type<string[]>().notNull().default([]),
  evaluatedAt: timestamp("evaluated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const producerInterestSubmissions = pgTable("producer_interest_submissions", {
  id: serial("id").primaryKey(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 80 }),
  location: varchar("location", { length: 255 }).notNull(),
  website: varchar("website", { length: 1000 }),
  productCategories: json("product_categories").$type<string[]>().notNull().default([]),
  seasonality: text("seasonality").notNull().default(""),
  salesModel: varchar("sales_model", { length: 40 }).notNull().default("UNKNOWN"),
  fulfillmentModes: json("fulfillment_modes").$type<string[]>().notNull().default([]),
  leadTimeNotes: text("lead_time_notes").notNull().default(""),
  capacityNotes: text("capacity_notes").notNull().default(""),
  painPoint: text("pain_point").notNull().default(""),
  pilotInterest: varchar("pilot_interest", { length: 20 }).notNull().default("YES"),
  mediaInterest: varchar("media_interest", { length: 20 }).notNull().default("DISCUSS"),
  status: varchar("status", { length: 40 }).notNull().default("NEW"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const localProducers = pgTable(
  "local_producers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    channel: varchar("channel", { length: 40 }).notNull().default("FARM"),
    status: varchar("status", { length: 40 }).notNull().default("PROSPECT"),
    contactName: varchar("contact_name", { length: 255 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    website: varchar("website", { length: 1000 }),
    serviceAreas: json("service_areas").$type<string[]>().notNull().default([]),
    productCategories: json("product_categories").$type<string[]>().notNull().default([]),
    seasonalNotes: text("seasonal_notes").notNull().default(""),
    wholesaleAvailable: boolean("wholesale_available").notNull().default(false),
    minimumOrderCents: integer("minimum_order_cents"),
    leadTimeHours: integer("lead_time_hours"),
    fulfillmentModes: json("fulfillment_modes").$type<string[]>().notNull().default([]),
    shipsNationally: boolean("ships_nationally").notNull().default(false),
    coldChainRequired: boolean("cold_chain_required").notNull().default(false),
    currentDeliveryDays: json("current_delivery_days").$type<string[]>().notNull().default([]),
    packagingNotes: text("packaging_notes").notNull().default(""),
    insuranceNotes: text("insurance_notes").notNull().default(""),
    foodSafetyNotes: text("food_safety_notes").notNull().default(""),
    mediaPermissionStatus: varchar("media_permission_status", { length: 30 }).notNull().default("UNKNOWN"),
    pilotInterest: varchar("pilot_interest", { length: 20 }).notNull().default("UNKNOWN"),
    capacityNotes: text("capacity_notes").notNull().default(""),
    paymentPreference: text("payment_preference").notNull().default(""),
    biggestPainPoint: text("biggest_pain_point").notNull().default(""),
    evidenceRefs: json("evidence_refs").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("local_producers_name_idx").on(table.name)]
);

export const watchtowerSignals = pgTable(
  "watchtower_signals",
  {
    id: serial("id").primaryKey(),
    signalKey: varchar("signal_key", { length: 255 }).notNull(),
    signalType: varchar("signal_type", { length: 80 }).notNull(),
    subjectType: varchar("subject_type", { length: 40 }).notNull(),
    subjectKey: varchar("subject_key", { length: 255 }).notNull(),
    truthState: varchar("truth_state", { length: 30 }).notNull().default("OBSERVED"),
    sourceKind: varchar("source_kind", { length: 60 }).notNull(),
    evidenceRef: varchar("evidence_ref", { length: 1500 }).notNull(),
    observedAt: timestamp("observed_at").notNull(),
    expiresAt: timestamp("expires_at"),
    publicPayload: json("public_payload").$type<Record<string, unknown>>().notNull().default({}),
    privatePayload: json("private_payload").$type<Record<string, unknown>>().notNull().default({}),
    payloadDigest: varchar("payload_digest", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("watchtower_signals_signal_key_idx").on(table.signalKey)]
);

export const watchtowerSignalProjections = pgTable(
  "watchtower_signal_projections",
  {
    id: serial("id").primaryKey(),
    signalId: integer("signal_id").notNull(),
    projector: varchar("projector", { length: 100 }).notNull(),
    projectionKey: varchar("projection_key", { length: 255 }).notNull(),
    result: json("result").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("watchtower_signal_projections_signal_projector_idx").on(
      table.signalId,
      table.projector
    ),
    uniqueIndex("watchtower_signal_projections_key_idx").on(table.projectionKey),
  ]
);

export const actionReceipts = pgTable("action_receipts", {
  id: serial("id").primaryKey(),
  actionType: varchar("action_type", { length: 100 }).notNull(),
  authorityClass: varchar("authority_class", { length: 30 }).notNull().default("OBSERVE"),
  subjectType: varchar("subject_type", { length: 80 }).notNull().default("watchtower"),
  subjectId: varchar("subject_id", { length: 255 }).notNull().default(""),
  status: varchar("status", { length: 30 }).notNull(),
  actor: varchar("actor", { length: 120 }).notNull().default("norvana"),
  details: json("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 120 }).notNull().default("owner"),
    role: varchar("role", { length: 30 }).notNull().default("owner"),
    passwordSalt: varchar("password_salt", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    bootstrapDerived: boolean("bootstrap_derived").notNull().default(false),
    sessionVersion: integer("session_version").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("admin_users_username_idx").on(table.username)]
);


export const adminAuthThrottle = pgTable("admin_auth_throttle", {
  keyHash: varchar("key_hash", { length: 64 }).primaryKey(),
  action: varchar("action", { length: 30 }).notNull(),
  windowStartedAt: timestamp("window_started_at").notNull(),
  failureCount: integer("failure_count").notNull().default(0),
  blockedUntil: timestamp("blocked_until"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
