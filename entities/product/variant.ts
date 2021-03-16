export interface IVariant {
  variant_id: number;
  vend_id?: string;
  price: string;
  sku: string;
  option1?: string;
  option2?: string;
  option3?: string;
  inventory_total: number;
  inventory_total_ignore_negatives: number;
  inventory_CPT: number;
  inventory_JHB: number;
  inventory_policy?: "continue" | "deny";
  s_inventory_item_gql_id?: string;
  s_inventoryCPT_level_gql_id?: string;
  s_inventoryJHB_level_gql_id?: string;
  s_image_gql_id?: string;
  s_has_jhb_inventory?: boolean;
  v_is_published?: boolean;
  v_is_active?: boolean;
  v_inconsistent_published?: boolean /**/;
  v_inconsistent_description?: boolean /**/;
  v_inconsistent_tags?: boolean;
  v_has_sell_jhb_tag?: boolean;
  v_has_needs_variant_image_tag?: boolean;
}

type IMakeVariant = () => Readonly<IVariant>;

export const makeVariant: IMakeVariant = () => {
  return Object.freeze({
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
  });
};
