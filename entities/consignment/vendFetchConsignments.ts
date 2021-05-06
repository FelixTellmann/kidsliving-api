import { fetchVend } from "utils/fetch";
import { OrderWebhookRequestBody } from "../order/shopifyOrderCreateWebhook";

export type vendConsignment = {
  // Auto-generated object ID
  id: string | null;
  // The ID of the retailer associated with this consignment.
  retailer_id: string | null;
  // The name of the consignment.
  name: string | null;
  // The date when the consignment was created.
  consignment_date: string | null;
  // The due date for the consignment.
  due_at: string | null;
  // The date when the consignment was received.
  received_at: string | null;
  // The ID of the outlet to which the goods are coming.
  outlet_id: string | null;
  // The ID of the supplier associated with this consignment.
  supplier_id: string | null;
  // The ID of the outlet from which the goods are coming. Only used for stock transfers.
  source_outlet_id: string | null;
  // Status of the consignment. One of: `OPEN`, `SENT`, `DISPATCHED`, `RECEIVED`, `CANCELLED`,  `STOCKTAKE`, `STOCKTAKE_COMPLETE`.
  status: string | null;
  // The type of the consignment. One of:  `SUPPLIER`, `OUTLET`, `STOCKTAKE`.
  type: string | null;
  // The ID of a transaction in an external system associated with this consignment.
  accounts_transaction_id: string | null;
};

export type vendFetchConsignments = {
  data: {
    consignments: vendConsignment[];
    pagination?: {
      results: number;
      page: number;
      page_size: number;
      pages: number;
    };
  };
};

type IFetchVendConsignments = (
  since?: number | string,
  page?: number | string,
  page_size?: number | string
) => Promise<vendFetchConsignments>;

export const fetchVendConsignments: IFetchVendConsignments = (since = "2018-04-01", page = 1, page_size = 200) => {
  return fetchVend(`consignment?since=${since}&page=${page}&page_size=${page_size}`);
};

export type vendConsignmentv2 = {
  // Auto-generated object ID.
  id: string;
  // A valid ID of an outlet where stock will be received.
  outlet_id: string;
  // Tue 29 Nov 2016 (string) - Consignment name. For orders, the note field in the UI will be the name value.
  name: string | null;
  // 11-28T19:02:15+00:00 (timestamp) - Consignment creation date.
  consignment_date: string | null;
  // 11-30T19:08:541+00:00 (timestamp) - Due date.
  due_at: string | null;
  // 11-30T19:08:541+00:00 (timestamp) - The date when consignment was received.
  received_at: string | null;
  // One of `SUPPLIER`, `OUTLET`, `STOCKTAKE`, `RETURN`.
  type: string | null;
  //  * Supplier Order: One of `OPEN`, `SENT`, `DISPATCHED`, `RECEIVED`, `CANCELLED`
  //  * Outlet Transfer: One of `OPEN`, `SENT`, `RECEIVED`, `CANCELLED`
  //  * Return Order: One of `OPEN`, `SENT`, `CANCELLED`
  //  * Stocktake: One of `STOCKTAKE_SCHEDULED`, `STOCKTAKE_IN_PROGRESS`, `STOCKTAKE_IN_PROGRESS_PROCESSED`, `STOCKTAKE_COMPLETE`, `CLOSED`, `CANCELLED`
  //  This is not a definitive list and may be extended in future
  status: string | null;
  // a valid supplier ID.
  supplier_id: string | null;
  // A valid ID of an outlet where stock will come from. **Stock transfers only**.
  source_outlet_id: string | null;
  // Supplier invoice number.
  supplier_invoice: string | null;
  // Order number.+ `total_count_gain` (number)
  reference: string | null;
  // The number of items over the expected level.
  total_count_gain: number | null;
  // The cost of items over the expected level.
  total_cost_gain: number | null;
  // The number of items below the expected level.
  total_count_loss: number | null;
  // The cost of items below the expected level.
  total_cost_loss: number | null;
  // Creation timestamp in UTC.
  created_at: string | null;
  // Last update timestamp in UTC.
  updated_at: string | null;
  // Deletion timestamp in UTC.
  deleted_at: string | null;
  // Auto-incrementing object version number.
  version: number;
};

