import axios, { AxiosPromise } from "axios";
import { loadFirebase } from "lib/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { retailer_id } = req.body;
  const { id, variant_parent_id, handle, source, source_id, ...payload } = JSON.parse(req.body.payload);
  
  let firebase = await loadFirebase();
  let db = firebase.firestore();
  let duplicate = false;
  if (retailer_id === process.env.VEND_RETAILER_ID) {
    try {
      await db.collection("product_update").doc(!!variant_parent_id ? variant_parent_id : id).get().then((doc) => {
        if (doc.exists && doc.data().expire_at > Date.now()) {
          duplicate = true;
        }
      });
      duplicate || await db.collection("product_update")
                           .doc(!!variant_parent_id ? variant_parent_id : id)
                           .set({ expire_at: Date.now() + 20000 });
    } catch (err) {
      console.log(err);
      res.status(500).json("Error no DB connection");
      return;
    }
    
    if (!duplicate && source === "SHOPIFY") {
      try {
        const [{ data: { products: vend } }, { data: { variants: shopify } }] = await Promise.all([
          getVendProductByHandle(handle),
          getShopifyProductVariants(source_id)
        ]);
        console.log(vend[0], "vend");
        console.log(shopify[0], "shopify");
        
        if (+vend[0].source_id !== shopify[0].product_id) {
          res.status(500).json("Vend & Shopify Ids do not Match");
          return;
        }
        
        const removeVariantsFromShopify = createShopifyRemoveArr(shopify, vend);
        const addVariantsToShopify = createShopifyAddArr(shopify, vend);
        const hasImageTag = vend.some(({ tags }) => tags.includes("FX_needs_variant_image"));
        const needsImageTag = addVariantsToShopify.length > 0 || !(
          shopify.filter(({ id }) => !removeVariantsFromShopify.some(({ variant_id }) => id === variant_id))
                 .every(({ image_id }) => !!image_id)
        );
        const addImageTag = !hasImageTag && needsImageTag;
        const removeImageTag = hasImageTag && !needsImageTag;
        const updateVariantsOnShopify = createShopifyUpdateArr(shopify, vend);
        
        console.log(updateVariantsOnShopify, "updateVariantsOnShopify");
        console.log(addVariantsToShopify, "addVariantsToShopify");
        console.log(removeVariantsFromShopify, "removeVariantsFromShopify");
        /*
        *  if vend.var.id not found in shopify.variants => shopify.create.variant => then vend.add link to created variant id && vend.add tag for no image
        *  if shopify.var.id not found in vend.variants => shopify.delete variant image (if any) && shopify delete variant
        *  if any shopify.var has no image => vend.add tag for no image
        *  if all shopify.var have images && vend.has tag for no image => vend.remove tag for no image
        *
        * */
        const shopifyDeletePromiseArr = [];
        removeVariantsFromShopify.forEach(({ product_id, variant_id, image_id }) => {
          !!image_id && shopifyDeletePromiseArr.push(deleteShopifyProductImage(product_id, image_id));
          shopifyDeletePromiseArr.push(deleteShopifyProductVariant(product_id, variant_id));
        });
        shopifyDeletePromiseArr.length > 0 && await Promise.all(shopifyDeletePromiseArr);
        
        const shopifyAddPromiseArr = [];
        addVariantsToShopify.forEach(({ product_id, sku, price, option1, option2, option3 }) => {
          shopifyAddPromiseArr.push(createShopifyProductVariant(product_id, sku, price, option1, option2, option3));
        });
        const newProductsOnShopify = shopifyAddPromiseArr.length > 0 ? await Promise.all(shopifyAddPromiseArr) : [];
        
        const shopifyUpdatePromiseArr = [];
        updateVariantsOnShopify.forEach(({ variant_id, sku, price, option1, option2, option3 }) => {
          shopifyUpdatePromiseArr.push(updateShopifyProductVariant(variant_id, sku, price, option1, option2, option3));
        });
        shopifyUpdatePromiseArr.length > 0 && await Promise.all(shopifyUpdatePromiseArr);
        
        /*
        *
        *
        *
        * */
        const vendShopifyUpdatePromiseArr = [];
        let tags = vend[0].tags.split(",").map(t => t.trim());
        if (addImageTag) {
          tags.push("FX_needs_variant_image");
          tags = tags.join(", ");
          vend.filter(({ id }) => !addVariantsToShopify.some(({ id: updateId }) => updateId === id)).forEach(({ id }) => {
            vendShopifyUpdatePromiseArr.push(updateVendProductVariant(id, tags));
          });
        } else if (removeImageTag) {
          tags = tags.filter(t => t !== `FX_needs_variant_image`);
          tags = tags.join(", ");
          vend.filter(({ id }) => !addVariantsToShopify.some(({ id: updateId }) => updateId === id)).forEach(({ id }) => {
            vendShopifyUpdatePromiseArr.push(updateVendProductVariant(id, tags));
          });
        }
        
        newProductsOnShopify.forEach(({ data: { variant: { id: shopifyVariantId, sku, inventory_item_id } } }) => {
          const { id, inventory } = addVariantsToShopify.find(({ sku: vendSku }) => sku === vendSku);
          vendShopifyUpdatePromiseArr.push(updateVendProductVariant(id, tags, shopifyVariantId));
          if (inventory !== 0) {
            vendShopifyUpdatePromiseArr.push(updateShopifyInventoryItem(inventory_item_id, inventory));
          }
        });
        
        vendShopifyUpdatePromiseArr.length > 0 && await Promise.all(vendShopifyUpdatePromiseArr);
        
        res.status(200).json("success");
      } catch (err) {
        console.log(err.response);
        res.status(500).json("error");
      }
    } else {
      res.status(200).json(duplicate ? "Already processing" : "No change needed - Not on Shopify");
    }
  } else {
    res.status(401).json("error");
  }
}

