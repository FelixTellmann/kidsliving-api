import { fetchShopifyGQL } from "utils/fetch";

export type shopifyFetchProducts = {
  data: {
    data?: {
      product: {
        id: string;
        status: "ACTIVE" | "ARCHIVED" | "DRAFT";
        productType: string;
        descriptionHtml: string;
        tags: string[];
        featuredImage: { id: string } | null;
        metafield: { id: string; key: string; value: string } | null;
        variants: {
          edges: {
            node: {
              id: string;
              image: { id: string } | null;
              inventoryQuantity: number;
              price: string;
              sku: string;
              selectedOptions: { value: string }[];
              metafield: { id: string; key: string; value: string } | null;
              inventoryItem: {
                id: string;
                inventoryLevels: {
                  edges: {
                    node: {
                      id: string;
                      available: number;
                      location: { id: string };
                    };
                  }[];
                };
              };
            };
          }[];
        };
      } | null;
    };
    extensions?: {
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
    errors?: {
      message: string;
      locations: { line: number; column: number }[];
      path: string[];
      extensions: {
        [key: string]: string;
      };
    }[];
  };
};

type IFetchShopifyProductByProductId = (product_id: string | number) => Promise<shopifyFetchProducts>;

export const fetchShopifyProductByProductId: IFetchShopifyProductByProductId = product_id => {
  return fetchShopifyGQL(`query {
  product(id: "gid://shopify/Product/${product_id}") {
    id
    status
    productType
    descriptionHtml
    tags
    featuredImage {
      id
    }
    metafield(key: "shopify", namespace: "vend") {
       id
       key
       value
    }
    variants(first: 32) {
      edges {
        node {
          id
          image {
            id
          }
          inventoryQuantity
          price
          sku
          selectedOptions {
            value
          }
          metafield(key: "active", namespace: "vend") {
            id
            key
            value
          }
          inventoryItem {
            id
            inventoryLevels(first: 2) {
              edges {
                node {
                  id
                  available
                  location {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`);
};
