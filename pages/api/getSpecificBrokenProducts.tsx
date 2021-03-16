import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

type ProductData = unknown[];

const productIds = [
  "02dcd191-ae62-11e6-edd8-e17944c70e9b",
  "02dcd191-ae62-11e6-f485-c5f02317eb1f",
  "02dcd191-ae62-11e6-f485-c5f02bb523d1",
  "02dcd191-ae62-11e7-edd8-147fe864a1f9",
  "25063cc5-6582-f119-71e9-175a6ef9dce2",
  "30f6b238-fba7-2cc5-8307-418f179c2ef8",
  "027e8bf1-484e-8a3a-f2df-0a11267ceb17",
  "0e43e970-379b-1948-d3c2-2ac7b58e380b",
  "64be4268-bfc7-3b5b-d924-7f96ba2eee75",
  "22168ec9-2dfd-7c74-42c1-656288933930",
  "3e2e58e8-f111-0182-736c-a0771b68d273",
  "2928a6f1-9d4d-01b7-5cf0-6ddc56790581",
  "3e09e895-b960-991a-4321-15075229b18c",
  "9475aafb-262a-d308-4d01-c4803a4eb49a",
  "02dcd191-ae62-11e7-edd8-19264e340193",
  "44964bf9-1ca9-3b4e-09d1-5a0fcde37bda",
  "9629af06-d3a6-4842-d36f-efbe3109e8a8",
  "b782bc47-a958-0f0d-f2fb-fb942372dfc1",
  "4aaca8b2-847d-15ee-1baa-3f72443a3fa3",
  "19610f95-4574-0289-adb9-bd56a608536c",
  "d4ffc2b4-4f39-29ee-da68-6997a9896798",
  "ed8cec24-6677-9714-e38c-804058422fc2",
  "f12378c8-dbfd-63d3-5f55-cd7a64bbf663",
  "ee91d699-40e2-d762-7bdb-aa87160839fc",
  "c63281ca-ee1b-d9d2-0a1d-e0bfa36809cf",
  "a9fd67b6-855b-6f76-0b93-14575daa9890",
  "c5489e14-2849-f555-bd06-3393dd7de102",
  "02dcd191-ae62-11e6-f485-4cbc597e5049",
  "3f7c0597-b9d8-0add-08cb-53d973703cb9",
];

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_PASSWORD,
  SHOPIFY_API_STORE,
  SHOPIFY_API_VERSION,
  VEND_RETAILER_ID,
  VEND_CPT_OUTLET_ID,
  SHOPIFY_CPT_OUTLET_ID,
} = process.env;

const getShopifyProductVariants = async (id: string): Promise<any> => {
  try {
    const response = await axios({
      method: "get",
      url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_API_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/products/${id}/variants.json?fields=id,sku,option1,option2,option3`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.data.variants;
  } catch ({ response }) {
    const { config } = response;
    return config;
  }
};

const addShopifyProductVariant = async (
  productId: string,
  price: number,
  option1: string,
  option2?: string,
  option3?: string
): Promise<any> => {
  try {
    const response = await axios({
      method: "POST",
      url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_API_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/products/${productId}/variants.json`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        variant: {
          price: price.toFixed(2),
          option1,
          option2,
          option3,
        },
      }),
    });

    return response.data.variant;
  } catch (err) {
    const { response } = err;
    const { config } = response;
    console.log(err);
    return config;
  }
};

const updateShopifyInventoryLevel = async (
  inventory_item_id: number,
  available_adjustment: number,
  location_id: number = +SHOPIFY_CPT_OUTLET_ID
): Promise<any> => {
  console.log(
    inventory_item_id,
    typeof inventory_item_id,
    available_adjustment,
    typeof available_adjustment,
    location_id,
    typeof location_id
  );
  try {
    const response = await axios({
      method: "POST",
      url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_API_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/inventory_levels/adjust.json`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        inventory_item_id: +inventory_item_id,
        location_id: +location_id,
        available_adjustment: +available_adjustment,
      }),
    });

    return response.data.variant;
  } catch (err) {
    const { response } = err;
    const { config } = response;
    console.log(response.data.errors);
    return config;
  }
};

const getVendSingleProduct = async (id: string): Promise<any> => {
  try {
    const response = await axios({
      method: "get",
      url: `https://kidsliving.vendhq.com/api/2.0/products/${id}`,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.VEND_API}`,
        "Content-Type": "application/json",
        Cookie: "rguserid=b2b95383-16dd-4132-a3d2-f53bdec946bb; rguuid=true; rgisanonymous=true",
      },
    });

    return response.data.data;
  } catch ({ response }) {
    const { config } = response;
    return config;
  }
};

const getVendSingleVariantInventory = async (variantId: string): Promise<any> => {
  try {
    const response = await axios({
      method: "get",
      url: `https://kidsliving.vendhq.com/api/2.0/products/${variantId}/inventory`,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.VEND_API}`,
        "Content-Type": "application/json",
        Cookie: "rguserid=b2b95383-16dd-4132-a3d2-f53bdec946bb; rguuid=true; rgisanonymous=true",
      },
    });

    const inventory_level = response.data.data.reduce((acc, { outlet_id, inventory_level }) => {
      return acc + (outlet_id === VEND_CPT_OUTLET_ID ? +inventory_level : 0);
    }, 0);

    return inventory_level;
  } catch ({ response }) {
    const { config } = response;
    return config;
  }
};

const updateVendVariantSourceId = async (id: string, source_variant_id): Promise<any> => {
  try {
    const response = await axios({
      method: "post",
      url: `https://kidsliving.vendhq.com/api/products`,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.VEND_API}`,
        "Content-Type": "application/json",
        Cookie: "rguserid=b2b95383-16dd-4132-a3d2-f53bdec946bb; rguuid=true; rgisanonymous=true",
      },
      data: JSON.stringify({
        id,
        source_variant_id,
        source: "SHOPIFY",
      }),
    });

    return response.data.data;
  } catch ({ response }) {
    const { config } = response;
    return config;
  }
};

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const products: ProductData = [];

  try {
    let shopifyVariants = [];

    for (let i = 0; i < productIds.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      const vendProduct = await getVendSingleProduct(productIds[i]);
      const { source_id, source_variant_id, sku, variant_options, price_including_tax } = vendProduct;

      if (shopifyVariants.length === 0) {
        shopifyVariants = await getShopifyProductVariants(source_id);
      }

      products.push({
        shopify: shopifyVariants.filter(v => v.sku === sku).length > 0 ? "onShopify" : "",
        ...vendProduct,
      });

      console.log(i);
    }
  } catch (err) {
    console.log(err.response.data);
  }

  res.status(200).json(products);
};
