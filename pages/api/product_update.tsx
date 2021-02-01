import axios, { AxiosPromise } from "axios";
import { loadFirebase } from "lib/db";
import { NextApiRequest, NextApiResponse } from "next";

function addTag(string, tag): string {
  return string.split(",").map(t => t.trim()).concat(tag).join(", ");
}

function removeTag(string, tag): string {
  return string.split(",").map(t => t.trim()).filter(ftag => ftag != tag).join(", ");
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
      variant_source_id: var_id,
      price,
      tax,
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

function getShopifyProductById(product_id: string): AxiosPromise {
  return axios({
    method: "get",
    url: `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_API_PASSWORD}@${process.env.SHOPIFY_API_STORE}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/products/${product_id}.json?fields=images,variants,tags`,
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

const updateShopifyProductTags = (id: number, tags: string): AxiosPromise => {
  return axios({
    method: "PUT",
    url: `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_API_PASSWORD}@${process.env.SHOPIFY_API_STORE}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/products/${id}.json`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    data: JSON.stringify({
      product: {
        id,
        tags
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

function isSameArray(a, b): boolean {
  const cleanSortArray = (z) => JSON.stringify(z.map(x => x.trim().toLowerCase()).sort((x, y) => {
    if (x < y) { return -1; }
    if (x > y) { return 1; }
    return 0;
  }));
  
  return cleanSortArray(a) === cleanSortArray(b);
}

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  
  /**
   * What if? Product gets Published to Shopify for the first time - should not have source_id and skip by default - if source_id exists its also sorted
   * TODO: What if? Product gets unPublished from Shopify. ---> Draft product & Remove from other Channels!
   * TODO: What if? Products auto publish to all channels?
   * TODO: What if? Product is not Active - Vend - Shopify ?
   * */
  const bulkRequest = req.headers["x-custom-bulk-request"] === process.env.CUSTOM_BULK_REQUEST &&
    req.headers["x-custom-bulk-request"] !== "" && !!req.headers["x-custom-bulk-request"];
  const vendWebhook = req.body.retailer_id === process.env.VEND_RETAILER_ID;
  const shopifyWebhook = req.headers[`x-shopify-shop-domain`] === process.env.SHOPIFY_DOMAIN;
  const { handle: vendHandle, source_id: vendId, source } = vendWebhook && JSON.parse(req.body.payload);
  const { id: shopifyId, handle: shopifyHandle } = shopifyWebhook && req.body;
  const { source_id: bulkId, handle: bulkHandle } = bulkRequest && req.body;
  const handle = String(vendHandle || shopifyHandle || bulkHandle);
  const source_id = String(vendId || shopifyId || bulkId);
  
  if (vendWebhook) console.log("vendWebhook", handle, source_id);
  if (shopifyWebhook) console.log("shopifyWebhook", handle, source_id);
  if (bulkRequest) console.log("bulkRequest", handle, source_id);
  
  let firebase = await loadFirebase();
  let db = firebase.firestore();
  let duplicate = false;
  
  /**
   * validate request is from server && that source_id exists => Product is on Shopify
   * */
  console.log(source_id, typeof source_id)
  if ((vendWebhook || shopifyWebhook || bulkRequest) && !!source_id && source_id !== '' && !!handle) {
    
    /**
     * Validate
     * Save in DB/CheckDB
     * Check if the same ID has recently been updated
     *    if not - save ID in DB with timestamp + 20 seconds
     *    if not - Continue with script
     *      else - Break script & return status 200
     * */
    try {
      await db.collection("product_update").doc(source_id).get().then((doc) => {
        if (doc.exists && doc.data().created_at > Date.now() - 2 * 60 * 1000) { // 60 seconds ago
          duplicate = true;
          console.log("id: " + source_id + " - Already processing - Please wait until:" +
            new Date(doc.data().created_at + 60 * 1000)
              .toISOString()
              .split(".")[0]
              .split("T")
              .join(" ")
              .replace(/-/gi, "/"));
        }
      });
      if (!duplicate) {
        await db.collection("product_update")
                .doc(source_id)
                .set({
                  created_at: Date.now(),
                  created_at_ISO: new Date(Date.now()).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
                  handle,
                  source_id,
                  source: vendWebhook ? "vend" : bulkRequest ? "bulkRequest" : "shopify"
                });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json("Error no DB connection");
      return;
    }
    
    /**
     * Validate
     * Check if the product is not already being edited by a concurrent request
     * */
    if (!duplicate) {
      try {
        
        /**
         * Step 1
         * Get product Data from Shopify & Vend - Better than relying on Update
         * Vend: via "handle" & Bulk Request
         * Shopify: via "product_id"
         **/
        const sourceData = await Promise.all([
          getVendProductByHandle(handle),
          getShopifyProductById(source_id)
        ].map(p => p.catch(e => e)));
        
        if (!(sourceData[0] instanceof Error)) {
          const isUnpublishd = source_id.includes("unpub") || source === "USER"
          const isOnShopify = !(sourceData[1] instanceof Error)
          let vend = []
          let images = []
          let shopify = []
          let shopifyTags = ''
          
          if (isOnShopify && !isUnpublishd) {
            [{ data: { products: vend } }, { data: { product: { images, variants: shopify, tags: shopifyTags } } }] = sourceData;
          } else {
            [{ data: { products: vend } }] = sourceData;
          }
          
          const isSingleProduct = vend.length === 1 && !vend[0].has_variants && vend[0].variant_parent_id === "";
          let tagString = "";
          
          if (vendWebhook || bulkRequest || isUnpublishd) {
            tagString = vend[0].tags;
          } else if (shopifyWebhook) {
            tagString = shopifyTags;
          }
          
          process.env.NODE_ENV === "development" && !bulkRequest && console.log(vend[0], vend.length, "vend");
          process.env.NODE_ENV === "development" && !bulkRequest && isOnShopify && console.log(shopify[0], shopify.length, "shopify");
          process.env.NODE_ENV === "development" && !bulkRequest && console.log(isSingleProduct, "isSingleProduct");
          
          /**
           * Validate
           * Check that handle & shopify_id are a match - better for performance to check afterwards
           * */
          if (isOnShopify && !isUnpublishd && +vend[0].source_id !== shopify[0].product_id) {
            res.status(200).json("Vend & Shopify Ids do not Match");
            return;
          }
          
          const removeVariantsFromShopify = createShopifyRemoveArr(shopify, vend)
          const shopifyWithoutRemovals = shopify.filter(({ id }) => {
            return !removeVariantsFromShopify.some(({ variant_id }) => id === variant_id);
          });
          const addVariantsToShopify = createShopifyAddArr(shopify, vend);
          let vendWithoutAddons = vend;
          const updateVariantsOnShopify = createShopifyUpdateArr(shopify, vend);
          console.log(updateVariantsOnShopify, `updateVariantsOnShopify`);
          
          /**
           * Step 2
           * Add variants to Shopify && save data in new Products Array - req for inventory & variant_id update later on
           * */
          let newProductsOnShopify = [];
          if ((vendWebhook || shopifyWebhook) && !isUnpublishd) {
            const shopifyAddPromiseArr = [];
            addVariantsToShopify.forEach(({ product_id, sku, price, option1, option2, option3 }) => {
              shopifyAddPromiseArr.push(createShopifyProductVariant(product_id, sku, price, option1, option2, option3));
            });
            newProductsOnShopify = shopifyAddPromiseArr.length > 0
                                   ? (await Promise.all(shopifyAddPromiseArr.map(p => p.catch(e => e)))).filter(result => !(result instanceof
                Error))
                                   : [];
            vendWithoutAddons = vend.filter(({ id }) => !addVariantsToShopify.some(({ id: updateId }) => updateId === id));
          }
          
          /**
           * Step 3
           * Create Array for Vend & Shopify Final Updates - to be filled with Promises
           * */
          const vendShopifyUpdatePromiseArr = [];
          
          /**
           * Check if Image Tag Exists & if it is needed
           * Add
           * */
          if (vendWebhook || shopifyWebhook || bulkRequest) {
            const needsImageTag = images.length === 0
              || (addVariantsToShopify.length > 0 && !bulkRequest)
              || (!shopifyWithoutRemovals.every(({ image_id }) => !!image_id) && !isSingleProduct);
            
            const someWithImageTag = vend.some(({ tags }) => tags.includes("FX_needs_variant_image"));
            const hasImageTag = vend.every(({ tags }) => tags.includes("FX_needs_variant_image"));
            const addImageTag = !hasImageTag && needsImageTag;
            const removeImageTag = (hasImageTag || someWithImageTag) && !needsImageTag;
            
            const someWithUnpublishTag = vend.some(({ tags }) => tags.includes("FX_unpublished_vend_to_shopify"));
            const hasUnpublishTag = vend.every(({ tags }) => tags.includes("FX_unpublished_vend_to_shopify"));
            const addUnpublishTag = !hasUnpublishTag && isUnpublishd;
            const removeUnpublishTag = (hasUnpublishTag || someWithUnpublishTag) && !isUnpublishd;
            
            let updateTags = !isUnpublishd && isOnShopify && !isSameArray(vend[0].tags.split(","), shopifyTags.split(","));
            
            if (addImageTag) {
              tagString = addTag(tagString, "FX_needs_variant_image");
              updateTags = true;
            } else if (removeImageTag) {
              tagString = removeTag(tagString, "FX_needs_variant_image");
              updateTags = true;
            }
            
            if (addUnpublishTag) {
              tagString = addTag(tagString, "FX_unpublished_vend_to_shopify");
              updateTags = true;
            } else if (removeUnpublishTag) {
              tagString = removeTag(tagString, "FX_unpublished_vend_to_shopify");
              updateTags = true;
            }
            
            if (updateTags) {
              console.log(updateTags, "updateTags");
              
              vendWithoutAddons.forEach(({ id }) => {
                vendShopifyUpdatePromiseArr.push(updateVendProductVariant(id, tagString));
              });
              if (isOnShopify) {
                vendShopifyUpdatePromiseArr.push(updateShopifyProductTags(+source_id, tagString));
              }
            }
          }
          
          /**
           * Delete Unlinked unwanted products from Shopify
           * Safe delete associated Images on Shopify
           * */
          if (vendWebhook || shopifyWebhook || bulkRequest) {
            removeVariantsFromShopify.forEach(({ product_id, variant_id, image_id }) => {
              !!image_id && vendShopifyUpdatePromiseArr.push(deleteShopifyProductImage(product_id, image_id));
              vendShopifyUpdatePromiseArr.push(deleteShopifyProductVariant(product_id, variant_id));
            });
          }
          
          /**
           * Use data form newly added Shopify Products/Variants to link back to Vend via variant_id
           * Use inventory_item_id to adjust inventory in Shopify according to whats on vend for newly added products
           * */
          if (vendWebhook || shopifyWebhook) {
            newProductsOnShopify.forEach(({ data: { variant: { id: shopifyVariantId, sku, inventory_item_id } } }) => {
              const { id, inventory } = addVariantsToShopify.find(({ sku: vendSku }) => sku === vendSku);
              vendShopifyUpdatePromiseArr.push(updateVendProductVariant(id, tagString, shopifyVariantId));
              if (inventory !== 0) {
                vendShopifyUpdatePromiseArr.push(updateShopifyInventoryItem(inventory_item_id, inventory));
              }
            });
          }
          
          /**
           * Updates on Shopify - based on properly linked variant_id's
           * */
          if (vendWebhook || bulkRequest) {
            updateVariantsOnShopify.forEach(({ variant_id, sku, price, option1, option2, option3 }) => {
              vendShopifyUpdatePromiseArr.push(updateShopifyProductVariant(variant_id, sku, price, option1, option2, option3));
            });
          }
          
          /**
           * Execute final promise array -
           *   Image Tags -- Shopify Removals -- Vend product_id updates -- Shopify inventory updates -- vend updates to Shopify
           * */
          console.log(vendShopifyUpdatePromiseArr.length,
            "updates",
            bulkRequest ? 0 : addVariantsToShopify.length,
            "added",
            removeVariantsFromShopify.length,
            "Removals from Shopify",
            bulkRequest ? "bulkRequest" : "");
          
          if (vendShopifyUpdatePromiseArr.length > 0) {
            const results = (await Promise.all([
              ...vendShopifyUpdatePromiseArr.map(p => p.catch(e => e))
            ])).filter(result => !(result instanceof Error));
            if (bulkRequest) {
              results.forEach(({ config: { data } }) => { console.log(data);});
            }
          }
          
        }
        
        /**
         * If the product is unpublished - add unpublish tag
         *
         * */
        
        ((sourceData[0] instanceof Error) || (sourceData[1] instanceof Error)) &&
        console.log("error - could not get data from Shopify or Vend - incorrect handle or source_id");
        res.status(200).json("success");
      } catch (err) {
        console.log(err.message);
        console.log(err);
        res.status(500).json("error");
      }
    } else {
      res.status(200).json(duplicate ? "Already processing" : "No change needed - Not on Shopify");
    }
  } else {
    /*TODO: add tag - FX_unpublished_vend_to_shopify (remove if tag exists and on other side of if statement)*/
    /*TODO: set Product as inactive & remove from other sales channels! */
    res.status(200).json("error");
  }
}