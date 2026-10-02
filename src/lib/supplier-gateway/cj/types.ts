export type CJApiEnvelope<T> = {
  code: number;
  result?: boolean;
  success?: boolean;
  message: string;
  data: T;
  requestId?: string;
};

export type CJProductListItem = {
  pid: string;
  productNameEn?: string | null;
  productSku?: string | null;
  productImage?: string | null;
  sellPrice?: number | string | null;
};

export type CJVariantDto = {
  vid: string;
  pid?: string | null;
  variantNameEn?: string | null;
  variantSku?: string | null;
  variantImage?: string | null;
  variantKey?: string | null;
  variantSellPrice?: number | string | null;
};

export type CJProductDetailDto = {
  pid: string;
  productNameEn?: string | null;
  productSku?: string | null;
  bigImage?: string | null;
  productImage?: string | null;
  sellPrice?: number | string | null;
  description?: string | null;
  categoryId?: string | null;
  variants?: CJVariantDto[] | null;
};

export type CJStockDto = {
  vid: string;
  areaId?: string | number | null;
  areaEn?: string | null;
  countryCode?: string | null;
  storageNum?: number | null;
  totalInventoryNum?: number | null;
};

export type CJWarehouseDto = {
  id: string;
  name?: string | null;
  areaCountryCode?: string | null;
  city?: string | null;
  address1?: string | null;
  address2?: string | null;
};

export type CJFreightQuoteDto = {
  logisticAging?: string | null;
  logisticPrice?: number | string | null;
  logisticPriceCn?: number | string | null;
  logisticName?: string | null;
  taxesFee?: number | string | null;
  clearanceOperationFee?: number | string | null;
  totalPostageFee?: number | string | null;
};

export type CJProductListData = {
  pageNum?: number;
  pageSize?: number;
  total?: number;
  list?: CJProductListItem[];
};

export type CJReadOnlyEndpoint =
  | "catalog.search"
  | "product.read"
  | "variant.read"
  | "variant.detail"
  | "inventory.read"
  | "warehouse.read"
  | "warehouse.list"
  | "shipping.quote"
  | "delivery.estimate";

export const CJ_READ_ONLY_ENDPOINTS: Record<CJReadOnlyEndpoint, string> = {
  "catalog.search": "/api2.0/v1/product/listV2",
  "product.read": "/api2.0/v1/product/query",
  "variant.read": "/api2.0/v1/product/variant/query",
  "variant.detail": "/api2.0/v1/product/variant/queryByVid",
  "inventory.read": "/api2.0/v1/product/stock/queryByVid",
  "warehouse.read": "/api2.0/v1/warehouse/detail",
  "warehouse.list": "/api2.0/v1/product/globalWarehouseList",
  "shipping.quote": "/api2.0/v1/logistic/freightCalculate",
  "delivery.estimate": "/api2.0/v1/logistic/freightCalculate",
};

export const CJ_FORBIDDEN_R0_PATH_FRAGMENTS = [
  "/shopping/order/",
  "/shopping/pay/",
  "/store/product/saveProduct",
  "/product/conn/connection",
] as const;