type createShopifyRemoveArrObject = {
  product_id: number,
  variant_id: number,
  image_id: number
}

function createShopifyRemoveArr(shopify, vend): createShopifyRemoveArrObject[] {
  return shopify.reduce((acc, { id, product_id, image_id }) => {
    if (vend.every(({ variant_source_id }) => +id !== +variant_source_id)) { // if not in Vend Variants List
      acc.push({ product_id, variant_id: id, image_id });
    }
    return acc;
  }, []);
}

type createShopifyAddArrObject = {
  id: string,
  product_id: number,
  sku: string,
  price: string,
  inventory: number,
  option1?: string,
  option2?: string,
  option3?: string,
}

function createShopifyAddArr(shopify, vend): createShopifyAddArrObject[] {
  return vend.reduce((
    acc,
    {
      id,
      source_id,
      sku: vend_sku,
      variant_source_id,
      price,
      tax,
      inventory,
      deleted_at,
      sku,
      variant_option_one_value,
      variant_option_two_value,
      variant_option_three_value
    }
  ) => {
    if (deleted_at !== "") return acc;
    if (variant_source_id === "" || shopify.every(({ id }) => +id !== +variant_source_id)) { // if not in shopify Variants List
      acc.push({
        id,
        product_id: +source_id,
        sku,
        price: (
          price + tax
        ).toFixed(2),
        inventory: inventory.reduce((acc, { outlet_id, count }) => {
          if (outlet_id === process.env.VEND_CPT_OUTLET_ID) {
            acc += +count;
          }
          return acc;
        }, 0),
        option1: variant_option_one_value !== "" ? variant_option_one_value : undefined,
        option2: variant_option_two_value !== "" ? variant_option_two_value : undefined,
        option3: variant_option_three_value !== "" ? variant_option_three_value : undefined
      });
    }
    return acc;
  }, []);
}

type createShopifyUpdateArrObject = {
  variant_id: number
  sku: string,
  price: string,
  option1?: string,
  option2?: string,
  option3?: string,
}