export type vendFetchConsignmentsv2 = {
  data: {
    data: vendConsignmentv2[];
    version?: {
      max: number;
      min: number;
    };
  };
};

type IFetchVendConsignmentsv2 = (
  status:
    | "OPEN"
    | "SENT"
    | "DISPATCHED"
    | "RECEIVED"
    | "STOCKTAKE_IN_PROGRESS"
    | "STOCKTAKE_SCHEDULED"
    | "STOCKTAKE_IN_PROGRESS_PROCESSED"
    | "STOCKTAKE_COMPLETE"
    | "CLOSED"
    | "CANCELLED",
  after: string | number,
  before: string | number,
  page_size?: number | string
) => Promise<vendFetchConsignments>;

export const fetchVendConsignmentsv2: IFetchVendConsignmentsv2 = (status, after, before, page_size = 200) => {
  return fetchVend(
    `2.0/consignments?since=2018-04-01&status=${status}&page_size=${page_size}${after ? `&after=${after}` : ""}${
      before ? `&before=${before}` : ""
    }`
  );
};

/*
export type postVendConsignmentReturn = {
  data: {
    product: vendConsignment;
  };
};

export type vendProductInput = {
  //  Existing product ID. If included in the POST request it will cause an update instead of a creating a new object.
  id?: string;
  //  The ID that can be used to reference a product in another system.
  source_id?: string;
  // Does not show in result - "" - empty string does not work!
  source?: "USER" | "TAKEALOT" | "SHOPIFY" | string;
  //  Reference ID to an external object. Value will be returned as variant_source_id.
  source_variant_id?: string;
  //  The handle of the product. Creating a new product with a handle identical to one of an existing product will cause creating a variant.
  handle?: string;
  //  The name of the product type associated with the product. Maximum 50 characters.
  type?: string;
  //  The name of the variant option 1.
  variant_option_one_name?: string;
  //  The value of the variant option 1.
  variant_option_one_value?: string;
  //  The name of the variant option 2.
  variant_option_two_name?: string;
  //  The value of the variant option 2.
  variant_option_two_value?: string;
  //  The name of the variant option 3.
  variant_option_three_name?: string;
  //  The value of the variant option 3.
  variant_option_three_value?: string;
  //  Indicates whether the product is currently active. NOTE?: Currently has to be submitted as “0” or “1”. Will be returned as boolean value of true or false.
  active?: "0" | "1";
  //  The name of the product. Should be posted without any variant related suffixes.
  name?: string;
  //  The description of the product. May include HTML.
  description?: string;
  //  The SKU of the product. Should be unique for new products. If a SKU is not specified, the system will generate one for the product.
  sku?: string;
  //  A comma separated list of tags associated with the product.
  tags?: string;
  //  The name of the brand associated with the product.
  brand_name?: string;
  //  Product supplier’s name.
  supplier_name?: string;
  //  The supplier’s code or reference for the product.
  supplier_code?: string;
  //  The default cost of supply for the product.
  supply_price?: string;
  //  Code used to associate purchase (cost) of the product with a specific account.
  account_code_purchase?: string;
  //  Code used to associate sales of the product with a specific account. Value will be returned as account_code_sales.
  account_code?: string;
  //  Indicated whether the system should track inventory count for this product.
  track_inventory?: boolean;
  //  A number describing the position of a variant in the UI.
  button_order?: number;
  //  A list of inventory records associated with the product.
  inventory?: {
    //  The uui - ID of an outlet associated with this inventory record.
    outlet_id: string;
    //  The name of the outlet.
    outlet_name?: string;
    //  Current stock quantity of the product at the given outlet.
    count: string;
    //  Quantity below which the product should be included in the auto-filled stock orders.
    reorder_point?: string;
    //  The default of the quantity for auto-filled stock orders
    restock_level?: string;
  }[];
  //  FLOAT - Retail price for the product. Tax inclusive or exclusive depending on the store settings.
  retail_price?: number;
  //  The name of the default tax for the product.
  tax?: string;
};

export type TPostVendProduct = (product: vendProductInput) => Promise<postVendConsignmentReturn>;

export const postVendProduct: TPostVendProduct = product => {
  return fetchVend(`products`, "POST", product);
};
*/
