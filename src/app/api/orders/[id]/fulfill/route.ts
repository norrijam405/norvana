import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products, suppliers, supplierCredentials, supplierOrders, type OrderItem } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSupplierConnector, type SupplierPlatform, type OrderSubmitPayload } from "@/lib/supplier-integrations";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    // Get order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus !== "paid") {
      return NextResponse.json({ error: "Order not paid" }, { status: 400 });
    }

    // Parse shipping address
    const addressParts = order.shippingAddress.split(", ");
    const shippingAddress = {
      name: order.customerName,
      address1: addressParts[0] || "",
      city: addressParts[1] || "",
      state: addressParts[2]?.split(" ")[0] || "",
      zip: addressParts[2]?.split(" ")[1] || "",
      country: "US",
    };

    // Group items by supplier
    const orderItems = order.items as OrderItem[];
    const itemsBySupplier: Record<number, OrderItem[]> = {};

    for (const item of orderItems) {
      // Get product to find supplier
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (product?.supplierId) {
        if (!itemsBySupplier[product.supplierId]) {
          itemsBySupplier[product.supplierId] = [];
        }
        itemsBySupplier[product.supplierId].push({
          ...item,
          supplierId: product.supplierId,
          supplierSku: product.supplierSku || undefined,
        });
      }
    }

    const results: Record<string, unknown> = {};
    const supplierOrderIds: Record<string, string> = {};

    // Process each supplier
    for (const [supplierIdStr, items] of Object.entries(itemsBySupplier)) {
      const supplierId = parseInt(supplierIdStr);

      // Get supplier
      const [supplier] = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, supplierId));

      if (!supplier || supplier.type === "manual") {
        results[supplierIdStr] = { status: "manual", message: "Manual processing required" };
        continue;
      }

      // Get credentials
      const [creds] = await db
        .select()
        .from(supplierCredentials)
        .where(eq(supplierCredentials.supplierId, supplierId));

      if (!creds) {
        results[supplierIdStr] = { status: "error", message: "No credentials" };
        continue;
      }

      // Create connector
      const connector = createSupplierConnector(supplier.platform as SupplierPlatform, {
        apiKey: creds.apiKey || undefined,
        apiSecret: creds.apiSecret || undefined,
        accessToken: creds.accessToken || undefined,
        shopDomain: creds.shopDomain || undefined,
      });

      if (!connector) {
        results[supplierIdStr] = { status: "error", message: "Platform not supported" };
        continue;
      }

      // Submit order
      const payload: OrderSubmitPayload = {
        items: items.map((item) => ({
          externalProductId: item.supplierSku || String(item.productId),
          sku: item.supplierSku || "",
          quantity: item.quantity,
        })),
        shippingAddress,
        customerEmail: order.customerEmail,
        orderReference: order.orderNumber,
      };

      const submitResult = await connector.submitOrder(payload);

      // Record supplier order
      await db.insert(supplierOrders).values({
        orderId,
        supplierId,
        externalOrderId: submitResult.externalOrderId || null,
        status: submitResult.success ? "submitted" : "failed",
        trackingNumber: submitResult.trackingNumber || null,
        trackingUrl: submitResult.trackingUrl || null,
        items: items.map((item) => ({
          supplierProductId: item.supplierSku || String(item.productId),
          sku: item.supplierSku || "",
          name: item.name,
          quantity: item.quantity,
          unitCost: 0, // Would need product cost
        })),
        totalCost: 0,
        response: submitResult.rawResponse as Record<string, unknown> || {},
        errorMessage: submitResult.error || null,
        submittedAt: new Date(),
      });

      if (submitResult.success && submitResult.externalOrderId) {
        supplierOrderIds[supplierIdStr] = submitResult.externalOrderId;
      }

      results[supplierIdStr] = submitResult;
    }

    // Update order with supplier order IDs
    await db
      .update(orders)
      .set({
        supplierOrderIds,
        status: Object.values(results).every((r: unknown) => 
          (r as { success?: boolean }).success || (r as { status?: string }).status === "manual"
        ) ? "processing" : "pending",
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({
      orderId,
      fulfillmentResults: results,
      supplierOrderIds,
    });
  } catch (error) {
    console.error("Fulfillment error:", error);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }
}
