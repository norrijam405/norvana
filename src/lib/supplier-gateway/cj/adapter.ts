import type {
  NorvanaReadOnlySupplierAdapter,
  NormalizedReturnPolicy,
  NormalizedShippingQuote,
  NormalizedSupplierProduct,
  NormalizedSupplierVariant,
  NormalizedSupplierWarehouse,
  SupplierReadResult,
} from "../types.ts";
import {
  normalizeCJFreightQuote,
  normalizeCJProduct,
  normalizeCJVariant,
  normalizeCJWarehouse,
} from "./normalize.ts";
import {
  CJ_FIXTURE_CATALOG_RESPONSE,
  CJ_FIXTURE_FREIGHT,
  CJ_FIXTURE_PRODUCT,
  CJ_FIXTURE_STOCK_BY_VID,
  CJ_FIXTURE_VARIANTS,
  CJ_FIXTURE_WAREHOUSE,
} from "./fixtures.ts";

export const CJ_OFFLINE_QUALIFICATION_MODE = "LOCAL_FIXTURE_ONLY" as const;

export class CJOfflineQualificationAdapter
  implements NorvanaReadOnlySupplierAdapter
{
  readonly providerId = "cjdropshipping";
  readonly mode = "READ_ONLY_R0" as const;
  readonly qualificationMode = CJ_OFFLINE_QUALIFICATION_MODE;
  readonly capabilities = [
    "catalog.search",
    "product.read",
    "variant.read",
    "inventory.read",
    "warehouse.read",
    "shipping.quote",
    "delivery.estimate",
    "order.simulate",
  ] as const;

  async searchCatalog(
    _query: string
  ): Promise<SupplierReadResult<NormalizedSupplierProduct[]>> {
    const list = CJ_FIXTURE_CATALOG_RESPONSE.data.list ?? [];
    return {
      ok: true,
      providerId: this.providerId,
      capability: "catalog.search",
      data: list.map((item) => normalizeCJProduct(item)),
    };
  }

  async readProduct(
    supplierProductId: string
  ): Promise<SupplierReadResult<NormalizedSupplierProduct>> {
    if (supplierProductId !== CJ_FIXTURE_PRODUCT.pid) {
      return {
        ok: false,
        code: "SUPPLIER_DATA_INCOMPLETE",
        providerId: this.providerId,
        capability: "product.read",
        message: "Offline CJ fixture product was not found.",
      };
    }

    return {
      ok: true,
      providerId: this.providerId,
      capability: "product.read",
      data: normalizeCJProduct(CJ_FIXTURE_PRODUCT, CJ_FIXTURE_STOCK_BY_VID),
    };
  }

  async readInventory(
    supplierSku: string
  ): Promise<SupplierReadResult<NormalizedSupplierVariant>> {
    const variant = CJ_FIXTURE_VARIANTS.find(
      (item) => item.variantSku === supplierSku
    );

    if (!variant) {
      return {
        ok: false,
        code: "SUPPLIER_DATA_INCOMPLETE",
        providerId: this.providerId,
        capability: "inventory.read",
        message: "Offline CJ fixture variant was not found.",
      };
    }

    return {
      ok: true,
      providerId: this.providerId,
      capability: "inventory.read",
      data: normalizeCJVariant(
        variant,
        CJ_FIXTURE_STOCK_BY_VID[variant.vid]
      ),
    };
  }

  async readWarehouse(
    supplierWarehouseId: string
  ): Promise<SupplierReadResult<NormalizedSupplierWarehouse>> {
    if (supplierWarehouseId !== CJ_FIXTURE_WAREHOUSE.id) {
      return {
        ok: false,
        code: "SUPPLIER_DATA_INCOMPLETE",
        providerId: this.providerId,
        capability: "warehouse.read",
        message: "Offline CJ fixture warehouse was not found.",
      };
    }

    return {
      ok: true,
      providerId: this.providerId,
      capability: "warehouse.read",
      data: normalizeCJWarehouse(CJ_FIXTURE_WAREHOUSE),
    };
  }

  async quoteShipping(input: {
    supplierSku: string;
    quantity: number;
    destinationCountry: string;
    destinationPostalCode?: string;
  }): Promise<SupplierReadResult<NormalizedShippingQuote[]>> {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      return {
        ok: false,
        code: "SUPPLIER_RESPONSE_INVALID",
        providerId: this.providerId,
        capability: "shipping.quote",
        message: "Quantity must be a positive integer.",
      };
    }

    return {
      ok: true,
      providerId: this.providerId,
      capability: "shipping.quote",
      data: CJ_FIXTURE_FREIGHT.map((quote) =>
        normalizeCJFreightQuote(quote, {
          supplierSku: input.supplierSku,
          destinationCountry: input.destinationCountry,
          destinationPostalCode: input.destinationPostalCode,
          warehouse: CJ_FIXTURE_WAREHOUSE.name ?? null,
        })
      ),
    };
  }

  async readReturnPolicy(
    _supplierSku?: string
  ): Promise<SupplierReadResult<NormalizedReturnPolicy>> {
    return {
      ok: false,
      code: "SUPPLIER_CAPABILITY_NOT_PROVEN",
      providerId: this.providerId,
      capability: "returns.policy.read",
      message:
        "CJ return-policy normalization stays locked until exact SKU/category rules are proven.",
    };
  }
}

export function createCJOfflineQualificationAdapter() {
  return new CJOfflineQualificationAdapter();
}
