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

type shopifyFetchOrderNoDetail = {
  data: {
    data: {
      order: {
        name: string;
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
    name
  }
}`);
};
