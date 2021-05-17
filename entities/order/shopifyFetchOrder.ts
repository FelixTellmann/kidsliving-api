import { fetchShopify, fetchShopifyGQL } from "utils/fetch";

type shopifyFetchOrder = {
  data: {
    data: {
      order: {
        fulfillmentOrders: {
          edges: {
            node: {
              id: string;
              status: "CANCELLED" | "CLOSED" | "INCOMPLETE" | "IN_PROGRESS" | "OPEN" | "SCHEDULED";
              assignedLocation: {
                name: string;
              };
              lineItems: {
                edges: {
                  node: {
                    lineItem: {
                      name: string;
                      variant: {
                        id: string;
                      };
                    };
                    remainingQuantity: number;
                    totalQuantity: number;
                  };
                }[];
              };
            };
          }[];
        };
      };
    };
    extensions: {
      cost: {
        requestedQueryCost: number;
        actualQueryCost: number;
        throttleStatus: {
          maximumAvailable: number;
          currentlyAvailable: number;
          restoreRate: number;
        };
      };
    };
  };
};

type IFetchShopifyGqlOrderById = (order_id: string | number) => Promise<shopifyFetchOrder>;

export const fetchShopifyGqlOrderById: IFetchShopifyGqlOrderById = order_id => {
  return fetchShopifyGQL(`query {
  order(id: "gid://shopify/Order/${order_id}") {
    fulfillmentOrders(first: 2) {
      edges {
        node {
          id
          status
          assignedLocation {
            name
          }
          lineItems(first: 2) {
            edges {
              node {
                lineItem {
                  name
                  variant {
                    id
                  }
                }
                remainingQuantity
                totalQuantity
              }
            }
          }
        }
      }
    }
  }
}`);
};

export type fulfillmentOrder = {
  id: number;
  shop_id: number;
  order_id: number;
  assigned_location_id: number;
  fulfillment_service_handle: string;
  request_status: string;
  status: string;
  supported_actions: string[];
  destination: {
    id: number;
    address1: string;
    address2: string;
    city: string;
    company: string;
    country: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    province: string;
    zip: string;
  };
  line_items: {
    id: number;
    shop_id: number;
    fulfillment_order_id: number;
    quantity: number;
    line_item_id: number;
    inventory_item_id: number;
    fulfillable_quantity: number;
    variant_id: number;
  }[];
  assigned_location: {
    address1: string;
    address2: string;
    city: string;
    country_code: string;
    location_id: number;
    name: string;
    phone: string;
    province: string;
    zip: string;
  };
  merchant_requests: (unknown | any)[];
};

export type shopifyFetchFulfillmentOrder = {
  data: {
    fulfillment_orders: {
      id: number;
      shop_id: number;
      order_id: number;
      assigned_location_id: number;
      fulfillment_service_handle: string;
      request_status: string;
      status: string;
      supported_actions: string[];
      destination: {
        id: number;
        address1: string;
        address2: string;
        city: string;
        company: string;
        country: string;
        email: string;
        first_name: string;
        last_name: string;
        phone: string;
        province: string;
        zip: string;
      };
      line_items: {
        id: number;
        shop_id: number;
        fulfillment_order_id: number;
        quantity: number;
        line_item_id: number;
        inventory_item_id: number;
        fulfillable_quantity: number;
        variant_id: number;
      }[];
      assigned_location: {
        address1: string;
        address2: string;
        city: string;
        country_code: string;
        location_id: number;
        name: string;
        phone: string;
        province: string;
        zip: string;
      };
      merchant_requests: (unknown | any)[];
    }[];
  };
};

type IFetchShopifyFulfillmentOrderById = (order_id: string | number) => Promise<shopifyFetchFulfillmentOrder>;

export const fetchShopifyFulfillmentOrdersById: IFetchShopifyFulfillmentOrderById = order_id => {
  return fetchShopify(`/orders/${order_id}/fulfillment_orders.json`);
};

export type shopifyFulfillment = {
  id: number | null;
  order_id: number | null;
  status: string | null;
  created_at: string | null;
  service: string | null;
  updated_at: string | null;
  tracking_company: null;
  shipment_status: null;
  location_id: number | null;
  line_items: {
    id: number;
    variant_id: number | null;
    title: string | null;
    quantity: number | null;
    sku: string | null;
    variant_title: string | null;
    vendor: string | null;
    fulfillment_service: string | null;
    product_id: number | null;
    requires_shipping: true;
    taxable: false;
    gift_card: false;
    name: string | null;
    variant_inventory_management: string | null;
    properties: [];
    product_exists: true;
    fulfillable_quantity: number | null;
    grams: number | null;
    price: string | null;
    total_discount: string | null;
    fulfillment_status: string | null;
    price_set: any;
    total_discount_set: any;
    discount_allocations: any[];
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
    admin_graphql_api_id: string | null;
    duties: [];
    tax_lines: {
      price: string | null;
      rate: number | null;
      title: string | null;
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
    }[];
  }[];
  tracking_number: string | null;
  tracking_numbers: string[];
  tracking_url: null;
  tracking_urls: [];
  receipt: {};
  name: string | null;
  admin_graphql_api_id: string | null;
};

export type shopifyFetchFulfillments = {
  data: {
    fulfillments: shopifyFulfillment[];
  };
};

type IFetchShopifyFulfillmentsByOrderId = (order_id: string | number) => Promise<shopifyFetchFulfillments>;

export const fetchShopifyFulfillmentsByOrderId: IFetchShopifyFulfillmentsByOrderId = order_id => {
  return fetchShopify(`/orders/${order_id}/fulfillments.json`);
};

type shopifyFetchOrderNoDetail = {
  data: {
    data: {
      order: {
        fulfillable: boolean;
      };
    };
    extensions: {
      cost: {
        requestedQueryCost: number;
        actualQueryCost: number;
        throttleStatus: {
          maximumAvailable: number;
          currentlyAvailable: number;
          restoreRate: number;
        };
      };
    };
  };
};

type IFetchShopifyGqlOrderByIdNoDetail = (order_id: string | number) => Promise<shopifyFetchOrderNoDetail>;

export const fetchShopifyGqlOrderByIdNoDetail: IFetchShopifyGqlOrderByIdNoDetail = order_id => {
  return fetchShopifyGQL(`query {
  order(id: "gid://shopify/Order/${order_id}") {
    fulfillable
  }
}`);
};
