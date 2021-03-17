export type FulfillmentWebhookRequestBody = {
  vend_location_id?: string;
  id: number | null;
  order_id: number | null;
  status: string | null;
  created_at: string | null;
  service: string | null;
  updated_at: string | null;
  tracking_company: null;
  shipment_status: null;
  location_id: number | null;
  email: string | null;
  destination: {
    first_name: string | null;
    address1: string | null;
    phone: string | null;
    city: string | null;
    zip: string | null;
    province: string | null;
    country: string | null;
    last_name: string | null;
    address2: string | null;
    company: string | null;
    latitude: number | null;
    longitude: number | null;
    name: string | null;
    country_code: string | null;
    province_code: string | null;
  };
  line_items: [
    {
      id: number | null;
      variant_id: number | null;
      title: string | null;
      quantity: number | null;
      sku: string | null;
      variant_title: string | null;
      vendor: string | null;
      fulfillment_service: string | null;
      product_id: number | null;
      requires_shipping: boolean | null;
      taxable: boolean | null;
      gift_card: boolean | null;
      name: string | null;
      variant_inventory_management: string | null;
      properties: [];
      product_exists: boolean | null;
      fulfillable_quantity: number | null;
      grams: number | null;
      price: string | null;
      total_discount: string | null;
      fulfillment_status: string | null;
      price_set: {
        shop_money: {
          amount: string | null;
          currency_code: string | null;
        };
        presentment_money: {
          amount: string | null;
          currency_code: string | null;
        };
      };
      total_discount_set: {
        shop_money: {
          amount: string | null;
          currency_code: string | null;
        };
        presentment_money: {
          amount: string | null;
          currency_code: string | null;
        };
      };
      discount_allocations: [
        {
          amount: string | null;
          discount_application_index: number | null;
          amount_set: {
            shop_money: {
              amount: string | null;
              currency_code: string | null;
            };
            presentment_money: {
              amount: string | null;
              currency_code: string | null;
            };
          };
        }
      ];
      duties: [];
      admin_graphql_api_id: string | null;
      tax_lines: [
        {
          title: string | null;
          price: string | null;
          rate: number | null;
          price_set: {
            shop_money: {
              amount: string | null;
              currency_code: string | null;
            };
            presentment_money: {
              amount: string | null;
              currency_code: string | null;
            };
          };
        }
      ];
      origin_location: {
        id: number | null;
        country_code: string | null;
        province_code: string | null;
        name: string | null;
        address1: string | null;
        address2: string | null;
        city: string | null;
        zip: string | null;
      };
      destination_location: {
        id: number | null;
        country_code: string | null;
        province_code: string | null;
        name: string | null;
        address1: string | null;
        address2: string | null;
        city: string | null;
        zip: string | null;
      };
    }
  ];
  tracking_number: null;
  tracking_numbers: [];
  tracking_url: null;
  tracking_urls: [];
  receipt: unknown;
  name: string | null;
  admin_graphql_api_id: string | null;
};
