import { isSameTags, mergeDescriptions, mergeTags } from "../../utils";
import { isActive, isInactive, isPublished, isUnpublished, productModel } from "../../utils/products";
import { shopifyFetchProducts } from "./shopifyFetchProducts";
import { IVariant } from "./variant";
import { vendFetchProducts } from "./vendFetchProducts";

const { VEND_CPT_OUTLET_ID, VEND_JHB_OUTLET_ID, SHOPIFY_CPT_OUTLET_ID, SHOPIFY_JHB_OUTLET_ID } = process.env;

export interface IProduct {
  product_id: number
  name?: string
  description: string
  type?: string
  tags: string | null
  has_variants: boolean
  variants: IVariant[]
  s_featured_image_gql_id?: number
  s_status?: "active" | "draft" | "archived"
  vend_parent_id?: string
  v_all_active?: boolean /**/
  v_all_inactive?: boolean /**/
  v_all_published?: boolean /**/
  v_all_unpublished?: boolean /**/
  v_all_has_sell_jhb_tag?: boolean
  v_all_needs_variant_image_tag?:boolean

}

type IMakeProduct = (products: vendFetchProducts | shopifyFetchProducts | IProduct) => Readonly<IProduct>;

/* export const makeProduct: IMakeProduct = (products) => {
  /!* if vend data *!/
  if ("data" in products && "products" in products.data) {
    const variants = products.data.products;

    const product_id = variants;
    const description = variants.reduce((acc, { description: d }) => { return mergeDescriptions(acc, d); }, "");
    const tags = variants.reduce((acc, { tags }) => { return mergeTags(acc, tags); }, "");
    const has_variants = variants.length === 1 && variants[0].has_variants;
    const v_all_inactive = variants.every(isInactive);
    const v_all_active = variants.every(isActive);
    const v_all_published = variants.every(isPublished);
    const v_all_unpublished = variants.every(isUnpublished);
    const v_inconsistent_published = !v_all_published && !v_all_unpublished;
    const v_inconsistent_tags = !variants.every((v) => isSameTags(v.tags, tags));
    const v_has_sell_jhb_tag = tags.toLowerCase().includes("sell jhb");
    const v_has_needs_variant_image_tag = tags.toLowerCase().includes("fx_needs_variant_image");

    return variants.reduce((acc: productModel[], variant: productModel): productModel[] => {
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

      const inventory_CPT = +inventory.filter(({ outlet_id }) => outlet_id === VEND_CPT_OUTLET_ID)[0]?.count || 0;
      const inventory_JHB = +inventory.filter(({ outlet_id }) => outlet_id === VEND_JHB_OUTLET_ID)[0]?.count || 0;
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

  return Object.freeze({
    product_id: 0,
    name: "",
    description: "",
    type: "",
    tags: "",
    has_variants: true,
    variants: [
      {
        vend_id: "",
        variant_id: 0,
        option1: "",
        option2: "",
        option3: "",
        price: "",
        sku: "",
        inventory_total: 0,
        inventory_total_ignore_negatives: 0,
        inventory_CPT: 0,
        inventory_JHB: 0,
        inventory_policy: "continue",
        s_inventory_item_gql_id: "",
        s_inventoryCPT_level_gql_id: "",
        s_inventoryJHB_level_gql_id: "",
        s_image_gql_id: "",
        v_is_published: true,
        v_is_active: true,
      },
    ],
    s_featured_image_gql_id: 0,
    s_status: "active",
    v_all_active: true,
    v_all_inactive: true,
    v_all_published: true,
    v_all_unpublished: true,
    v_inconsistent_published: true,
    v_inconsistent_description: true,
    v_inconsistent_tags: true,
    v_has_sell_jhb_tag: true,
    v_has_needs_variant_image_tag: true,
    s_has_jhb_inventory: true,
  });
}; */
