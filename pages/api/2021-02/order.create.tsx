import { fetchVendCustomerByEmail } from "entities/customer/vendFetchCustomer";
import { fetchShopifyOrderById } from "entities/order";
import { fetchVendProductBySku } from "entities/product/vendFetchProducts";
import { loadFirebase } from "lib/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { fetchVendSaleByInvoiceId } from "../../../entities/search/vendFetchSearchSale";

const test = {
  id: 3257938804911,
  email: "felix@tellmann.co.za",
  closed_at: null,
  created_at: "2021-02-20T12:53:08+02:00",
  updated_at: "2021-02-20T12:53:10+02:00",
  number: 11455,
  note: "",
  token: "7c8042eea2e25c3a0296d7ec7783fd29",
  gateway: null,
  test: false,
  total_price: "0.00",
  subtotal_price: "0.00",
  total_weight: 0,
  total_tax: "0.00",
  taxes_included: true,
  currency: "ZAR",
  financial_status: "paid",
  confirmed: true,
  total_discounts: "2.00",
  total_line_items_price: "2.00",
  cart_token: "847d717eee7be366243ade01d11b0325",
  buyer_accepts_marketing: true,
  name: "#12455",
  referring_site: "",
  landing_site: "/",
  cancelled_at: null,
  cancel_reason: null,
  total_price_usd: "0.00",
  checkout_token: "7a67acd81ed879b5e4e863dd8c578553",
  reference: null,
  user_id: null,
  location_id: null,
  source_identifier: null,
  source_url: null,
  processed_at: "2021-02-20T12:53:08+02:00",
  device_id: null,
  phone: null,
  customer_locale: "en",
  app_id: 580111,
  browser_ip: "102.132.251.94",
  client_details: {
    accept_language: "en-GB,en;q=0.9,en-US;q=0.8,en-ZA;q=0.7",
    browser_height: 977,
    browser_ip: "102.132.251.94",
    browser_width: 1903,
    session_hash: null,
    user_agent: "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4423.0 Safari/537.36",
  },
  landing_site_ref: null,
  order_number: 12455,
  discount_applications: [
    {
      type: "discount_code",
      value: "100.0",
      value_type: "percentage",
      allocation_method: "across",
      target_selection: "all",
      target_type: "line_item",
      code: "TESTTESTTEST",
    },
  ],
  discount_codes: [
    {
      code: "TESTTESTTEST",
      amount: "2.00",
      type: "percentage",
    },
  ],
  note_attributes: [],
  payment_gateway_names: [],
  processing_method: "free",
  checkout_id: 18849419853999,
  source_name: "web",
  fulfillment_status: null,
  tax_lines: [],
  tags: "",
  contact_email: "felix@tellmann.co.za",
  presentment_currency: "ZAR",
  total_line_items_price_set: {
    shop_money: {
      amount: "2.00",
      currency_code: "ZAR",
    },
    presentment_money: {
      amount: "2.00",
      currency_code: "ZAR",
    },
  },
  total_discounts_set: {
    shop_money: {
      amount: "2.00",
      currency_code: "ZAR",
    },
    presentment_money: {
      amount: "2.00",
      currency_code: "ZAR",
    },
  },
  total_shipping_price_set: {
    shop_money: {
      amount: "0.00",
      currency_code: "ZAR",
    },
    presentment_money: {
      amount: "0.00",
      currency_code: "ZAR",
    },
  },
  subtotal_price_set: {
    shop_money: {
      amount: "0.00",
      currency_code: "ZAR",
    },
    presentment_money: {
      amount: "0.00",
      currency_code: "ZAR",
    },
  },
  total_price_set: {
    shop_money: {
      amount: "0.00",
      currency_code: "ZAR",
    },
    presentment_money: {
      amount: "0.00",
      currency_code: "ZAR",
    },
  },
  total_tax_set: {
    shop_money: {
      amount: "0.00",
      currency_code: "ZAR",
    },
    presentment_money: {
      amount: "0.00",
      currency_code: "ZAR",
    },
  },
  line_items: [
    {
      id: 9228283117743,
      variant_id: 38312911372463,
      title: "TESTING TESTING - DO NOT FULFILL",
      quantity: 1,
      sku: "20502",
      variant_title: "fancy",
      vendor: "Kids Living",
      fulfillment_service: "manual",
      product_id: 4536570904636,
      requires_shipping: true,
      taxable: false,
      gift_card: false,
      name: "TESTING TESTING - DO NOT FULFILL - fancy",
      variant_inventory_management: "shopify",
      properties: [],
      product_exists: true,
      fulfillable_quantity: 1,
      grams: 0,
      price: "1.00",
      total_discount: "0.00",
      fulfillment_status: null,
      price_set: {
        shop_money: {
          amount: "1.00",
          currency_code: "ZAR",
        },
        presentment_money: {
          amount: "1.00",
          currency_code: "ZAR",
        },
      },
      total_discount_set: {
        shop_money: {
          amount: "0.00",
          currency_code: "ZAR",
        },
        presentment_money: {
          amount: "0.00",
          currency_code: "ZAR",
        },
      },
      discount_allocations: [
        {
          amount: "1.00",
          discount_application_index: 0,
          amount_set: {
            shop_money: {
              amount: "1.00",
              currency_code: "ZAR",
            },
            presentment_money: {
              amount: "1.00",
              currency_code: "ZAR",
            },
          },
        },
      ],
      duties: [],
      admin_graphql_api_id: "gid://shopify/LineItem/9228283117743",
      tax_lines: [
        {
          title: "VAT",
          price: "0.00",
          rate: 0.15,
          price_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "ZAR",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "ZAR",
            },
          },
        },
      ],
      origin_location: {
        id: 2030453063740,
        country_code: "ZA",
        province_code: "WC",
        name: "Kids Living",
        address1: "15 Hudson Street",
        address2: "Greenpoint",
        city: "Cape Town",
        zip: "8001",
      },
    },
    {
      id: 9228283150511,
      variant_id: 38312872968367,
      title: "TESTING TESTING - DO NOT FULFILL",
      quantity: 1,
      sku: "TESTINGTESTINGDefaultTitle",
      variant_title: "cool",
      vendor: "Kids Living",
      fulfillment_service: "manual",
      product_id: 4536570904636,
      requires_shipping: true,
      taxable: false,
      gift_card: false,
      name: "TESTING TESTING - DO NOT FULFILL - cool",
      variant_inventory_management: "shopify",
      properties: [],
      product_exists: true,
      fulfillable_quantity: 1,
      grams: 0,
      price: "1.00",
      total_discount: "0.00",
      fulfillment_status: null,
      price_set: {
        shop_money: {
          amount: "1.00",
          currency_code: "ZAR",
        },
        presentment_money: {
          amount: "1.00",
          currency_code: "ZAR",
        },
      },
      total_discount_set: {
        shop_money: {
          amount: "0.00",
          currency_code: "ZAR",
        },
        presentment_money: {
          amount: "0.00",
          currency_code: "ZAR",
        },
      },
      discount_allocations: [
        {
          amount: "1.00",
          discount_application_index: 0,
          amount_set: {
            shop_money: {
              amount: "1.00",
              currency_code: "ZAR",
            },
            presentment_money: {
              amount: "1.00",
              currency_code: "ZAR",
            },
          },
        },
      ],
      duties: [],
      admin_graphql_api_id: "gid://shopify/LineItem/9228283150511",
      tax_lines: [
        {
          title: "VAT",
          price: "0.00",
          rate: 0.15,
          price_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "ZAR",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "ZAR",
            },
          },
        },
      ],
      origin_location: {
        id: 2030453063740,
        country_code: "ZA",
        province_code: "WC",
        name: "Kids Living",
        address1: "15 Hudson Street",
        address2: "Greenpoint",
        city: "Cape Town",
        zip: "8001",
      },
    },
  ],
  fulfillments: [],
  refunds: [],
  total_tip_received: "0.0",
  original_total_duties_set: null,
  current_total_duties_set: null,
  admin_graphql_api_id: "gid://shopify/Order/3257938804911",
  shipping_lines: [
    {
      id: 2688476676271,
      title: "Collect from Johannesburg - Sandton Store",
      price: "0.00",
      code: "Collect from Johannesburg - Sandton Store",
      source: "shopify",
      phone: null,
      requested_fulfillment_service_id: null,
      delivery_category: null,
      carrier_identifier: null,
      discounted_price: "0.00",
      price_set: {
        shop_money: {
          amount: "0.00",
          currency_code: "ZAR",
        },
        presentment_money: {
          amount: "0.00",
          currency_code: "ZAR",
        },
      },
      discounted_price_set: {
        shop_money: {
          amount: "0.00",
          currency_code: "ZAR",
        },
        presentment_money: {
          amount: "0.00",
          currency_code: "ZAR",
        },
      },
      discount_allocations: [],
      tax_lines: [],
    },
  ],
  billing_address: {
    first_name: "Felix",
    address1: "Unit 3, Adelphi",
    phone: "076 031 3590",
    city: "Cape Town",
    zip: "8001",
    province: "Western Cape",
    country: "South Africa",
    last_name: "Tellmann",
    address2: "21 Bellair Road",
    company: "",
    latitude: -33.9211185,
    longitude: 18.4216702,
    name: "Felix Tellmann",
    country_code: "ZA",
    province_code: "WC",
  },
  shipping_address: {
    first_name: "Felix",
    address1: "Unit 3, Adelphi",
    phone: "076 031 3590",
    city: "Cape Town",
    zip: "8001",
    province: "Western Cape",
    country: "South Africa",
    last_name: "Tellmann",
    address2: "21 Bellair Road",
    company: "",
    latitude: -33.9211185,
    longitude: 18.4216702,
    name: "Felix Tellmann",
    country_code: "ZA",
    province_code: "WC",
  },
  customer: {
    id: 5435238354,
    email: "felix@tellmann.co.za",
    accepts_marketing: true,
    created_at: "2017-05-25T20:32:08+02:00",
    updated_at: "2021-02-20T12:53:09+02:00",
    first_name: "Felix",
    last_name: "Tellmann",
    orders_count: 54,
    state: "enabled",
    total_spent: "3.00",
    last_order_id: 3257938804911,
    note: null,
    verified_email: false,
    multipass_identifier: null,
    tax_exempt: false,
    phone: null,
    tags: "newsletter, subscribed",
    last_order_name: "#12455",
    currency: "ZAR",
    accepts_marketing_updated_at: "2018-12-29T22:19:46+02:00",
    marketing_opt_in_level: "single_opt_in",
    admin_graphql_api_id: "gid://shopify/Customer/5435238354",
    default_address: {
      id: 5656501584047,
      customer_id: 5435238354,
      first_name: "Felix",
      last_name: "Tellmann",
      company: "",
      address1: "Unit 3, Adelphi",
      address2: "21 Bellair Road",
      city: "Cape Town",
      province: "Western Cape",
      country: "South Africa",
      zip: "8001",
      phone: "076 031 3590",
      name: "Felix Tellmann",
      province_code: "WC",
      country_code: "ZA",
      country_name: "South Africa",
      default: true,
    },
  },
};

