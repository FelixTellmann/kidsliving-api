import { fetchShopifyGQL } from "../../utils/fetch";

type shopifyFetchOrder = {
  data: {
    "data": {
      "order": {
        "fulfillmentOrders": {
          "edges": {
            "node": {
              "id": string,
              "status": "CANCELLED" | "CLOSED" | "INCOMPLETE" | "IN_PROGRESS" | "OPEN" | "SCHEDULED"
              "assignedLocation": {
                "name": string
              },
              "lineItems": {
                "edges": {
                  "node": {
                    "lineItem": {
                      "name": string,
                      "variant": {
                        "id": string
                      }
                    },
                    "remainingQuantity": number,
                    "totalQuantity": number
                  }
                }[]
              }
            }
          }[]
        }
      }
    },
    extensions: {
      cost: {
        requestedQueryCost: number,
        actualQueryCost: number,
        throttleStatus: {
          maximumAvailable: number,
          currentlyAvailable: number,
          restoreRate: number
        }
      }
    }
  }
};

type IFetchShopifyOrderById = (order_id: string | number) => Promise<shopifyFetchOrder>;

export const fetchShopifyOrderById: IFetchShopifyOrderById = (order_id) => {
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
