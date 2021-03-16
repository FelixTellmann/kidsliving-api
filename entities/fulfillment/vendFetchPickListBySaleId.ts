import { fetchVendGQL } from "../../utils/fetch";

export type vendFulfillmentSale = {
  id: string;
  picklists?: {
    id: string;
    state: string;
    outlet: {
      id: string;
      name: string;
    };
    lineItems: {
      id: string;
      note: string;
      pickedQuantity: number;
      saleLineItem: {
        product: {
          id: string;
          sku: string;
          sourceID: string | number;
          sourceVariantID: string | number;
        };
      };
    }[];
  }[];
  fulfillments?: {
    id: string;
    status: string;
    outlet: {
      name: string;
      id: string;
    };
    lineItems: {
      quantity: number;
      product: {
        id: string;
        sku: string;
        sourceID: string | number;
        sourceVariantID: string | number;
      };
    }[];
  }[];
};

type vendFetchGqlSale = {
  data: {
    data: {
      sale: vendFulfillmentSale;
    };
  };
};

type IFetchVendGqlSaleById = (order_id: string | number) => Promise<vendFetchGqlSale>;

export const fetchVendGqlSaleById: IFetchVendGqlSaleById = order_id => {
  return fetchVendGQL({
    operationName: "Sale",
    query: `query Sale($id: ID!){
      sale(id: $id) {
        id
        picklists {
          id
          state
          outlet {
            id
            name
          }
          lineItems {
            id
            note
            pickedQuantity
            saleLineItem {
              product {
                id
                sku                
                sourceID
                sourceVariantID
              }
            }
          }        
        }
        fulfillments {
          id
          status
          outlet {
            name
            id
          }
          lineItems {
            quantity
            product {
              id
              sku
              sourceID
              sourceVariantID
            }
          }
        }
      }
    }`,
    variables: { id: order_id },
  });
};
