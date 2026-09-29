import type {
  CJApiEnvelope,
  CJFreightQuoteDto,
  CJProductDetailDto,
  CJProductListData,
  CJStockDto,
  CJVariantDto,
  CJWarehouseDto,
} from "./types.ts";

export const CJ_FIXTURE_PRODUCT: CJProductDetailDto = {
  pid: "CJ-FIXTURE-PID-001",
  productNameEn: "Fixture Travel Tech Organizer",
  productSku: "CJFIX-ORG-001",
  bigImage: "https://example.invalid/cj/organizer.jpg",
  sellPrice: 8.25,
  description: "Local deterministic CJ normalization fixture.",
  categoryId: "FIXTURE-CATEGORY",
  variants: [
    {
      vid: "CJ-FIXTURE-VID-BLK",
      pid: "CJ-FIXTURE-PID-001",
      variantNameEn: "Fixture Travel Tech Organizer Black",
      variantSku: "CJFIX-ORG-001-BLK",
      variantImage: "https://example.invalid/cj/organizer-black.jpg",
      variantKey: "Black",
      variantSellPrice: 8.25,
    },
    {
      vid: "CJ-FIXTURE-VID-GRY",
      pid: "CJ-FIXTURE-PID-001",
      variantNameEn: "Fixture Travel Tech Organizer Grey",
      variantSku: "CJFIX-ORG-001-GRY",
      variantImage: "https://example.invalid/cj/organizer-grey.jpg",
      variantKey: "Grey",
      variantSellPrice: "8.40",
    },
  ],
};

export const CJ_FIXTURE_VARIANTS: CJVariantDto[] = CJ_FIXTURE_PRODUCT.variants ?? [];

export const CJ_FIXTURE_STOCK_BY_VID: Record<string, CJStockDto[]> = {
  "CJ-FIXTURE-VID-BLK": [{
    vid: "CJ-FIXTURE-VID-BLK",
    areaId: "1",
    areaEn: "China Warehouse",
    countryCode: "CN",
    storageNum: 31,
    totalInventoryNum: 31,
  }],
  "CJ-FIXTURE-VID-GRY": [{
    vid: "CJ-FIXTURE-VID-GRY",
    areaId: "2",
    areaEn: "US Warehouse",
    countryCode: "US",
    storageNum: 0,
    totalInventoryNum: 0,
  }],
};

export const CJ_FIXTURE_WAREHOUSE: CJWarehouseDto = {
  id: "CJ-FIXTURE-WH-US-01",
  name: "Fixture US Warehouse",
  areaCountryCode: "US",
  city: "Fixture City",
  address1: "100 Fixture Way",
  address2: null,
};

export const CJ_FIXTURE_FREIGHT: CJFreightQuoteDto[] = [
  {
    logisticAging: "5-9",
    logisticPrice: 4.71,
    logisticName: "CJ Fixture Packet",
    taxesFee: 0,
    clearanceOperationFee: 0,
    totalPostageFee: 4.71,
  },
  {
    logisticAging: "8-13",
    logisticPrice: "3.95",
    logisticName: "CJ Fixture Economy",
  },
];

export const CJ_FIXTURE_CATALOG_RESPONSE: CJApiEnvelope<CJProductListData> = {
  code: 200,
  result: true,
  success: true,
  message: "Success",
  data: {
    pageNum: 1,
    pageSize: 20,
    total: 1,
    list: [{
      pid: CJ_FIXTURE_PRODUCT.pid,
      productNameEn: CJ_FIXTURE_PRODUCT.productNameEn,
      productSku: CJ_FIXTURE_PRODUCT.productSku,
      productImage: CJ_FIXTURE_PRODUCT.bigImage,
      sellPrice: CJ_FIXTURE_PRODUCT.sellPrice,
    }],
  },
  requestId: "fixture-request-catalog",
};

export const CJ_FIXTURE_ERROR_RATE_LIMIT: CJApiEnvelope<null> = {
  code: 429,
  result: false,
  success: false,
  message: "Fixture rate limit",
  data: null,
  requestId: "fixture-request-rate-limit",
};

export const CJ_FIXTURE_ERROR_AUTH: CJApiEnvelope<null> = {
  code: 1600001,
  result: false,
  success: false,
  message: "Authentication failed",
  data: null,
  requestId: "fixture-request-auth",
};
