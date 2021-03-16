import { fetchVendGQL } from "../../utils/fetch";

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

export const fetchVendGqlSaleById: IFetchShopifyGqlOrderById = order_id => {
  return fetchVendGQL(`query {
    sale(id: ${order_id}) {
      id
    }
  }`);
};
