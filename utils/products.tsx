import { isSameDescription, isSameTags, mergeDescriptions, mergeTags } from "./index";

const { VEND_CPT_OUTLET_ID, VEND_JHB_OUTLET_ID } = process.env;

export type productModel = {
  [key: string]: any
  vend_id?: string,
  vend_unpublished?: boolean
  status: "active" | "draft" | "archived"
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
  inventory_JHB?: number
  inventory_quantity?: number
  inventory_policy?: "continue" | "deny",
  image_id?: number
  v_inactive?: boolean
  v_all_unpublished?: boolean
  v_incorrectly_unpublished?: boolean
  v_description?: string
  v_inconsistent_description?: boolean
  v_tags?: string
  v_inconsistent_tags?: boolean
  v_has_sell_jhb_tag?: boolean
  v_has_needs_variant_image_tag?: boolean
  v_single_product?: boolean
};

export const isUnpublished = (({ source_id, variant_source_id }: any): boolean => {
  return source_id.includes("unpub") || variant_source_id.includes("unpub");
});

export const isInactive = (({ active }: any): boolean => !active);

export const hasVariantImage = (({ image_id }: productModel): boolean => !!image_id);

export const simplifyProducts = ((products: any, source: "vend" | "shopify"): productModel[] => {
  if (source === "vend") {
    const v_inactive = products.every(isInactive);
    const v_all_unpublished = products.every(isUnpublished);
    const v_incorrectly_unpublished = !v_all_unpublished && products.some(isUnpublished);
    const v_description = products.reduce((acc, { description: d }) => { return mergeDescriptions(acc, d); }, "");
    const v_inconsistent_description = !products.every(({ description }) => description === v_description);
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
        variant_option_two_value,
        variant_option_three_value,
        inventory,
      } = variant;

      const inventory_CPT = +inventory.filter(({ outlet_id }) => outlet_id === VEND_CPT_OUTLET_ID)[0]?.count || 0;
      const inventory_JHB = +inventory.filter(({ outlet_id }) => outlet_id === VEND_JHB_OUTLET_ID)[0]?.count || 0;
      const v_unpublished = source_id.includes("unpub") || variant_source_id.includes("unpub");

      acc.push({
        vend_id: id,
        status: active ? "active" : "draft",
        v_unpublished,
        product_id: +source_id.replace(/_unpub/gi, ""),
        variant_id: +variant_source_id.replace(/_unpub/gi, ""),
        tags: v_tags,
        description: v_description,
        price: (+price + +tax).toFixed(2),
        sku,
        product_type: type,
        option1: variant_option_one_value || null,
        option2: variant_option_two_value || null,
        option3: variant_option_three_value || null,
        inventory_item_id: undefined,
        inventory_CPT,
        inventory_JHB,
        inventory_quantity: inventory_CPT + inventory_JHB,
        inventory_policy: undefined,
        image_id: undefined,
        v_inactive,
        v_all_unpublished,
        v_incorrectly_unpublished,
        v_inconsistent_description,
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
        status,
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
        s_needs_variant_image,
      });

      return acc;
    }, []);
  }
});

type getDifferenceReturn = {
  vendProducts: { api: string, method: string, body?: any }[],
  shopifyProduct: { api: string, method: string, body?: any },
  shopifyVariants: { api: string, method: string, body?: any }[],
  shopifyNewVariants: { api: string, method: string, body?: any }[],
};

export const getDifferences = (source: productModel[], target: productModel[]): getDifferenceReturn => {
  return source.reduce((acc, sourceVariant): getDifferenceReturn => {
    /** OPTION 1
       * Found variant via id */
    if (target.some(({ variant_id }) => variant_id === sourceVariant.variant_id)) {
      const targetVariant = target.find(({ variant_id }) => variant_id === sourceVariant.variant_id);
      let vendUpdate = false;
      let shopifyProductUpdate = false;
      let shopifyVariantUpdate = false;

      if (sourceVariant.sku !== targetVariant.sku) {
        vendUpdate = true;
        shopifyProductUpdate = true;
        shopifyVariantUpdate = true;
      }

      if (!isSameTags(sourceVariant.tags, targetVariant.tags)) {
        vendUpdate = true;
        shopifyProductUpdate = true;
      }

      /* if (!isSameDescription(sourceVariant.description, targetVariant.description)) {
        vendUpdate = true;
        shopifyProductUpdate = true;
      } */

      if (sourceVariant.product_type !== targetVariant.product_type) {
        vendUpdate = true;
        shopifyProductUpdate = true;
      }

      const override = { ...targetVariant, ...sourceVariant };

      if (vendUpdate) {
        acc.vendProducts.push({
          api: `/products`,
          method: `POST`,
          body: {
            id: override.vend_id,
            source_id: override.source_id,
            source_variant_id: override.variant_id,
            tags: override.tags,
            source: "SHOPIFY",
          },
        });
      }

      if (shopifyProductUpdate && acc.shopifyProduct === undefined) {
        acc.shopifyProduct = {
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
        };
      }

      if (shopifyVariantUpdate) {
        acc.shopifyProduct.push({
          api: `/variants/${override.variant_id}.json`,
          method: "PUT",
          body: {
            variant: {
              id: override.variant_id,
              sku: override.sku,
              price: override.price,
              option1: override.option1,
              option2: override.option2,
              option3: override.option3,
            },
          },
        });
      }

      /** OPTION 2
         * NO Variant found */
    } else {
      acc.shopifyNewVariants.push({
        api: `/products/${sourceVariant.product_id}/variants.json`,
        method: "POST",
        body: {
          variant: {
            id: sourceVariant.variant_id,
            sku: sourceVariant.sku,
            price: sourceVariant.price,
            option1: sourceVariant.option1,
            option2: sourceVariant.option2,
            option3: sourceVariant.option3,
          },
        },
      });
    }
    return acc;
  },
  {
    vendProducts: [],
    shopifyProduct: undefined,
    shopifyVariants: [],
    shopifyNewVariants: [],
  });
};
