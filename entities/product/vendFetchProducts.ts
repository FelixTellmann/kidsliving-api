import { fetchVend } from "utils/fetch";
import { OrderWebhookRequestBody } from "../order/shopifyOrderCreateWebhook";

export type vendProduct = {
  "id": string,
  "source_id": string,
  "handle": string,
  "has_variants": boolean,
  "variant_parent_id": string,
  "variant_option_one_name": string,
  "variant_option_one_value": string,
  "variant_option_two_name": string,
  "variant_option_two_value": string,
  "variant_option_three_name": string,
  "variant_option_three_value": string,
  "active": boolean,
  "name": string,
  "description": string,
  "image": string,
  "image_large": string,
  "images": [],
  "sku": string,
  "tags": string,
  "supplier_code": string,
  "supply_price": string,
  "account_code_purchase": string,
  "account_code_sales": string,
  "button_order": string,
  "inventory": {
    "outlet_id": string,
    "outlet_name": string,
    "count": string,
    "reorder_point": string,
    "restock_level": string
  }[],
  "price_book_entries": {
    "price_book_name": string,
    "id": string,
    "product_id": string,
    "price_book_id": string,
    "type": string,
    "outlet_name": string,
    "outlet_id": string,
    "customer_group_name": string,
    "customer_group_id": string,
    "price": number,
    "loyalty_value": null,
    "tax_id": string,
    "tax_rate": number,
    "tax_name": string,
    "display_retail_price_tax_inclusive": number,
    "min_units": string,
    "max_units": string,
    "valid_from": string,
    "valid_to": string,
    "tax": number
  }[]
  "price": number,
  "tax": number,
  "tax_id": string,
  "tax_rate": number,
  "tax_name": string,
  "display_retail_price_tax_inclusive": number,
  "updated_at": string,
  "deleted_at": string,
  "base_name": string,
  "brand_id": string,
  "taxes": {
    "outlet_id": string,
    "tax_id": string
  }[]
  "variant_source_id": string,
  "brand_name": string,
  "supplier_name": string,
  "track_inventory": boolean,
  "type": string
};

export type vendFetchProducts = {
  data: {
    products: vendProduct[]
  }
};

type IFetchVendProductByHandle = (handle: string) => Promise<vendFetchProducts>;

export const fetchVendProductByHandle: IFetchVendProductByHandle = (handle) => {
  return fetchVend(`products?handle=${handle}`);
};

type IFetchVendProductBySku = (sku: string) => Promise<vendFetchProducts>;

export const fetchVendProductBySku: IFetchVendProductBySku = (sku) => {
  return fetchVend(`products?sku=${sku}`);
};

type IFetchVendAllProductsBySku = (body: OrderWebhookRequestBody) => Promise<PromiseSettledResult<vendFetchProducts>[]>;

export const fetchVendAllProductsBySku: IFetchVendAllProductsBySku = ({ line_items }) => {
  const getSaleProducts = [];
  line_items.forEach(({ sku }) => {
    getSaleProducts.push(fetchVendProductBySku(sku));
  });
  return Promise.allSettled(getSaleProducts);
};
