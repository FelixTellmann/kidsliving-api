import { isSameTags, mergeDescriptions, mergeTags } from "./index";

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

export const getDifferences = (
  source: productModel[],
  target: productModel[],
): { updates: productModel[], newVariants: productModel[] } => {
  return source.reduce((acc, sourceVariant): { updates: productModel[], newVariants: productModel[] } => {
    /** OPTION 1
     * Found variant via id */
    if (target.some(({ variant_id }) => variant_id === sourceVariant.variant_id)) {
      const targetVariant = target.find(({ variant_id }) => variant_id === sourceVariant.variant_id);
      let update = false;

      console.log(JSON.stringify(targetVariant.description), JSON.stringify(sourceVariant.description));

      targetVariant.sku !== sourceVariant.sku && (update = true);
      targetVariant.tags !== sourceVariant.tags && (update = true);
      targetVariant.description !== sourceVariant.description && (update = true);
      targetVariant.product_type !== sourceVariant.product_type && (update = true);

      update && acc.updates.push({ ...targetVariant, ...sourceVariant });
      /** OPTION 2
       * Found variant via id */
    } else {
      acc.newVariants.push({ ...sourceVariant });
    }
    return acc;
  }, { updates: [], newVariants: [] });
};
