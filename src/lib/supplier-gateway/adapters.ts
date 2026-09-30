import { getSupplierRegistryProfile } from "./registry.ts";
import { evaluateSupplierReadiness } from "./policy.ts";
import type {
  NorvanaReadOnlySupplierAdapter,
  LocalSupplierOrderSimulation,
  NormalizedDeliveryEstimate,
  NormalizedReturnPolicy,
  NormalizedShippingQuote,
  NormalizedSupplierProduct,
  NormalizedSupplierVariant,
  NormalizedSupplierWarehouse,
  NormalizedWebhookVerification,
  SupplierReadCapability,
  SupplierReadResult,
} from "./types.ts";

function notBound<T>(
  providerId: string,
  capability: SupplierReadCapability
): SupplierReadResult<T> {
  const profile = getSupplierRegistryProfile(providerId);
  if (!profile) {
    return {
      ok: false,
      code: "SUPPLIER_CAPABILITY_NOT_PROVEN",
      providerId,
      capability,
      message: "Supplier is not present in the Norvana R0 registry.",
    };
  }

  const gate = evaluateSupplierReadiness(profile, capability);
  if (!gate.ok) {
    const code =
      gate.code === "NORVANA_SUPPLIER_EXCLUDED"
        ? "SUPPLIER_EXCLUDED"
        : gate.code === "NORVANA_SUPPLIER_API_ENTITLEMENT_NOT_VERIFIED"
          ? "SUPPLIER_API_ENTITLEMENT_NOT_VERIFIED"
          : "SUPPLIER_CAPABILITY_NOT_PROVEN";

    return { ok: false, code, providerId, capability, message: gate.reason };
  }

  return {
    ok: false,
    code: "SUPPLIER_CREDENTIAL_NOT_BOUND",
    providerId,
    capability,
    message:
      "Read-only adapter scaffold is installed, but no supplier credential/account binding is authorized in R0.",
  };
}

export class UnboundReadOnlySupplierAdapter implements NorvanaReadOnlySupplierAdapter {
  readonly mode = "READ_ONLY_R0" as const;
  readonly providerId: string;
  readonly capabilities: readonly SupplierReadCapability[];

  constructor(providerId: string) {
    this.providerId = providerId;
    this.capabilities =
      getSupplierRegistryProfile(providerId)?.readCapabilities ?? [];
  }

  async searchCatalog(_query: string): Promise<SupplierReadResult<NormalizedSupplierProduct[]>> {
    return notBound(this.providerId, "catalog.search");
  }

  async readProduct(_supplierProductId: string): Promise<SupplierReadResult<NormalizedSupplierProduct>> {
    return notBound(this.providerId, "product.read");
  }

  async readVariant(_supplierVariantId: string): Promise<SupplierReadResult<NormalizedSupplierVariant>> {
    return notBound(this.providerId, "variant.read");
  }

  async readInventory(_supplierSku: string): Promise<SupplierReadResult<NormalizedSupplierVariant>> {
    return notBound(this.providerId, "inventory.read");
  }

  async readWarehouse(_supplierWarehouseId: string): Promise<SupplierReadResult<NormalizedSupplierWarehouse>> {
    return notBound(this.providerId, "warehouse.read");
  }

  async quoteShipping(_input: {
    supplierSku: string;
    quantity: number;
    destinationCountry: string;
    destinationPostalCode?: string;
  }): Promise<SupplierReadResult<NormalizedShippingQuote[]>> {
    return notBound(this.providerId, "shipping.quote");
  }

  async estimateDelivery(_input: {
    supplierSku: string;
    destinationCountry: string;
    destinationPostalCode?: string;
  }): Promise<SupplierReadResult<NormalizedDeliveryEstimate>> {
    return notBound(this.providerId, "delivery.estimate");
  }

  async readReturnPolicy(_supplierSku?: string): Promise<SupplierReadResult<NormalizedReturnPolicy>> {
    return notBound(this.providerId, "returns.policy.read");
  }

  async verifyWebhook(_input: {
    payload: string;
    signature: string;
  }): Promise<SupplierReadResult<NormalizedWebhookVerification>> {
    return notBound(this.providerId, "webhook.verify");
  }

  async simulateOrder(_input: {
    supplierSku: string;
    quantity: number;
    destinationCountry: string;
    destinationPostalCode?: string;
  }): Promise<SupplierReadResult<LocalSupplierOrderSimulation>> {
    return notBound(this.providerId, "order.simulate");
  }
}

export function createSupplierReadOnlyScaffold(providerId: string) {
  return new UnboundReadOnlySupplierAdapter(providerId);
}

export const FIRST_WAVE_READ_ONLY_ADAPTERS = [
  "cjdropshipping",
  "banggood",
  "eprolo",
  "gelato",
  "prodigi",
  "printful",
] as const;
