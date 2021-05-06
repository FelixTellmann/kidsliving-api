import { fetchVend } from "utils/fetch";
import { OrderWebhookRequestBody } from "../order/shopifyOrderCreateWebhook";

export type vendConsignmentProduct = {
  // Auto-generated object ID
  id: string | null;
  // The ID of the consignment associated with this item.
  consignment_id: string | null;
  // The ID of the product associated with this item.
  product_id: string | null;
  // Quantity "ordered" for stock orders or "expected" for stock takes.
  count: number | null; // Quantity "received" for stock orders or "counted" for stock takes.
  received: number | null; // Supply cost of the item for this consignment.
  cost: number | null;
  // Sequence order number for the item.
  sequence_number: number | null;
};

export type vendFetchConsignmentProducts = {
  data: {
    consignment_products: vendConsignmentProduct[];
    pagination?: {
      results: number;
      page: number;
      page_size: number;
      pages: number;
    };
  };
};

type IFetchVendConsignmentProducts = (
  consignment_id?: string,
  page?: number | string,
  page_size?: number | string
) => Promise<vendFetchConsignmentProducts>;

export const fetchVendConsignmentProductsById: IFetchVendConsignmentProducts = (
  consignment_id,
  page = 1,
  page_size = 200
) => {
  return fetchVend(`consignment_product?consignment_id=${consignment_id}&page=${page}&page_size=${page_size}`);
};
