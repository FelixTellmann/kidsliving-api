import { fetchShopifyGQL } from "utils/fetch";

export type shopifyFetchProducts = {
  data: {
    data: {
      product: {
        id: string,
        status: "ACTIVE" | "ARCHIVED" | "DRAFT",
        productType: string,
        descriptionHtml: string,
        tags: string[],
        featuredImage: { id: string } | null,
        variants: {
          edges: {
            node: {
              id: string,
              image: { id: string } | null,
              inventoryQuantity: number,
              price: string,
              sku: string,
              selectedOptions: { value: string }[]
              inventoryItem: {
                id: string,
                inventoryLevels: {
                  edges: {
                    node: {
                      id: string,
                      available: number,
                      location: { id: string }
                    }
                  }[]
                }
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

type IFetchShopifyProductByProductId = (product_id: string | number) => Promise<shopifyFetchProducts>;

export const fetchShopifyProductByProductId: IFetchShopifyProductByProductId = (product_id) => {
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
