export type OrderWebhookRequestBody = {
  id: number;
  email: string;
  closed_at?: unknown | any;
  created_at: string;
  updated_at: string;
  number: number;
  note: string;
  token: string;
  gateway?: unknown | any;
  test: boolean;
  total_price: string;
  subtotal_price: string;
  total_weight: number;
  total_tax: string;
  taxes_included: boolean;
  currency: string;
  financial_status: string;
  confirmed: boolean;
  total_discounts: string;
  total_line_items_price: string;
  cart_token: string;
  buyer_accepts_marketing: boolean;
  name: string;
  referring_site: string;
  landing_site: string;
  cancelled_at?: unknown | any;
  cancel_reason?: unknown | any;
  total_price_usd: string;
  checkout_token: string;
  reference?: unknown | any;
  user_id?: unknown | any;
  location_id?: unknown | any;
  source_identifier?: unknown | any;
  source_url?: unknown | any;
  processed_at: string;
  device_id?: unknown | any;
  phone?: unknown | any;
  customer_locale: string;
  app_id: number;
  browser_ip: string;
  client_details: {
    accept_language: string;
    browser_height: number;
    browser_ip: string;
    browser_width: number;
    session_hash?: unknown | any;
    user_agent: string;
  };
  landing_site_ref?: unknown | any;
  order_number: number;
  discount_applications: {
    type: string;
    value: string;
    value_type: string;
    allocation_method: string;
    target_selection: string;
    target_type: string;
    code: string;
  }[];
  discount_codes: {
    code: string;
    amount: string;
    type: string;
  }[];
  note_attributes: (unknown | any)[];
  payment_gateway_names: (unknown | any)[];
  processing_method: string;
  checkout_id: number;
  source_name: string;
  fulfillment_status?: "fulfilled" | null | "null" | "partial" | "restocked";
  tax_lines: (unknown | any)[];
  tags: string;
  contact_email: string;
  presentment_currency: string;
  total_line_items_price_set: {
    shop_money: {
      amount: string;
      currency_code: string;
    };
    presentment_money: {
      amount: string;
      currency_code: string;
    };
  };
  total_discounts_set: {
    shop_money: {
      amount: string;
      currency_code: string;
    };
    presentment_money: {
      amount: string;
      currency_code: string;
    };
  };
  total_shipping_price_set: {
    shop_money: {
      amount: string;
      currency_code: string;
    };
    presentment_money: {
      amount: string;
      currency_code: string;
    };
  };
  subtotal_price_set: {
    shop_money: {
      amount: string;
      currency_code: string;
    };
    presentment_money: {
      amount: string;
      currency_code: string;
    };
  };
  total_price_set: {
    shop_money: {
      amount: string;
      currency_code: string;
    };
    presentment_money: {
      amount: string;
      currency_code: string;
    };
  };
  total_tax_set: {
    shop_money: {
      amount: string;
      currency_code: string;
    };
    presentment_money: {
      amount: string;
      currency_code: string;
    };
  };
  line_items: {
    id: number;
    variant_id: number;
    title: string;
    quantity: number;
    sku: string;
    variant_title: string;
    vendor: string;
    fulfillment_service: string;
    product_id: number;
    requires_shipping: boolean;
    taxable: boolean;
    gift_card: boolean;
    name: string;
    variant_inventory_management: string;
    properties: (unknown | any)[];
    product_exists: boolean;
    fulfillable_quantity: number;
    grams: number;
    price: string;
    total_discount: string;
    fulfillment_status?: unknown | any;
    price_set: {
      shop_money: {
        amount: string;
        currency_code: string;
      };
      presentment_money: {
        amount: string;
        currency_code: string;
      };
    };
    total_discount_set: {
      shop_money: {
        amount: string;
        currency_code: string;
      };
      presentment_money: {
        amount: string;
        currency_code: string;
      };
    };
    discount_allocations: {
      amount: string;
      discount_application_index: number;
      amount_set: {
        shop_money: {
          amount: string;
          currency_code: string;
        };
        presentment_money: {
          amount: string;
          currency_code: string;
        };
      };
    }[];
    duties: (unknown | any)[];
    admin_graphql_api_id: string;
    tax_lines: {
      title: string;
      price: string;
      rate: number;
      price_set: {
        shop_money: {
          amount: string;
          currency_code: string;
        };
        presentment_money: {
          amount: string;
          currency_code: string;
        };
      };
    }[];
    origin_location: {
      id: number;
      country_code: string;
      province_code: string;
      name: string;
      address1: string;
      address2: string;
      city: string;
      zip: string;
    };
  }[];
  fulfillments: (unknown | any)[];
  refunds: (unknown | any)[];
  total_tip_received: string;
  original_total_duties_set?: unknown | any;
  current_total_duties_set?: unknown | any;
  admin_graphql_api_id: string;
  shipping_lines: {
    id: number;
    title: string;
    price: string;
    code: string;
    source: string;
    phone?: unknown | any;
    requested_fulfillment_service_id?: unknown | any;
    delivery_category?: unknown | any;
    carrier_identifier?: unknown | any;
    discounted_price: string;
    price_set: {
      shop_money: {
        amount: string;
        currency_code: string;
      };
      presentment_money: {
        amount: string;
        currency_code: string;
      };
    };
    discounted_price_set: {
      shop_money: {
        amount: string;
        currency_code: string;
      };
      presentment_money: {
        amount: string;
        currency_code: string;
      };
    };
    discount_allocations: (unknown | any)[];
    tax_lines: (unknown | any)[];
  }[];
  billing_address: {
    first_name: string;
    address1: string;
    phone: string;
    city: string;
    zip: string;
    province: string;
    country: string;
    last_name: string;
    address2: string;
    company: string;
    latitude: number;
    longitude: number;
    name: string;
    country_code: string;
    province_code: string;
  };
  shipping_address: {
    first_name: string;
    address1: string;
    phone: string;
    city: string;
    zip: string;
    province: string;
    country: string;
    last_name: string;
    address2: string;
    company: string;
    latitude: number;
    longitude: number;
    name: string;
    country_code: string;
    province_code: string;
  };
  customer: {
    id: number;
    email: string;
    accepts_marketing: boolean;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    orders_count: number;
    state: string;
    total_spent: string;
    last_order_id: number;
    note?: unknown | any;
    verified_email: boolean;
    multipass_identifier?: unknown | any;
    tax_exempt: boolean;
    phone?: unknown | any;
    tags: string;
    last_order_name: string;
    currency: string;
    accepts_marketing_updated_at: string;
    marketing_opt_in_level: string;
    admin_graphql_api_id: string;
    default_address: {
      id: number;
      customer_id: number;
      first_name: string;
      last_name: string;
      company: string;
      address1: string;
      address2: string;
      city: string;
      province: string;
      country: string;
      zip: string;
      phone: string;
      name: string;
      province_code: string;
      country_code: string;
      country_name: string;
      default: boolean;
    };
  };
};
