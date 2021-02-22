import { addTag, isSameDescription, isSameTags, mergeDescriptions, mergeTags, queryfy, removeTag } from "./index";

const { VEND_CPT_OUTLET_ID, VEND_JHB_OUTLET_ID, SHOPIFY_CPT_OUTLET_ID, SHOPIFY_JHB_OUTLET_ID } = process.env;

export type productModel = {
  [key: string]: any
  vend_id?: string,
  vend_unpublished?: boolean
  product_id: number
  variant_id: number
  tags: string | null
  has_variants?: boolean
  name?: string
  title?: string
  description: string
  price: string
  sku: string
  product_type?: string
  option1?: string
  option2?: string
  option3?: string
  inventory_item_id?: number
  inventory_CPT?: number
  inventory_CPT_level_id?: string
  inventory_JHB?: number
  inventory_JHB_level_id?: string
  inventory_quantity?: number
  inventory_policy?: "continue" | "deny",
  image_id?: number
  s_status?: "active" | "draft" | "archived"
  v_all_inactive?: boolean
  v_all_unpublished?: boolean
  v_incorrectly_unpublished?: boolean
  v_description?: string
  v_inconsistent_description?: boolean
  v_tags?: string
  v_inconsistent_tags?: boolean
  v_has_sell_jhb_tag?: boolean
  v_has_needs_variant_image_tag?: boolean
  v_single_product?: boolean
  s_has_jhb_inventory?: boolean
};

export const createGqlQueryProduct = (product_id: number): string => {
  return `{
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
            metafield(key: "shopify", namespace: "vend") {
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
  }`;
};

export const createGqlNewVariantMutation = (
  product_id: number,
  sku: string,
  price: string,
  inventory_CPT: number,
  inventory_JHB?: number,
  option1?: string,
  option2?: string,
  option3?: string,
): string => {
  const inventoryQuantities = [{ availableQuantity: inventory_CPT, locationId: "gid://shopify/Location/22530642" }];
  inventory_JHB
  && inventoryQuantities.push({ availableQuantity: inventory_JHB, locationId: "gid://shopify/Location/36654383164" });

  const config = {
    productId: `gid://shopify/Product/${product_id}`,
    sku,
    options: [option1 || "", option2 || "", option3 || ""],
    price,
    inventoryQuantities,
  };

  return `mutation {
    productVariantCreate(input: ${queryfy(config)}) {
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
  }`;
};

