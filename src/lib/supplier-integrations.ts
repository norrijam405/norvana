// Supplier Integration Connectors
// Each connector handles API communication with different supplier platforms

export type SupplierPlatform = 
  | "shopify"
  | "woocommerce"
  | "faire"
  | "alibaba"
  | "printful"
  | "spocket"
  | "modalyst"
  | "oberlo"
  | "cjdropshipping"
  | "manual";

export type SupplierCredentials = {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  shopDomain?: string;
  additionalConfig?: Record<string, string>;
};

export type ProductSyncResult = {
  success: boolean;
  products: SyncedProduct[];
  errors: string[];
  nextCursor?: string;
};

export type SyncedProduct = {
  externalId: string;
  sku: string;
  name: string;
  description: string;
  wholesalePrice: number;
  retailPrice: number;
  inventory: number;
  category: string;
  images: string[];
  variants: {
    id: string;
    name: string;
    sku: string;
    price: number;
    inventory: number;
    options: Record<string, string>;
  }[];
};

export type OrderSubmitResult = {
  success: boolean;
  externalOrderId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  error?: string;
  rawResponse?: unknown;
};

export type OrderSubmitPayload = {
  items: {
    externalProductId: string;
    sku: string;
    quantity: number;
  }[];
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  customerEmail: string;
  orderReference: string; // Our order number
};

// Base connector interface
export interface SupplierConnector {
  platform: SupplierPlatform;
  testConnection(): Promise<{ success: boolean; message: string }>;
  syncProducts(cursor?: string): Promise<ProductSyncResult>;
  submitOrder(payload: OrderSubmitPayload): Promise<OrderSubmitResult>;
  getOrderStatus(externalOrderId: string): Promise<{ status: string; tracking?: string }>;
  getInventory(productIds: string[]): Promise<Record<string, number>>;
}

// ============ SHOPIFY SUPPLIER CONNECTOR ============
export class ShopifySupplierConnector implements SupplierConnector {
  platform: SupplierPlatform = "shopify";
  private shopDomain: string;
  private accessToken: string;

  constructor(credentials: SupplierCredentials) {
    this.shopDomain = credentials.shopDomain || "";
    this.accessToken = credentials.accessToken || "";
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `https://${this.shopDomain}/admin/api/2024-01${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response.json();
  }

  async testConnection() {
    try {
      const data = await this.fetch("/shop.json");
      if (data.shop) {
        return { success: true, message: `Connected to ${data.shop.name}` };
      }
      return { success: false, message: "Invalid response from Shopify" };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  }

  async syncProducts(cursor?: string): Promise<ProductSyncResult> {
    try {
      const params = cursor ? `?page_info=${cursor}` : "?limit=50";
      const data = await this.fetch(`/products.json${params}`);
      
      const products: SyncedProduct[] = (data.products || []).map((p: Record<string, unknown>) => ({
        externalId: String(p.id),
        sku: (p.variants as Array<{sku: string}>)?.[0]?.sku || "",
        name: String(p.title),
        description: String(p.body_html || ""),
        wholesalePrice: parseFloat(String((p.variants as Array<{price: string}>)?.[0]?.price || "0")),
        retailPrice: parseFloat(String((p.variants as Array<{compare_at_price: string}>)?.[0]?.compare_at_price || "0")),
        inventory: (p.variants as Array<{inventory_quantity: number}>)?.reduce((sum: number, v) => sum + (v.inventory_quantity || 0), 0) || 0,
        category: String(p.product_type || ""),
        images: ((p.images as Array<{src: string}>) || []).map((img) => img.src),
        variants: ((p.variants as Array<Record<string, unknown>>) || []).map((v) => ({
          id: String(v.id),
          name: String(v.title),
          sku: String(v.sku || ""),
          price: parseFloat(String(v.price || "0")),
          inventory: Number(v.inventory_quantity) || 0,
          options: {
            option1: String(v.option1 || ""),
            option2: String(v.option2 || ""),
            option3: String(v.option3 || ""),
          },
        })),
      }));

      return { success: true, products, errors: [] };
    } catch (error) {
      return { success: false, products: [], errors: [String(error)] };
    }
  }

  async submitOrder(payload: OrderSubmitPayload): Promise<OrderSubmitResult> {
    try {
      const orderData = {
        order: {
          line_items: payload.items.map((item) => ({
            variant_id: item.externalProductId,
            quantity: item.quantity,
          })),
          shipping_address: {
            first_name: payload.shippingAddress.name.split(" ")[0],
            last_name: payload.shippingAddress.name.split(" ").slice(1).join(" "),
            address1: payload.shippingAddress.address1,
            address2: payload.shippingAddress.address2,
            city: payload.shippingAddress.city,
            province: payload.shippingAddress.state,
            zip: payload.shippingAddress.zip,
            country: payload.shippingAddress.country,
            phone: payload.shippingAddress.phone,
          },
          email: payload.customerEmail,
          note: `Reference: ${payload.orderReference}`,
          financial_status: "paid",
        },
      };

      const data = await this.fetch("/orders.json", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      if (data.order) {
        return {
          success: true,
          externalOrderId: String(data.order.id),
          rawResponse: data,
        };
      }

      return { success: false, error: "Failed to create order", rawResponse: data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getOrderStatus(externalOrderId: string) {
    try {
      const data = await this.fetch(`/orders/${externalOrderId}.json`);
      const fulfillment = data.order?.fulfillments?.[0];
      return {
        status: data.order?.fulfillment_status || "unfulfilled",
        tracking: fulfillment?.tracking_number,
      };
    } catch {
      return { status: "unknown" };
    }
  }

  async getInventory(productIds: string[]) {
    const inventory: Record<string, number> = {};
    for (const id of productIds) {
      try {
        const data = await this.fetch(`/products/${id}.json`);
        const total = (data.product?.variants || []).reduce(
          (sum: number, v: { inventory_quantity: number }) => sum + (v.inventory_quantity || 0),
          0
        );
        inventory[id] = total;
      } catch {
        inventory[id] = 0;
      }
    }
    return inventory;
  }
}

// ============ PRINTFUL CONNECTOR (Print-on-Demand) ============
export class PrintfulConnector implements SupplierConnector {
  platform: SupplierPlatform = "printful";
  private apiKey: string;

  constructor(credentials: SupplierCredentials) {
    this.apiKey = credentials.apiKey || "";
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`https://api.printful.com${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response.json();
  }

