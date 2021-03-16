import { fetchVend } from "utils/fetch";

const { VEND_USER_SALE_ID } = process.env;

type vendFetchSearchSale = {
  data: {
    data: [
      {
        id: string | null;
        outlet_id: string | null;
        register_id: string | null;
        user_id: string | null;
        customer_id: string | null;
        invoice_number: string | null;
        source: string | null;
        source_id: string | null;
        accounts_transaction_id: string | null;
        status: string | null;
        note: string | null;
        short_code: string | null;
        return_for: string | null;
        return_ids: [];
        total_loyalty: number;
        created_at: string | null;
        updated_at: string | null;
        sale_date: string | null;
        deleted_at: string | null;
        line_items?: {
          id: string | null;
          product_id: string | null;
          tax_id: string | null;
          discount_total: number;
          discount: number;
          price_total: number;
          price: number;
          cost_total: number;
          cost: number;
          tax_total: number;
          tax: number;
          quantity: number;
          loyalty_value: number;
          note: string | null;
          price_set: false;
          status: string | null;
          sequence: number;
          gift_card_number: string | null;
          tax_components: {
            rate_id: string | null;
            total_tax: number;
          }[];
          promotions: unknown[];
          total_tax: number;
          unit_loyalty_value: number;
          unit_cost: number;
          unit_discount: number;
          unit_price: number;
          unit_tax: number;
          total_cost: number;
          total_discount: number;
          total_loyalty_value: number;
          total_price: number;
          is_return: false;
        }[];
        payments: {
          id: string | null;
          register_id: string | null;
          register_open_sequence_id: string | null;
          outlet_id: string | null;
          retailer_payment_type_id: string | null;
          payment_type_id: string | null;
          name: string | null;
          amount: number;
          payment_date: string | null;
          deleted_at: string | null;
          external_attributes: [];
          external_applications: [];
          source_id: string | null;
        }[];
        adjustments: [];
        external_applications: [];
        version: number;
        total_tax: number;
        total_price: number;
        receipt_number: string | null;
        total_price_incl: number;
        taxes: {
          amount: number;
          id: string | null;
        }[];
      }
    ];
    total_count: number;
    page_info: {
      start_cursor: string | null;
      end_cursor: string | null;
      has_next_page: false;
    };
    version: {
      min: number;
      max: number;
    };
  };
};

type IFetchVendSearchSaleByInvoiceId = (
  invoice_number: number | string,
  user_id?: string
) => Promise<vendFetchSearchSale>;

export const fetchVendSaleByInvoiceId: IFetchVendSearchSaleByInvoiceId = (invoice_id, user_id = VEND_USER_SALE_ID) => {
  return fetchVend(`/2.0/search?type=sales&invoice_number=${invoice_id}&user_id=${user_id}`.trim());
};
