import axios, { AxiosPromise } from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { loadFirebase } from "lib/db";
import { isSameArray } from "./product_update";

function catchErrors(promiseArray) {
  return promiseArray.map((p) => p.catch(e => console.log(e.message, "error caught within Promise.All()")));
}

function getShopifyFulfillmentOrders(order_id: number): AxiosPromise {
  return axios({
    method: "GET",
    url: `${process.env.SHOPIFY_API}/orders/${order_id}/fulfillment_orders.json`,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
}

type VariantSort = {
  [key: string]: {
    id: number
    assigned_location_id: number,
    status: string,
    quantity: number,
    index: number
    needsProcessing: boolean
  }[]
}

function getShopifyVariantById(variant_id: number): AxiosPromise {
  return axios({
    method: "GET",
    url: `${process.env.SHOPIFY_API}/variants/${variant_id}.json`,
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

export default (async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const shopifyWebhook = req.headers[`x-shopify-shop-domain`] === process.env.SHOPIFY_DOMAIN;
  let firebase = await loadFirebase();
  let db = firebase.firestore();
  
  if (shopifyWebhook) {
    
    const { id: order_id, fulfillments, line_items } = req.body;
    console.log(order_id, 'order_id');
    
    const { data: { fulfillment_orders } } = await getShopifyFulfillmentOrders(order_id);
    const fulfillmentOrderIdArray = fulfillment_orders.map(({ id }) => id);
    let previouslyProcessed = [];
    
    
    fulfillment_orders.forEach(itm=>console.log(itm,','))
    
    
    await db.collection("fulfillment_orders").doc("" + order_id).get().then((result) => {
      if (result.exists) {
        previouslyProcessed = result.data().fulfillment_orders;
      }
    });
    
    if (isSameArray(fulfillmentOrderIdArray, previouslyProcessed)) {
      console.log("no fulfillment_order change detected");
      res.status(200).json("New Order / no fulfillment changes");
      return;
    }
    
    const possibleChange = !!fulfillment_orders.filter(({ status }) => status === "closed").length;
    if (!possibleChange) {
      await db.collection("fulfillment_orders").doc("" + order_id).set({ fulfillment_orders: fulfillment_orders.map(({ id }) => id) });
      res.status(200).json("New Order / no fulfillment changes");
      return;
    }
    
    const sorted_fulfillment_orders: VariantSort = fulfillment_orders.reduce((
      acc,
      { id, assigned_location_id, status, line_items }
    ) => {
      line_items.forEach(({ variant_id, quantity }) => {
        if (acc[variant_id]) {
          acc[variant_id].push({ id, assigned_location_id, status, quantity, needsProcessing: !previouslyProcessed.includes(id) });
        } else {
          acc[variant_id] = [];
          acc[variant_id].push({ id, assigned_location_id, status, quantity, needsProcessing: !previouslyProcessed.includes(id) });
        }
      });
      return acc;
    }, {});
    
    const sortedFilteredFulfillmentOrders = Object.entries(sorted_fulfillment_orders).reduce((acc, [key, val]) => {
      if (val.some(({ needsProcessing }) => needsProcessing)) {
        acc[key] = val.reduce((acc, itm) => {
          if (!itm.needsProcessing) {
            acc.lastProcessed = { ...itm };
          } else {
            if (!(acc.lastProcessed.quantity === itm.quantity && acc.lastProcessed.assigned_location_id ===
              itm.assigned_location_id)) {
              if (acc.lastProcessed.quantity !== itm.quantity) {
                itm["updateQuantity"] = true;
              }
              acc.toProcess = {
                ...itm,
                updateQuantity: acc.lastProcessed.quantity !== itm.quantity,
                updateLocation: acc.lastProcessed.assigned_location_id !== itm.assigned_location_id
              };
            }
          }
          
          return acc;
        }, {
          lastProcessed: {
            id: undefined,
            assigned_location_id: undefined,
            status: undefined,
            quantity: undefined,
            needsProcessing: undefined
          },
          toProcess: {
            id: undefined,
            assigned_location_id: undefined,
            status: undefined,
            quantity: undefined,
            needsProcessing: undefined,
            updateQuantity: false,
            updateLocation: false
          }
        });
      }
      return acc;
    }, {});
    
    console.log(sortedFilteredFulfillmentOrders);
    
    const noFulfillmentChanges = Object.values(sorted_fulfillment_orders).every(item => {
      /*= =============== TODO: Might not be true based on processing final fulfillment ================ */
      return item.length === 1 && item[0].status === "closed";
    });
    
    /*if (noFulfillmentChanges) {
      res.status(200).json("Order already fulfilled");
      return;
    }*/
    
    try {
      const getShopifyVariantsByIdPromiseArr = [];
      Object.keys(sortedFilteredFulfillmentOrders).forEach((variant_id) => {
        getShopifyVariantsByIdPromiseArr.push(getShopifyVariantById(+variant_id));
      });
      
      const variants = await Promise.all(catchErrors(getShopifyVariantsByIdPromiseArr));
      
      const getVendVariantsBySKUPromiseArr = [];
      variants.forEach(({ data: { variant: { sku } } }) => {
        getVendVariantsBySKUPromiseArr.push(getVendProductBySku(sku));
      });
      
      const vendVariants = await Promise.all(catchErrors(getVendVariantsBySKUPromiseArr));
      vendVariants.forEach(({ data: { products } }) => {
        console.log(products);
      });
      
    } catch (err) {
      console.log(err.message);
      res.status(200).json("error - getShopifyVariantById");
      return;
    }
  }
  res.status(200).json("done");
});