import axios, { AxiosPromise } from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { loadFirebase } from "../../lib/db";

function getShopifyInventoryItem(inventory_item_id: number): AxiosPromise {
  return axios({
    method: "GET",
    url: `${process.env.SHOPIFY_API}/inventory_items/${inventory_item_id}.json`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
}

function getVendProductBySku(sku: string): AxiosPromise {
  return axios({
    method: "get",
    url: `https://kidsliving.vendhq.com/api/products?sku=${sku}`,
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
    url: `${process.env.SHOPIFY_API}/products/${product_id}.json?fields=variants`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
}

function catchErrors(promiseArray) {
  return promiseArray.map((p) => p.catch(e => console.log(e.message, "error caught within Promise.All()")));
}

function deleteShopifyInventoryItemToLocationConnection(inventory_item_id: number, location_id: number) {
  return axios({
    method: "DELETE",
    url: `${process.env.SHOPIFY_API}/inventory_levels.json?inventory_item_id=${inventory_item_id}&location_id=${location_id}`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
}

function saveInDB(db, inventory_item_id) {
  return db.collection("inventory_item_levels")
           .doc(inventory_item_id.toString())
           .set({
             created_at: Date.now(),
             created_at_ISO: new Date(Date.now()).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/")
           });
}

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const shopifyWebhook = req.headers[`x-shopify-shop-domain`] === process.env.SHOPIFY_DOMAIN;
  let firebase = await loadFirebase();
  let db = firebase.firestore();
  
  const { inventory_item_id, location_id } = req.body;
  console.log(JSON.stringify(req.body));
  console.log(shopifyWebhook, location_id, +process.env.SHOPIFY_JHB_OUTLET_ID);
  /* Validate Action needed - is on JHB outlet */
  
  try {
    if (shopifyWebhook && location_id === +process.env.SHOPIFY_JHB_OUTLET_ID) {
      let duplicate = false;
      try {
        await db.collection("inventory_item_levels").doc(inventory_item_id.toString()).get().then((doc) => {
          if (doc.exists && doc.data().created_at > Date.now() - 2 * 60 * 1000) { // 60 seconds ago
            duplicate = true;
            console.log("id: " + inventory_item_id + " - Already processing - Please wait until:" +
              new Date(doc.data().created_at + 2 * 60 * 1000)
                .toISOString()
                .split(".")[0]
                .split("T")
                .join(" ")
                .replace(/-/gi, "/"));
          }
        });
      } catch (err) {
        console.log(err);
        res.status(500).json("Error no DB connection");
        return;
      }
      
      const { data: { inventory_item: { sku } } } = await getShopifyInventoryItem(inventory_item_id);
      const { data: { products: [{ tags, source_id }] } } = await getVendProductBySku(sku);
      
      if (tags.toLowerCase().includes("sell jhb")) {
          console.log('Has "Sell JHB" Tag')
      }
      /* validate existence */
      if (!duplicate && source_id && !tags.toLowerCase().includes("sell jhb")) {
        const { data: { product: { variants } } } = await getShopifyProductById(source_id);
        if (variants.length) {
          const saveInDBPromiseArr = [];
          const updateShopifyPromiseArr = [];
          variants.forEach(({ inventory_item_id }) => {
            saveInDBPromiseArr.push(saveInDB(db, inventory_item_id))
            updateShopifyPromiseArr.push(deleteShopifyInventoryItemToLocationConnection(inventory_item_id,
              +process.env.SHOPIFY_JHB_OUTLET_ID));
          });
          await Promise.all(catchErrors(saveInDBPromiseArr))
          await Promise.all(catchErrors(updateShopifyPromiseArr));
        }
      }
    }
  } catch (err) {
    console.log(err);
    console.log(err.message, "ASDASD MESSAGE");
  }
  
  res.status(200).json({ name: `done` });
}