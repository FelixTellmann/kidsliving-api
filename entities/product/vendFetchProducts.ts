import { fetchVend } from "utils/fetch";
import { OrderWebhookRequestBody } from "../order/shopifyOrderCreateWebhook";

export type vendProduct = {
  id: string;
  source_id: string;
  handle: string;
  has_variants: boolean;
  variant_parent_id: string;
  variant_option_one_name: string;
  variant_option_one_value: string;
  variant_option_two_name: string;
  variant_option_two_value: string;
  variant_option_three_name: string;
  variant_option_three_value: string;
  active: boolean;
  name: string;
  description: string;
  image: string;
  image_large: string;
  images: [];
  sku: string;
  tags: string;
  supplier_code: string;
  supply_price: string;
  account_code_purchase: string;
  account_code_sales: string;
  button_order: string;
  inventory: {
    outlet_id: string;
    outlet_name: string;
    count: string;
    reorder_point: string;
    restock_level: string;
  }[];
  price_book_entries: {
    price_book_name: string;
    id: string;
    product_id: string;
    price_book_id: string;
    type: string;
    outlet_name: string;
    outlet_id: string;
    customer_group_name: string;
    customer_group_id: string;
    price: number;
    loyalty_value: null;
    tax_id: string;
    tax_rate: number;
    tax_name: string;
    display_retail_price_tax_inclusive: number;
    min_units: string;
    max_units: string;
    valid_from: string;
    valid_to: string;
    tax: number;
  }[];
  price: number;
  tax: number;
  tax_id: string;
  tax_rate: number;
  tax_name: string;
  display_retail_price_tax_inclusive: number;
  updated_at: string;
  deleted_at: string;
  base_name: string;
  brand_id: string;
  taxes: {
    outlet_id: string;
    tax_id: string;
  }[];
  variant_source_id: string;
  brand_name: string;
  supplier_name: string;
  track_inventory: boolean;
  type: string;
};

export type vendFetchProducts = {
  data: {
    products: vendProduct[];
    pagination?: {
      results: number;
      page: number;
      page_size: number;
      pages: number;
    };
  };
};

type IFetchVendProductByHandle = (handle: string) => Promise<vendFetchProducts>;

export const fetchVendProductByHandle: IFetchVendProductByHandle = handle => {
  return fetchVend(`products?handle=${handle}`);
};

type IFetchVendProductBySku = (sku: string) => Promise<vendFetchProducts>;

export const fetchVendProductBySku: IFetchVendProductBySku = sku => {
  return fetchVend(`products?sku=${sku}`);
};
type IFetchVendProductById = (id: string) => Promise<vendFetchProducts>;

export const fetchVendProductById: IFetchVendProductById = id => {
  return fetchVend(`products/${id}`);
};

type IFetchVendAllProductsBySku = (body: OrderWebhookRequestBody) => Promise<PromiseSettledResult<vendFetchProducts>[]>;

export const fetchVendAllProductsBySku: IFetchVendAllProductsBySku = ({ line_items }) => {
  const getSaleProducts = [];
  line_items.forEach(({ sku }) => {
    getSaleProducts.push(fetchVendProductBySku(sku));
  });
  return Promise.allSettled(getSaleProducts);
};

type IFetchVendProducts = (page?: number | string, page_size?: number | string) => Promise<vendFetchProducts>;

export const fetchVendProducts: IFetchVendProducts = (page = 1, page_size = 200) => {
  return fetchVend(`products?since=2018-04-01&page=${page}&page_size=${page_size}`);
};

export type postVendProductReturn = {
  data: {
    product: vendProduct;
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

export type TPostVendProduct = (product: vendProductInput) => Promise<postVendProductReturn>;

export const postVendProduct: TPostVendProduct = product => {
  return fetchVend(`products`, "POST", product);
};
