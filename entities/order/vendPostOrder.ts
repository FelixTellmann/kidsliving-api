import { fetchVend } from "../../utils/fetch";
import { registerSale } from "./vendFetchOrder";

interface IPostOrder {
  "id"?: string
  "source": string
  "source_id": string
  "register_id": string
  "market_id"?: string
  "customer_id"?: string
  "user_id"?: string
  "user_name"?: string
  "sale_date"?: string
  "created_at"?: string
  "updated_at"?: string
  "total_price"?: number
  "total_cost"?: number
  "total_tax"?: number
  "tax_name"?: string
  "note"?: string
  "status": string
  "short_code"?: string
  "invoice_number": string
  "accounts_transaction_id"?: string
  "return_for"?: string
  "register_sale_products": {
    "id"?: string
    "product_id"?: string
    "register_id"?: string
    "sequence"?: string
    "handle"?: string
    "sku"?: string
    "name"?: string
    "quantity"?: number
    "price"?: number
    "cost"?: number
    "price_set"?: number
    "discount": -115,
    "loyalty_value"?: number
    "tax"?: number
    "tax_id"?: string
    "tax_name"?: string
    "tax_rate"?: number
    "tax_total"?: number
    "price_total"?: number
    "display_retail_price_tax_inclusive"?: string
    "status"?: string
    "attributes": {
      "name"?: string
      "value"?: string
    }[]
  }[],
  "register_sale_payments": {
    "id"?: string
    "payment_type_id"?: string
    "register_id"?: string
    "retailer_payment_type_id"?: string
    "name"?: string
    "label"?: string
    "payment_date"?: string
    "amount"?: number
  }[],
}

type vendPostOrder = {
  data: {
    register_sale: registerSale
  }
};

type IPostNewVendOrderWithBody = (body: IPostOrder) => Promise<vendPostOrder>;

export const postNewVendOrder: IPostNewVendOrderWithBody = (body) => {
  return fetchVend(`/register_sales`, "POST", body);
};

export const postUpdateVendOrder: IPostNewVendOrderWithBody = (body) => {
  return fetchVend(`/register_sales`, "POST", body);
};