function createShopifyUpdateArr(shopify, vend): createShopifyUpdateArrObject[] {
  return vend.reduce((
    acc,
    {
      source_id,
      variant_source_id: var_id,
      sku: vend_sku,
      price,
      tax,
      inventory,
      deleted_at,
      sku,
      variant_option_one_value: opt1,
      variant_option_two_value: opt2,
      variant_option_three_value: opt3
    }
  ) => {
    if (deleted_at !== "") return acc;
    
    if (var_id !== "" && shopify.some(({ id }) => +id === +var_id)) {
      const { sku: shopifySku, option1, option2, option3, price: shopifyPrice } = shopify.find(({ id }) => +id === +var_id);
      
      if (
        shopifySku !== sku
        || (!!opt1 && !!option1 && opt1 !== option1)
        || (!!opt2 && !!option2 && opt2 !== option2)
        || (!!opt3 && !!option3 && opt3 !== option3)
        || shopifyPrice !== (price + tax).toFixed(2)
      ) {
        
        acc.push({
          variant_id: +var_id,
          sku,
          price: (price + tax).toFixed(2),
          option1: opt1 !== "" ? opt1 : undefined,
          option2: opt2 !== "" ? opt2 : undefined,
          option3: opt3 !== "" ? opt3 : undefined
        });
      }
    }
    
    return acc;
  }, []);
}

function createVendUpdateArr(vend, addImageTag: boolean, removeImageTag: boolean) {

}

function getVendProductByHandle(handle: string): AxiosPromise {
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

function getShopifyProductVariants(product_id: string): AxiosPromise {
  return axios({
    method: "get",
    url: `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_API_PASSWORD}@${process.env.SHOPIFY_API_STORE}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/products/${product_id}/variants.json?fields=id,product_id,sku,option1,option2,option3,image_id,inventory_item_id,inventory_quantity,inventory_policy,price`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
}

function deleteShopifyProductImage(product_id: number, image_id: number): AxiosPromise {
  return axios({
    method: "DELETE",
    url: `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_API_PASSWORD}@${process.env.SHOPIFY_API_STORE}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/products/${product_id}/images/${image_id}.json`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
}

function deleteShopifyProductVariant(product_id: number, variant_id: number): AxiosPromise {
  return axios({
    method: "DELETE",
    url: `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_API_PASSWORD}@${process.env.SHOPIFY_API_STORE}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/products/${product_id}/variants/${variant_id}.json`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
}

interface createShopifyProductVariantProps {
  (product_id: number, sku: string, price: string, option1?: string, option2?: string, option3?: string): AxiosPromise
}

const createShopifyProductVariant: createShopifyProductVariantProps = (product_id, sku, price, option1, option2, option3) => {
  return axios({
    method: "POST",
    url: `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_API_PASSWORD}@${process.env.SHOPIFY_API_STORE}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/products/${product_id}/variants.json`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    data: JSON.stringify({
      variant: {
        sku,
        price,
        option1,
        option2,
        option3
      }
    })
  });
};

interface updateShopifyProductVariantProps {
  (variant_id: number, sku: string, price: string, option1?: string, option2?: string, option3?: string): AxiosPromise
}

const updateShopifyProductVariant: updateShopifyProductVariantProps = (variant_id, sku, price, option1, option2, option3) => {
  return axios({
    method: "PUT",
    url: `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_API_PASSWORD}@${process.env.SHOPIFY_API_STORE}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/variants/${variant_id}.json`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    data: JSON.stringify({
      variant: {
        id: variant_id,
        sku,
        price,
        option1,
        option2,
        option3
      }
    })
  });
};

function updateVendProductVariant(id: string, tags?: string, source_variant_id?: string): AxiosPromise {
  return axios({
    method: "post",
    url: `https://kidsliving.vendhq.com/api/products`,
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${process.env.VEND_API}`,
      "Content-Type": "application/json",
      "Cookie": "rguserid=b2b95383-16dd-4132-a3d2-f53bdec946bb; rguuid=true; rgisanonymous=true"
    },
    data: JSON.stringify({
      id,
      source_variant_id,
      "source": "SHOPIFY",
      tags
    })
  });
}

function updateShopifyInventoryItem(inventory_item_id: number, available_adjustment: number) {
  return axios({
    method: "POST",
    url: `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_API_PASSWORD}@${process.env.SHOPIFY_API_STORE}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/inventory_levels/adjust.json`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    data: JSON.stringify({
      inventory_item_id,
      available_adjustment,
      location_id: +process.env.SHOPIFY_CPT_OUTLET_ID
    })
  });
}