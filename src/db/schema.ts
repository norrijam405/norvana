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
  images: json("images").$type<string[]>().notNull().default([]),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  inventory: integer("inventory").notNull().default(100),
  tags: json("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 255 }).notNull().default(""),
  body: text("body").notNull().default(""),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