  async testConnection() {
    try {
      const data = await this.fetch("/stores");
      if (data.result) {
        return { success: true, message: "Connected to Printful" };
      }
      return { success: false, message: "Invalid API key" };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  }

  async syncProducts(): Promise<ProductSyncResult> {
    try {
      const data = await this.fetch("/store/products");
      const products: SyncedProduct[] = (data.result || []).map((p: Record<string, unknown>) => ({
        externalId: String(p.id),
        sku: String(p.external_id || ""),
        name: String(p.name),
        description: "",
        wholesalePrice: 0, // Printful calculates on order
        retailPrice: 0,
        inventory: 999, // Print-on-demand = unlimited
        category: "print-on-demand",
        images: [String(p.thumbnail_url || "")],
        variants: [],
      }));
      return { success: true, products, errors: [] };
    } catch (error) {
      return { success: false, products: [], errors: [String(error)] };
    }
  }

  async submitOrder(payload: OrderSubmitPayload): Promise<OrderSubmitResult> {
    try {
      const orderData = {
        recipient: {
          name: payload.shippingAddress.name,
          address1: payload.shippingAddress.address1,
          address2: payload.shippingAddress.address2,
          city: payload.shippingAddress.city,
          state_code: payload.shippingAddress.state,
          zip: payload.shippingAddress.zip,
          country_code: payload.shippingAddress.country,
          phone: payload.shippingAddress.phone,
          email: payload.customerEmail,
        },
        items: payload.items.map((item) => ({
          sync_variant_id: item.externalProductId,
          quantity: item.quantity,
        })),
        external_id: payload.orderReference,
      };

      const data = await this.fetch("/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      if (data.result) {
        return {
          success: true,
          externalOrderId: String(data.result.id),
          rawResponse: data,
        };
      }
      return { success: false, error: data.error?.message || "Order failed" };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getOrderStatus(externalOrderId: string) {
    try {
      const data = await this.fetch(`/orders/${externalOrderId}`);
      return {
        status: data.result?.status || "unknown",
        tracking: data.result?.shipments?.[0]?.tracking_number,
      };
    } catch {
      return { status: "unknown" };
    }
  }

  async getInventory() {
    // Print-on-demand = always available
    return {};
  }
}

// ============ CJ DROPSHIPPING CONNECTOR ============
export class CJDropshippingConnector implements SupplierConnector {
  platform: SupplierPlatform = "cjdropshipping";
  private apiKey: string;

  constructor(credentials: SupplierCredentials) {
    this.apiKey = credentials.apiKey || "";
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`https://developers.cjdropshipping.com/api2.0${endpoint}`, {
      ...options,
      headers: {
        "CJ-Access-Token": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response.json();
  }

  async testConnection() {
    try {
      const data = await this.fetch("/v1/authentication/getAccessToken");
      if (data.result) {
        return { success: true, message: "Connected to CJ Dropshipping" };
      }
      return { success: false, message: "Authentication failed" };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  }

  async syncProducts(cursor?: string): Promise<ProductSyncResult> {
    try {
      const data = await this.fetch("/v1/product/list", {
        method: "POST",
        body: JSON.stringify({ pageNum: cursor ? parseInt(cursor) : 1, pageSize: 50 }),
      });

      const products: SyncedProduct[] = (data.data?.list || []).map((p: Record<string, unknown>) => ({
        externalId: String(p.pid),
        sku: String(p.productSku || ""),
        name: String(p.productNameEn),
        description: String(p.description || ""),
        wholesalePrice: Number(p.sellPrice) || 0,
        retailPrice: Number(p.sellPrice) * 2 || 0,
        inventory: 999,
        category: String(p.categoryName || ""),
        images: ((p.productImage as string) || "").split(";").filter(Boolean),
        variants: ((p.variants as Array<Record<string, unknown>>) || []).map((v) => ({
          id: String(v.vid),
          name: String(v.variantNameEn || ""),
          sku: String(v.variantSku || ""),
          price: Number(v.variantSellPrice) || 0,
          inventory: 999,
          options: {},
        })),
      }));

      return { 
        success: true, 
        products, 
        errors: [],
        nextCursor: data.data?.pageNum ? String(data.data.pageNum + 1) : undefined,
      };
    } catch (error) {
      return { success: false, products: [], errors: [String(error)] };
    }
  }

  async submitOrder(payload: OrderSubmitPayload): Promise<OrderSubmitResult> {
    try {
      const orderData = {
        orderNumber: payload.orderReference,
        shippingZip: payload.shippingAddress.zip,
        shippingCountry: payload.shippingAddress.country,
        shippingProvince: payload.shippingAddress.state,
        shippingCity: payload.shippingAddress.city,
        shippingAddress: payload.shippingAddress.address1,
        shippingAddress2: payload.shippingAddress.address2 || "",
        shippingCustomerName: payload.shippingAddress.name,
        shippingPhone: payload.shippingAddress.phone || "",
        products: payload.items.map((item) => ({
          vid: item.externalProductId,
          quantity: item.quantity,
        })),
      };

      const data = await this.fetch("/v1/shopping/order/createOrder", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      if (data.result && data.data) {
        return {
          success: true,
          externalOrderId: data.data.orderId,
          rawResponse: data,
        };
      }
      return { success: false, error: data.message || "Order failed" };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getOrderStatus(externalOrderId: string) {
    try {
      const data = await this.fetch(`/v1/shopping/order/getOrderDetail?orderId=${externalOrderId}`);
      return {
        status: data.data?.orderStatus || "unknown",
        tracking: data.data?.trackNumber,
      };
    } catch {
      return { status: "unknown" };
    }
  }

  async getInventory(productIds: string[]) {
    // CJ Dropshipping manages their own inventory
    const inventory: Record<string, number> = {};
    productIds.forEach((id) => (inventory[id] = 999));
    return inventory;
  }
}

// ============ FACTORY FUNCTION ============
export function createSupplierConnector(
  platform: SupplierPlatform,
  credentials: SupplierCredentials
): SupplierConnector | null {
  switch (platform) {
    case "shopify":
      return new ShopifySupplierConnector(credentials);
    case "printful":
      return new PrintfulConnector(credentials);
    case "cjdropshipping":
      return new CJDropshippingConnector(credentials);
    default:
      return null;
  }
}

// Supported platforms with their requirements
export const SUPPORTED_PLATFORMS = [
  {
    id: "shopify",
    name: "Shopify",
    description: "Connect to any Shopify store for wholesale or dropship",
    logo: "🛒",
    requiredFields: ["shopDomain", "accessToken"],
    niches: ["all"],
  },
  {
    id: "printful",
    name: "Printful",
    description: "Print-on-demand for custom merchandise",
    logo: "👕",
    requiredFields: ["apiKey"],
    niches: ["apparel", "home-decor", "accessories"],
  },
  {
    id: "cjdropshipping",
    name: "CJ Dropshipping",
    description: "Global dropshipping with fast shipping",
    logo: "📦",
    requiredFields: ["apiKey"],
    niches: ["all"],
  },
  {
    id: "faire",
    name: "Faire",
    description: "Wholesale marketplace for independent brands",
    logo: "🏪",
    requiredFields: ["apiKey", "apiSecret"],
    niches: ["home-decor", "kitchen", "wellness", "beauty"],
  },
  {
    id: "alibaba",
    name: "Alibaba",
    description: "Direct from manufacturers in Asia",
    logo: "🏭",
    requiredFields: ["apiKey", "apiSecret"],
    niches: ["all"],
  },
  {
    id: "spocket",
    name: "Spocket",
    description: "US & EU dropshipping suppliers",
    logo: "🚚",
    requiredFields: ["accessToken"],
    niches: ["all"],
  },
  {
    id: "modalyst",
    name: "Modalyst",
    description: "Curated dropship brands and independents",
    logo: "✨",
    requiredFields: ["apiKey"],
    niches: ["fashion", "home-decor", "beauty"],
  },
  {
    id: "manual",
    name: "Manual",
    description: "Traditional supplier - manual order processing",
    logo: "📋",
    requiredFields: [],
    niches: ["all"],
  },
];