export const createGqlUpdateVariantMutation = (
  variant_id: number,
  sku: string,
  price: string,
  inventory_CPT: number,
  inventory_CPT_level_id: string,
  s_inventory_CPT: number,
  option1?: string,
  option2?: string,
  option3?: string,
): string => {
  const inventory_CPT_config = `
  inventoryAdjustQuantity(input: ${queryfy({
    inventoryLevelId: inventory_CPT_level_id,
    availableDelta: inventory_CPT - s_inventory_CPT,
  })}) {
    inventoryLevel {
      id
    }
    userErrors {
      field
      message
    }
  }`;

  const config = {
    id: `gid://shopify/ProductVariant/${variant_id}`,
    sku,
    options: [option1 || "", option2 || "", option3 || ""],
    price,
  };

  return `
  ${inventory_CPT_config}
  productVariantUpdate(input: ${queryfy(config)}) {
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
  }`;
};
export const createGqlAdjustJHBInventoryQuantity = (
  inventory_JHB: number,
  inventory_JHB_level_id: string,
  s_inventory_JHB: number,
): string => {
  return `mutation {
    inventoryAdjustQuantity(input: ${queryfy({
    inventoryLevelId: inventory_JHB_level_id,
    availableDelta: inventory_JHB - s_inventory_JHB,
  })}) {
      inventoryLevel { 
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;
};

export const createGqlConnectInvLocationMutation = (
  inventory_JHB: number,
  inventory_item_id: number,
  v_has_sell_jhb_tag?: boolean,
  inventory_JHB_level_id?: string,
): string => {
  if (v_has_sell_jhb_tag && !inventory_JHB_level_id) {
    return `inventoryActivate(
      inventoryItemId: "gid://shopify/InventoryItem/${inventory_item_id}", 
      locationId: "gid://shopify/Location/36654383164", 
      available: ${inventory_JHB}) {
      inventoryLevel {
        id
      }
      userErrors {
        field
        message
      }
    }`;
  }
  return "";
};

export const createGqlDisconnectInvLocationMutation = (
  v_has_sell_jhb_tag?: boolean,
  inventory_JHB_level_id?: string,
): string => {
  if (!v_has_sell_jhb_tag && inventory_JHB_level_id) {
    return `inventoryDeactivate(inventoryLevelId: "${inventory_JHB_level_id}") {
    userErrors {
      field
      message
    }
  }`;
  }
  return "";
};

export const isUnpublished = (({ source_id, variant_source_id }) => source_id.includes("unpub") || variant_source_id.includes("unpub"));
export const isPublished = (({ source_id, variant_source_id }) => !source_id.includes("unpub") && !variant_source_id.includes("unpub"));

export const isInactive = (({ active }: any): boolean => !active);
export const isActive = (({ active }: any): boolean => active);

export const hasVariantImage = (({ image_id, node }: productModel): boolean => !!image_id || !!node?.image);

export const simplifyProducts = ((products: any, source: "vend" | "shopify" | "shopify_gql"): productModel[] => {
  if (source === "vend") {
    const v_all_inactive = products.every(isInactive);
    const v_all_unpublished = products.every(isUnpublished);
    const v_incorrectly_unpublished = !v_all_unpublished && products.some(isUnpublished);
    const v_description = products.reduce((acc, { description: d }) => { return mergeDescriptions(acc, d); }, "");
    const v_tags = products.reduce((acc, { tags }) => { return mergeTags(acc, tags); }, "");
    const v_inconsistent_tags = !products.every(({ tags }) => isSameTags(tags, v_tags));
    const v_has_sell_jhb_tag = v_tags.toLowerCase().includes("sell jhb");
    const v_has_needs_variant_image_tag = v_tags.toLowerCase().includes("fx_needs_variant_image");
    const v_single_product = products.length === 1;

    return products.reduce((acc: productModel[], variant: productModel): productModel[] => {
      const {
        id,
        active,
        source_id,
        variant_source_id,
        price,
        tax,
        sku,
        type,
        variant_option_one_value,
        variant_option_one_name,
        variant_option_two_value,
        variant_option_two_name,
        variant_option_three_value,
        variant_option_three_name,
        inventory,
        description,
      } = variant;

      const inventory_CPT = +inventory?.filter(({ outlet_id }) => outlet_id === VEND_CPT_OUTLET_ID)[0]?.count || 0;
      const inventory_JHB = +inventory?.filter(({ outlet_id }) => outlet_id === VEND_JHB_OUTLET_ID)[0]?.count || 0;
      const v_unpublished = source_id.includes("unpub") || variant_source_id.includes("unpub");

      acc.push({
        vend_id: id,
        product_id: +source_id?.replace(/_unpub/gi, ""),
        variant_id: +variant_source_id?.replace(/_unpub/gi, ""),
        tags: v_tags,
        description: v_description,
        price: (+price + +tax).toFixed(2),
        sku,
        product_type: type,
        option1: variant_option_one_name !== "" ? variant_option_one_value : null,
        option2: variant_option_two_name !== "" ? variant_option_two_value : null,
        option3: variant_option_three_name !== "" ? variant_option_three_value : null,
        inventory_CPT,
        inventory_JHB,
        inventory_quantity: inventory_CPT + inventory_JHB,
        v_active: active,
        v_all_inactive,
        v_unpublished,
        v_all_unpublished,
        v_incorrectly_unpublished,
        v_inconsistent_description: description !== v_description,
        v_inconsistent_tags,
        v_has_sell_jhb_tag,
        v_has_needs_variant_image_tag,
        v_single_product,
      });

      return acc;
    }, []);
  }
  if (source === "shopify") {
    const { id, images, product_type, status, tags, variants, body_html } = products;
    const s_needs_variant_image = !products.variants.every(hasVariantImage);

    return variants.reduce((acc: productModel[], variant: productModel): productModel[] => {
      const {
        id: variant_id,
        price,
        sku,
        option1,
        option2,
        option3,
        inventory_quantity,
        inventory_item_id,
        inventory_policy,
        image_id,
      } = variant;

      acc.push({
        vend_id: undefined,
        vend_unpublished: undefined,
        product_id: id,
        variant_id,
        tags,
        description: body_html,
        price,
        sku,
        product_type,
        option1,
        option2,
        option3,
        inventory_item_id,
        inventory_CPT: undefined,
        inventory_JHB: undefined,
        inventory_quantity,
        inventory_policy,
        image_id,
        s_status: status,
        s_needs_variant_image,
      });

      return acc;
    }, []);
  }

  if (source === "shopify_gql") {
    const {
      id: s_gql_product_id,
      productType,
      status,
      descriptionHtml,
      tags: s_gql_tags,
      featuredImage,
      variants: { edges: variants },
    } = products;

    const s_needs_variant_image = (variants.length > 1 && !variants.every(hasVariantImage))
      || (variants.length === 1 && !featuredImage);
    const tags = s_gql_tags.join(",");

    return variants.reduce((acc: productModel[], { node: variant }: productModel): productModel[] => {
      const {
        id: s_gql_variant_id,
        price,
        sku,
        inventoryQuantity,
        inventoryItem: {
          id: s_gql_inventory_item_id,
          inventoryLevels: { edges: inventoryLevels },
        },
        inventory_policy,
        image,
        selectedOptions,
      } = variant;

      const inventory_CPT = inventoryLevels?.filter(({ node: { location: { id } } }) => id.replace(
        "gid://shopify/Location/",
        "",
      ) === SHOPIFY_CPT_OUTLET_ID)[0]?.node?.available;

      const inventory_CPT_level_id = inventoryLevels?.filter(({ node: { location: { id } } }) => id.replace(
        "gid://shopify/Location/",
        "",
      ) === SHOPIFY_CPT_OUTLET_ID)[0]?.node?.id;

      const inventory_JHB = inventoryLevels?.filter(({ node: { location: { id } } }) => id.replace(
        "gid://shopify/Location/",
        "",
      ) === SHOPIFY_JHB_OUTLET_ID)[0]?.node?.available;

      const inventory_JHB_level_id = inventoryLevels?.filter(({ node: { location: { id } } }) => id.replace(
        "gid://shopify/Location/",
        "",
      ) === SHOPIFY_JHB_OUTLET_ID)[0]?.node?.id;

      const s_has_jhb_inventory = inventoryLevels?.filter(({ node: { location: { id } } }) => id.replace(
        "gid://shopify/Location/",
        "",
      ) === SHOPIFY_JHB_OUTLET_ID).length > 0;

      acc.push({
        vend_id: undefined,
        vend_unpublished: undefined,
        product_id: +s_gql_product_id?.replace("gid://shopify/Product/", "") || null,
        variant_id: +s_gql_variant_id?.replace("gid://shopify/ProductVariant/", "") || null,
        tags,
        description: descriptionHtml,
        price,
        sku,
        product_type: productType,
        inventory_item_id: +s_gql_inventory_item_id?.replace("gid://shopify/InventoryItem/", "") || null,
        inventory_CPT,
        s_inventory_CPT: inventory_CPT,
        inventory_CPT_level_id: inventory_CPT_level_id || null,
        inventory_JHB,
        s_inventory_JHB: inventory_JHB,
        inventory_JHB_level_id: inventory_JHB_level_id || null,
        inventory_quantity: inventoryQuantity,
        inventory_policy,
        option1: selectedOptions[0]?.value || null,
        option2: selectedOptions[1]?.value || null,
        option3: selectedOptions[2]?.value || null,
        image_id: +image?.id?.replace("gid://shopify/ProductImage/", "") || null,
        s_status: status.toLowerCase(),
        s_needs_variant_image,
        s_has_jhb_inventory,
      });

      return acc;
    }, []);
  }
});

type requestConfig = { api: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: any } | undefined;
type gqlConfig = { body: string } | undefined;

type getDifferenceReturn = {
  vendProducts: requestConfig[]
  shopifyProduct: requestConfig[]
  shopifyVariants: requestConfig[]
  shopifyNewVariants: gqlConfig[]
  shopifyConnectInventory: gqlConfig[]
  shopifyDisconnectInventory: requestConfig[]
};

type finalReturn = getDifferenceReturn & { shopifyDeleteVariants: requestConfig[] };

function createShopifyDeleteVariants(vend: productModel[], shopify: productModel[]) {
  return shopify.reduce((acc, targetVariant): requestConfig[] => {
    if (!vend.some(({ variant_id, sku }) => variant_id === targetVariant.variant_id || sku === targetVariant.sku)) {
      acc.push({
        api: `/products/${targetVariant.product_id}/variants/${targetVariant.variant_id}.json`,
        method: "DELETE",
      });
      acc.push({
        api: `products/${targetVariant.product_id}/images/${targetVariant.image_id}.json`,
        method: "DELETE",
      });
    }
    return acc;
  }, []);
}

export const getDifferences = (
  vend: productModel[],
  shopify: productModel[],
  shopify_update = false,
  vend_udpate = !shopify_update,
): finalReturn => {
  /* if there is an error with the product_id matching - return empty */
  if (!vend.every(({ product_id }) => shopify.every((s) => s.product_id === product_id))) {
    return {
      shopifyDeleteVariants: [],
      vendProducts: [],
      shopifyProduct: [],
      shopifyVariants: [],
      shopifyNewVariants: [],
      shopifyConnectInventory: [],
      shopifyDisconnectInventory: [],
    };
  }

  /* Create Delete Array */
  const shopifyDeleteVariants = createShopifyDeleteVariants(vend, shopify);

  /* Check if new Variants need to be created on Shopify & set it as default for variant image tag */
  const needs_new_variant_image = vend.some((s) => !shopify.some((t) => s.variant_id === t.variant_id));

  /* TODO Inventory Accuracy!
   * TODO: Active / Unpublished Statusses */

  return {
    shopifyDeleteVariants,
    ...vend.reduce((acc, vend_variant): getDifferenceReturn => {
      /** OPTION Deal with Vend only things
       * Found variant via id */
      const reason = [];
      let vendProductUpdate = false;

      if (vend_variant.v_inconsistent_description) {
        vendProductUpdate = true;
        reason.push("inconsistent description on Vend");
      }

      if (vend_variant.v_inconsistent_tags) {
        vendProductUpdate = true;
        reason.push("inconsistent tags on Vend");
      }

      if (vend_variant.v_incorrectly_unpublished) {
        vendProductUpdate = true;
        reason.push("inconsistent unpublished on Vend");
      }

      /** OPTION 2
       * Found variant via id */
      if (shopify.some(({ variant_id, sku }) => variant_id === vend_variant.variant_id || sku === vend_variant.sku)) {
        const sku_match = !shopify.some(({ variant_id }) => variant_id === vend_variant.variant_id);
        const shopify_variant = shopify.find(({ variant_id, sku }) => variant_id === vend_variant.variant_id || sku
          === vend_variant.sku);
        const override = { ...shopify_variant, ...vend_variant };
        let shopifyProductUpdate = false;
        let shopifyVariantUpdate = false;
        let shopifyInventoryLevelConnect = false;
        let shopifyInventoryLevelDisconnect = false;

        if (sku_match) {
          override.variant_id = shopify_variant.variant_id;
          vendProductUpdate = true;
        }

        if (override.v_has_needs_variant_image_tag && !override.s_needs_variant_image && !needs_new_variant_image) {
          override.tags = removeTag(override.tags, "FX_needs_variant_image");
          vendProductUpdate = true;
          shopifyProductUpdate = true;
          reason.push("remove FX_needs_variant_image");
        }

        if (!override.v_has_needs_variant_image_tag && (override.s_needs_variant_image || needs_new_variant_image)) {
          override.tags = addTag(override.tags, "FX_needs_variant_image");
          vendProductUpdate = true;
          shopifyProductUpdate = true;
          reason.push("add FX_needs_variant_image");
        }

        if (override.s_has_jhb_inventory && !override.v_has_sell_jhb_tag) {
          shopifyInventoryLevelDisconnect = true;
          reason.push("Disconnect inventory");
        }

        if (!override.s_has_jhb_inventory && override.v_has_sell_jhb_tag) {
          shopifyInventoryLevelConnect = true;
          reason.push("connect inventory");
        }

        if (!sku_match && vend_variant.sku !== shopify_variant.sku) {
          vendProductUpdate = true;
          shopifyVariantUpdate = true;
          reason.push("sku");
        }

        if (vend_variant.price !== shopify_variant.price) {
          vendProductUpdate = true;
          shopifyVariantUpdate = true;
          reason.push("price");
        }

        if (!isSameTags(vend_variant.tags, shopify_variant.tags)) {
          vendProductUpdate = shopify_update;
          shopifyProductUpdate = vend_udpate;
          if (shopify_update) {
            override.tags = shopify_variant.tags;
          }
          reason.push("tags");
        }

        if (!isSameDescription(vend_variant.description, shopify_variant.description)) {
          vendProductUpdate = shopify_update;
          shopifyProductUpdate = vend_udpate;
          if (shopify_update) {
            override.description = shopify_variant.description;
          }
          reason.push("description");
        }

        if (vend_variant.product_type !== shopify_variant.product_type
          && vend_variant.product_type !== "General"
          && shopify_variant.product_type !== "General") {
          vendProductUpdate = shopify_update;
          shopifyProductUpdate = vend_udpate;
          if (shopify_update) {
            override.product_type = shopify_variant.product_type;
          }
          reason.push(`product_type - ${vend_variant.product_type} !== ${shopify_variant.product_type}`);
        }

        if (vend_variant.inventory_CPT !== shopify_variant.inventory_CPT) {
          shopifyVariantUpdate = true;
          reason.push(`incorrect Inventory CPT- ${vend_variant.inventory_CPT} !== ${shopify_variant.inventory_CPT}`);
        }

        if (vend_variant.inventory_JHB !== shopify_variant.inventory_JHB && vend_variant.v_has_sell_jhb_tag) {
          shopifyVariantUpdate = true;
          reason.push(`incorrect Inventory JHB- ${vend_variant.inventory_JHB} !== ${shopify_variant.inventory_JHB}`);
        }

        reason.length > 0 && console.log(reason);

        if (vendProductUpdate) {
          acc.vendProducts.push({
            api: `/products`,
            method: `POST`,
            body: {
              id: override.vend_id,
              source_id: override.product_id,
              source_variant_id: override.variant_id,
              description: override.description,
              tags: override.tags,
              source: "SHOPIFY",
            },
          });
        }

        if (shopifyProductUpdate && acc.shopifyProduct.length === 0) {
          acc.shopifyProduct.push({
            api: `/products/${override.product_id}.json`,
            method: "PUT",
            body: {
              product: {
                id: override.product_id,
                tags: override.tags,
                body_html: override.description,
                product_type: override.product_type,
              },
            },
          });
        }

        if (shopifyVariantUpdate || shopifyInventoryLevelConnect || shopifyInventoryLevelDisconnect) {
          const shopifyConnectInventoryMutation = createGqlConnectInvLocationMutation(
            override.inventory_JHB,
            override.inventory_item_id,
            override.v_has_sell_jhb_tag,
            override.inventory_JHB_level_id,
          );
          console.log(override.v_has_sell_jhb_tag, shopifyInventoryLevelDisconnect, override.inventory_JHB_level_id);
          const shopifyDisonnectInventoryMutation = createGqlDisconnectInvLocationMutation(
            override.v_has_sell_jhb_tag,
            override.inventory_JHB_level_id,
          );

          const shopifyVariantMutation = createGqlUpdateVariantMutation(
            override.variant_id,
            override.sku,
            override.price,
            override.inventory_CPT,
            override.inventory_CPT_level_id,
            override.s_inventory_CPT,
            override.option1,
            override.option2,
            override.option3,
          );

          if (override.v_has_sell_jhb_tag && override.inventory_JHB_level_id) {
            acc.shopifyVariants.push({
              body: createGqlAdjustJHBInventoryQuantity(override.inventory_JHB,
                override.inventory_JHB_level_id, override.s_inventory_JHB),
            });
          }

          acc.shopifyVariants.push({
            body: `mutation {
              ${shopifyDisonnectInventoryMutation}
              ${shopifyConnectInventoryMutation}
              ${shopifyVariantMutation}
            }`,
          });
        }
      } else {
        /** OPTION 2
         * NO Variant found */

        acc.vendProducts.push({
          api: `/products`,
          method: `POST`,
          body: {
            id: vend_variant.vend_id,
            source_id: vend_variant.product_id,
            source_variant_id: vend_variant.variant_id,
            description: vend_variant.description,
            tags: vend_variant.v_has_needs_variant_image_tag ? vend_variant.tags : addTag(vend_variant.tags,
              "FX_needs_variant_image"),
            source: "SHOPIFY",
          },
        });

        acc.shopifyNewVariants.push({
          body: createGqlNewVariantMutation(vend_variant.product_id,
            vend_variant.sku,
            vend_variant.price,
            vend_variant.inventory_CPT,
            vend_variant.v_has_sell_jhb_tag ? vend_variant.inventory_JHB : undefined,
            vend_variant.option1,
            vend_variant.option2,
            vend_variant.option3),
        });
      }
      return acc;
    }, {
      vendProducts: [],
      shopifyProduct: [],
      shopifyVariants: [],
      shopifyNewVariants: [],
      shopifyConnectInventory: [],
      shopifyDisconnectInventory: [],
    }),
  };
};
