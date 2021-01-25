import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { retailer_id } = req.body;
  const { handle, source, source_id, ...payload } = JSON.parse(req.body.payload);
  /*console.log(payload)*/
  if (retailer_id === process.env.VEND_RETAILER_ID && source === `SHOPIFY`) {
    try {
      const [{ data: { products: vend } }, { data: { variants: shopify } }] = await Promise.all([
        getVendProductByHandle(handle),
        getShopifyProductVariants(source_id)
      ]);
      console.log(vend[0], shopify[0]);
      /*
      *  if vend.var.id not found in shopify.variants => shopify.create.variant => then vend.add link to created variant id && vend.add tag for no image
      *  if shopify.var.id not found in vend.variants => shopify.delete variant image (if any) && shopify delete variant
      *  if any shopify.var has no image => vend.add tag for no image
      *  if all shopify.var have images && vend.has tag for no image => vend.remove tag for no image
      *
      * */
      const hasImageTag = vend.some(({ tags }) => tags.includes("tl_variant_image_required"));
      let needsImageTag = !shopify.every(({ image_id }) => !!image_id);
      let removeImageTag = hasImageTag && !needsImageTag;
      
      const addVariantsToShopify = vend.reduce((acc, { id,  sku: vend_sku, variant_source_id, price, inventory }) => {
        if (variant_source_id === "" || !(shopify.some(({ sku: shopify_sku }) => shopify_sku === vend_sku))) { // if not in shopify Variants List
          needsImageTag = true;
          removeImageTag = false;
          acc.push({
            id,
            price,
            inventory: inventory.reduce((acc, {outlet_id, count}) => {
              if (outlet_id === process.env.VEND_CPT_OUTLET_ID) {
                  acc += count
              }
              return acc;
            }, 0)});
        }
        return acc;
      }, []);
      
      const removeVariantsFromShopify = shopify.reduce((acc, { id, sku: shopify_sku }) => {
        if (!(vend.some(({ sku: vend_sku }) => shopify_sku === vend_sku))) { // if not in Vend Variants List
          acc.push(id);
        }
        return acc;
      }, []);
      
      console.log(addVariantsToShopify, removeVariantsFromShopify);
      
      res.status(200).json("success");
    } catch (err) {
      console.log(err.response);
    }
  } else {
    res.status(401).json("error");
  }
}

function getVendProductByHandle(handle: string) {
  return axios({
    method: "get",
    url: `https://kidsliving.vendhq.com/api/products?handle=${handle}`,
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${process.env.VEND_API}`,
      "Content-Type": "application/json",
      "Cookie": "rguserid=b2b95383-16dd-4132-a3d2-f53bdec946bb; rguuid=true; rgisanonymous=true"
    }
  });
}

function getShopifyProductVariants(product_id: string) {
  return axios({
    method: "get",
    url: `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_API_PASSWORD}@${process.env.SHOPIFY_API_STORE}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/products/${product_id}/variants.json?fields=id,sku,option1,option2,option3,image_id,inventory_item_id,inventory_quantity,inventory_policy`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
}