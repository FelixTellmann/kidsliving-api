import chalk from "chalk";
import { fetchVendConsignments, vendConsignment } from "entities/consignment/vendFetchConsignments";
import {
  fetchVendConsignmentProductsById,
  vendConsignmentProduct,
} from "entities/consignmentProducts/vendFetchConsignmentProducts";
import { fetchVendProducts, postVendProduct, vendProduct, vendProductInput } from "entities/product/vendFetchProducts";
import { addTag, delay, isSameTags, queryfy, removeTag } from "utils";
import { fetchShopifyGQL } from "utils/fetch";

type ShopifyVariantsWidthMetafields = {
  id: string;
  inventoryPolicy: "CONTINUE" | "DENY";
  metafield: {
    id: string;
    value: string;
  } | null;
};

type ShopifyVariantsWidthMetafieldsRequest = {
  data?: {
    productVariants: {
      edges: {
        cursor: string;
        node: {
          id: string;
          inventoryPolicy: "CONTINUE" | "DENY";
          metafield: {
            id: string;
            value: string;
          };
        };
      }[];
      pageInfo: {
        hasNextPage: boolean;
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

export const createGqlFetchVariantsWithMetafield = (
  key: string,
  namespace: string,
  after?: string,
  page_count = 100
): string => {
  return `query {
    productVariants(first:${page_count}${after ? `,after:"${after}"` : ""}) {
      edges { 
        cursor
        node {
          id
          inventoryPolicy
          metafield(key: "${key}", namespace: "${namespace}") {
            id
            value
          }
        } 
      }
      pageInfo {
        hasNextPage
      } 
    }
  }`;
};

async function getAllVendProducts(): Promise<vendProduct[]> {
  const [initialRequest] = await Promise.allSettled([fetchVendProducts()]);

  if (initialRequest.status !== "fulfilled") return [];

  console.log(initialRequest.value.data.pagination);
  const pages = initialRequest.value.data.pagination?.pages ?? 1;

  if (pages === 1) return initialRequest.value.data.products ?? [];

  const pagesToFetch = [];
  for (let i = 2; i <= pages; i++) {
    pagesToFetch.push(fetchVendProducts(i));
  }

  const pageRequests = await Promise.allSettled(pagesToFetch);

  return pageRequests.reduce((acc, pageRequest) => {
    if (pageRequest.status !== "fulfilled") return acc;
    return [...acc, ...pageRequest.value.data.products];
  }, initialRequest.value.data.products);
}

async function getAllVendConsignments(
  monthsAgo = 5,
  filterStatus = "OPEN",
  filterType = "SUPPLIER"
): Promise<[vendConsignment[], vendConsignmentProduct[]]> {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const fiveMonthAgo = date.toISOString().split("T")[0];
  const [initialRequest] = await Promise.allSettled([fetchVendConsignments(fiveMonthAgo)]);

  if (initialRequest.status !== "fulfilled") return [[], []];

  console.log(initialRequest.value.data.pagination);
  const pages = initialRequest.value.data.pagination?.pages ?? 1;

  const pagesToFetch = [];
  for (let i = 2; i <= pages; i++) {
    pagesToFetch.push(fetchVendConsignments(fiveMonthAgo, i));
  }

  const pageRequests = await Promise.allSettled(pagesToFetch);

  const vendConsignmentsRequest = pageRequests.reduce((acc, pageRequest) => {
    if (pageRequest.status !== "fulfilled") return acc;
    return [...acc, ...pageRequest.value.data.consignments];
  }, initialRequest.value.data.consignments);

  const vendConsignments: vendConsignment[] = vendConsignmentsRequest.filter(
    ({ status, type }) => status === filterStatus && type === filterType
  );

  console.log(vendConsignments[6]);
  console.log(chalk.green(`5. Load all consignment Products`));
  const consignmentProductsRequests = await Promise.allSettled(
    vendConsignments.map(({ id }) => getAllVendConsignmentProducts(id))
  );

  const consignmentProducts: vendConsignmentProduct[] = consignmentProductsRequests.reduce((acc, consignmentProduct) => {
    if (consignmentProduct.status === "rejected") return acc;
    return [...acc, ...consignmentProduct.value];
  }, []);

  return [vendConsignments, consignmentProducts];
}

async function getAllVendConsignmentProducts(id: string): Promise<vendConsignmentProduct[]> {
  const [initialRequest] = await Promise.allSettled([fetchVendConsignmentProductsById(id)]);

  if (initialRequest.status !== "fulfilled") return [];

  const pages = initialRequest.value.data.pagination?.pages ?? 1;

  if (pages === 1) return initialRequest.value.data.consignment_products ?? [];

  const pagesToFetch = [];
  for (let i = 2; i <= pages; i++) {
    pagesToFetch.push(fetchVendConsignmentProductsById(id, i));
  }

  const pageRequests = await Promise.allSettled(pagesToFetch);

  return pageRequests.reduce((acc, pageRequest) => {
    if (pageRequest.status !== "fulfilled") return acc;
    return [...acc, ...pageRequest.value.data.consignments];
  }, initialRequest.value.data.consignment_products);
}

async function getAllShopifyVariants(): Promise<ShopifyVariantsWidthMetafields[]> {
  let completed = false;
  let after = undefined;
  let variants = [];
  async function getData(after = undefined) {
    try {
      const result = await fetchShopifyGQL(createGqlFetchVariantsWithMetafield("preorders", "vend", after));
      try {
        if (!result.data.data.productVariants.edges) {
          return [[], "", false];
        }
      } catch (err) {
        console.log(err.message, "asd");
        return [[], "", false];
      }
      const {
        data: {
          productVariants: {
            edges: initialVariants,
            pageInfo: { hasNextPage },
          },
        },
        extensions,
      } = result.data as ShopifyVariantsWidthMetafieldsRequest;
      console.log(chalk.red(JSON.stringify(extensions)));
      return [initialVariants.map(v => v.node), initialVariants[initialVariants.length - 1].cursor, hasNextPage];
    } catch (err) {
      console.log(err.message);
      return [[], "", false];
    }
  }

  while (!completed) {
    const [newVariants, lastCursor, hasNextPage] = await getData(after);
    await delay(3750);
    if (!Array.isArray(newVariants)) return;
    variants = [...variants, ...newVariants];
    after = lastCursor;
    completed = !hasNextPage;
  }

  return variants;
}

const handler = async _ => {
  const startTime = Date.now();
  console.log(Date.now() - startTime + "ms");

  console.log(chalk.green(`1. Setup Amplify auto create functions & include API keys for env variables - done`));
  console.log(chalk.green(`2. Load all Consignments  from Vend - Log Pagination:`));
  console.log(chalk.green(`3. Load all Products from Vend - Log Pagination:`));
  console.log(chalk.green(`4. Load all Variants from Shopify - Log Pagination:`));

  const [vendConsignmentsRequest, vendProductsRequest, shopifyMetafieldRequests] = await Promise.allSettled([
    getAllVendConsignments(5, "OPEN", "SUPPLIER"),
    getAllVendProducts(),
    getAllShopifyVariants(),
  ]);

  if (
    vendConsignmentsRequest.status !== "fulfilled" ||
    vendProductsRequest.status !== "fulfilled" ||
    shopifyMetafieldRequests.status !== "fulfilled"
  ) {
    return {
      statusCode: 50,
      body: JSON.stringify("Server Error"),
    };
  }
  const shopifyVariantsWithMetafield = shopifyMetafieldRequests.value;

  const vendProducts = vendProductsRequest.value as vendProduct[];

  const [vendConsignments, unorderedConsignmentProducts] = vendConsignmentsRequest.value;
  console.log(chalk.gray(`4. Update Products based on Criteria - i.e. not on shopify - but is on Shopify - FX tags`));

  const { counter, onShopify, preorder, ...consignmentProductsObject } = unorderedConsignmentProducts.reduce(
    (acc, consignmentProduct) => {
      const vendProduct = vendProducts.find(({ id }) => id === consignmentProduct.product_id);
      const vendConsignment = vendConsignments.find(({ id }) => id === consignmentProduct.consignment_id);

      if (!vendProduct) return acc;
      acc.counter++;

      if ((vendProduct.source_id || vendProduct.variant_source_id) && !vendProduct.source_id.includes("unpub")) {
        acc.onShopify++;
      }

      const container = vendConsignment.name.toLowerCase().includes("container");
      const expectedDate = vendConsignment.name
        .toLowerCase()
        .replace(/(container|preorder)/gi, "")
        .trim();

      const preorder = vendConsignment.name.toLowerCase().includes("preorder");
      preorder && acc.preorder++;

      if (acc[consignmentProduct.product_id]) {
        acc[consignmentProduct.product_id].consignments.push({
          name: vendConsignment.name,
          quantity: +consignmentProduct.count,
          expectedDate,
          preorder: vendConsignment.name.toLowerCase().includes("preorder"),
          container: vendConsignment.name.toLowerCase().includes("container"),
        });
        acc[consignmentProduct.product_id].preorder = acc[consignmentProduct.product_id].preorder || preorder;
        acc[consignmentProduct.product_id].container = acc[consignmentProduct.product_id].container || container;
        return acc;
      }

      acc[consignmentProduct.product_id] = {
        product_id: vendProduct.source_id,
        variant_id: vendProduct.variant_source_id,
        tags: vendProduct.tags,
        consignments: [
          {
            name: vendConsignment.name,
            quantity: +consignmentProduct.count,
            expectedDate,
            preorder: vendConsignment.name.toLowerCase().includes("preorder"),
            container: vendConsignment.name.toLowerCase().includes("container"),
          },
        ],
        preorder,
        container,
      };

      return acc;
    },
    { counter: 0, onShopify: 0, preorder: 0 }
  );

  const vendEditTags_addToShopify = [];
  const shopifyEditInventoryAndMetafield = [];

  console.log(chalk.blueBright(JSON.stringify({ counter, onShopify, preorder })));

  /*= =============== For All Vend Products - Check Tags (can be removed in future as its only to clean up old tags) ================ */
  const vendProductsWithUpdatedTags = vendProducts.map(({ id, tags, source_id, ...rest }) => {
    const hasTag_needsPublishToShopify = tags.includes("FX_needs_publish_to_shopify");
    const hasTag_needsVariantImage = tags.includes("FX_needs_variant_image");
    const newTags = tags
      .split(",")
      .filter(t => !t.toLowerCase().includes(`fx_`))
      .join(",");

    if (!source_id && !source_id?.includes("_unpub") && hasTag_needsPublishToShopify) {
      addTag(newTags, "FX2_needs_publish_to_shopify");
    }

    if (hasTag_needsVariantImage) {
      addTag(newTags, "FX2_needs_variant_image");
    }

    return { ...rest, id, source_id, tags, newTags };
  });

  /*= =============== For all consignment products that container preorder or container
   *  - Add Tag on Vend
   * -  add to Shopify metafields  ================ */
  const consignmentProductsArray = Object.entries(consignmentProductsObject).reduce((acc, [vend_product_id, cP]) => {
    acc.push({ vend_product_id, ...cP });
    return acc;
  }, []);

  consignmentProductsArray.forEach(({ vend_product_id, preorder, container, product_id, variant_id, consignments }) => {
    const vendProductIndex = vendProductsWithUpdatedTags.findIndex(vpt => vpt.id === vend_product_id);
    if (!vendProductIndex) return;
    const tags = vendProductsWithUpdatedTags[vendProductIndex]?.newTags ?? "";
    let newTags = tags;
    const shopifyMetafields = shopifyVariantsWithMetafield.find(m => m.id.includes(variant_id));

    if (!product_id && !tags.includes("FX2_needs_publish_to_shopify" && container)) {
      newTags = addTag(newTags, "FX2_needs_publish_to_shopify");
    }

    if (
      product_id &&
      variant_id &&
      !product_id.includes("unpub") &&
      container &&
      preorder &&
      shopifyMetafields &&
      (shopifyMetafields.inventoryPolicy === "DENY" || shopifyMetafields.metafield)
    ) {
      if (!newTags.includes("FX2_auto_preorder")) {
        newTags = addTag(newTags, "FX2_auto_preorder");
      }
      const input = JSON.stringify(consignments).replace(/"/gi, `\\"`);
      if (shopifyMetafields.metafield?.value?.replace(/"/gi, `\\"`) !== input) {
        shopifyEditInventoryAndMetafield.push(
          fetchShopifyGQL(`
            mutation { 
              productVariantUpdate(input: {id: "gid://shopify/ProductVariant/${variant_id}", inventoryPolicy: CONTINUE, metafields: [{ key: "preorders", valueType: JSON_STRING, value: "${input}", namespace: "vend" }] }) {
                productVariant { 
                  id
                  inventoryPolicy
                } 
                userErrors {
                  field
                  message
                }
              }
            }
          `)
        );
      }
    }
    vendProductsWithUpdatedTags[vendProductIndex].newTags = newTags;
  });

  /*= =============== All Metafields - Remove Products not found in consignment products with preorder / container  ================ */
  shopifyVariantsWithMetafield.forEach(({ id: variant_id, metafield }) => {
    const clean_variant_id = variant_id.replace("gid://shopify/ProductVariant/", "");
    const vendProductIndex = vendProductsWithUpdatedTags.findIndex(vp =>
      vp.variant_source_id.includes(`${clean_variant_id}`)
    );
    const v_Product = vendProductsWithUpdatedTags[vendProductIndex];
    if (v_Product) {
      console.log(metafield);

      const consignmentProduct = consignmentProductsArray.find(vcp => vcp.vend_product_id === v_Product.id);
      const newTags = v_Product.newTags;

      if (!consignmentProduct || !consignmentProduct?.preorder) {
        vendProductsWithUpdatedTags[vendProductIndex].newTags = removeTag(newTags, "FX2_auto_preorder");
        if (metafield) {
          shopifyEditInventoryAndMetafield.push(
            fetchShopifyGQL(` 
            mutation { 
              metafieldDelete(input: {id: "${metafield.id}"}) {
                deletedId
                userErrors {
                  field
                  message
                }
              } 
              productVariantUpdate(input: {id: "gid://shopify/ProductVariant/${clean_variant_id}", inventoryPolicy: DENY }) {
                product {
                  id
                }
                productVariant {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `)
          );
        }
      }
    }
  });

  vendProductsWithUpdatedTags.forEach(({ id, tags, newTags, variant_source_id, source_id }) => {
    if (source_id && variant_source_id) {
      if (newTags.split(",").filter(t => !/^fx2?_.*/gi.test(t)).length === 0 && !source_id?.includes("_unpub")) {
        newTags = addTag(newTags, "FX2_needs_category_tags");
      }
      if (tags === "" && !newTags.includes("FX2_needs_category_tags") && !source_id?.includes("_unpub")) {
        newTags = addTag(newTags, "FX2_needs_category_tags");
      }
      if (
        (newTags.includes("FX2_needs_category_tags") && newTags.split(",").filter(t => !/^fx2?_.*/gi.test(t)).length > 0) ||
        source_id?.includes("_unpub")
      ) {
        newTags = removeTag(newTags, "FX2_needs_category_tags");
      }
    }

    if (!isSameTags(tags, newTags)) {
      vendEditTags_addToShopify.push(postVendProduct({ id, tags: newTags }));
    }
  });

  try {
    console.log(vendEditTags_addToShopify.length, "vendEditTags_addToShopify");
    console.log(shopifyEditInventoryAndMetafield.length, "shopifyEditInventoryAndMetafield");
    console.log(shopifyEditInventoryAndMetafield[0]);
    const final = await Promise.allSettled([...vendEditTags_addToShopify, ...shopifyEditInventoryAndMetafield]);
    console.log(Date.now() - startTime + "ms");

    const result = final.reduce((acc, requests) => {
      if (requests.status !== "fulfilled") return acc;
      return [...acc, requests.value.data];
    }, []);

    /*console.log(JSON.stringify(result));*/

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.log(err.message);
  }

  /* const promiseArray = [[]];
  for (let i = 0; i < updateRequests.length; i += 50) {
    promiseArray.push(updateRequests.slice(i, i + 50));
  }

  let resultArray = [];
  for (let i = 0; i < promiseArray.length; i++) {
    resultArray = [...resultArray, ...(await Promise.allSettled(promiseArray[i].map(v => postVendProduct(v))))];
    console.log(i, Date.now() - startTime + "ms");
    console.log(resultArray.filter(r => r.status === "rejected").length);
    if (i % 2 === 0) await delay(5000);
  }*/

  console.log(Date.now() - startTime + "ms");
  return {
    statusCode: 200,
    body: JSON.stringify({ counter, onShopify, preorder, ...consignmentProductsObject }),
  };
};

exports.handler = handler;

export default async (req, res) => {
  const { body } = await handler("");
  res.status(200).json(body);
};