export const ProductUpdateShopifyCounter = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  /** STEP 1
   * Validate incoming webhook - get handle && source_id   * */
  const { SHOPIFY_DOMAIN } = process.env;

  const { body, headers } = req;
  const shook = headers[`x-shopify-shop-domain`] === SHOPIFY_DOMAIN;

  if (!shook) {
    res.status(405).json("Not Allowed");
    return;
  }

  if (!body?.line_items.some(({ title }) => title.includes("TESTING TESTING"))) {
    res.status(200).json({ name: "John Doe3" });
    return;
  }

  const getSaleProducts = [];

  body?.line_items.forEach(({ sku }) => {
    getSaleProducts.push(fetchVendProductBySku(sku));
  });

  console.log(body.order_number);
  const [shopifyOrderDetails, customer, vendSale, sales] = await Promise.allSettled([
    fetchShopifyOrderById(body.id),
    fetchVendCustomerByEmail(body.email),
    fetchVendSaleByInvoiceId(body.order_number),
    Promise.allSettled(getSaleProducts),
  ]);

  if (shopifyOrderDetails.status === "rejected" || customer.status === "rejected" || sales.status === "rejected"
    || vendSale.status === "rejected") {
    console.log(shopifyOrderDetails.status, "shopifyOrderDetails.status");
    console.log(customer.status, "customer.status");
    console.log(sales.status, "sales.status");
    res.status(200).json({ name: "John Doe2" });
    return;
  }

  /* TODO: Match variant_source_id back to line-item variant id! or if length is 1 and variatn_source_id isnt setup properly (due to new variant created) */
  sales.value.forEach((d) => d.status !== "rejected" && console.log(d.value.data));
  console.log(vendSale.value.data.data, "asd");
  console.log(shopifyOrderDetails.value.data.data.order);
  console.log(customer.value.data.customers[0].first_name);

  const firebase = loadFirebase();
  const db = firebase.firestore();

  const duplicate = false;

  await db.collection("testing")
    .doc()
    .set({
      created_at_ISO: new Date(Date.now()).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
      body: JSON.stringify(body),
      body2: JSON.stringify(shopifyOrderDetails.value.data.data.order),
    });

  res.status(200).json({ name: "John Doe" });
};

export default ProductUpdateShopifyCounter;
