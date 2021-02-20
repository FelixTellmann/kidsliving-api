import { IVariant } from "./variant";

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
  v_all_active?: boolean
  v_all_inactive?: boolean
  v_all_published?: boolean
  v_all_unpublished?: boolean
  v_inconsistent_published?: boolean
  v_inconsistent_description?: boolean
  v_inconsistent_tags?: boolean
  v_has_sell_jhb_tag?: boolean
  v_has_needs_variant_image_tag?: boolean
  s_has_jhb_inventory?: boolean
}

type IMakeProduct = () => Readonly<IProduct>;

export const makeProduct: IMakeProduct = () => {
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
};

export default makeProduct;
