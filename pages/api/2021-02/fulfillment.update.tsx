import { fetchVendOrderById } from "entities/order/vendFetchOrder";
import { postUpdateVendOrder } from "entities/order/vendPostOrder";
import { NextApiRequest, NextApiResponse } from "next";
import { createProductUpdates } from "entities/fulfillment/createProductUpdates";
import { FulfillmentWebhookRequestBody } from "entities/fulfillment/shopifyFulfillmentCreateWebhook";
import { fetchVendGqlSaleById } from "entities/fulfillment/vendFetchPickListBySaleId";
import {
  fetchShopifyFulfillmentOrdersById,
  fetchShopifyFulfillmentsByOrderId,
  fetchShopifyGqlOrderById,
  fetchShopifyGqlOrderByIdNoDetail,
} from "../../../entities/order/shopifyFetchOrder";
import { fetchVendProductById, vendProduct } from "entities/product/vendFetchProducts";
import { fetchVendSaleByInvoiceId } from "entities/search/vendFetchSearchSale";
import { loadFirebase } from "lib/db";
import { fetchVend } from "utils/fetch";

const {
  SHOPIFY_DOMAIN,
  SHOPIFY_CPT_OUTLET_ID,
  SHOPIFY_JHB_OUTLET_ID,
  SHOPIFY_CPTWH_OUTLET_ID,
  VEND_CPT_OUTLET_ID,
  VEND_JHB_OUTLET_ID,
  VEND_CPTWH_OUTLET_ID,
} = process.env;

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  /** STEP 1
   * Validate incoming webhook - get handle && source_id   * */

  const { headers } = req;
  const body: FulfillmentWebhookRequestBody = req.body;
  const shook = headers[`x-shopify-shop-domain`] === SHOPIFY_DOMAIN;

  if (!shook) {
    res.status(405).json("Not Allowed");
    return;
  }

  const invoiceId = body.name.replace(/^#/, "").split(".")[0];
  console.log(invoiceId);

  body.vend_location_id =
    body.location_id === +SHOPIFY_CPT_OUTLET_ID
      ? VEND_CPT_OUTLET_ID
      : body.location_id === +SHOPIFY_JHB_OUTLET_ID
      ? VEND_JHB_OUTLET_ID
      : body.location_id === +SHOPIFY_CPTWH_OUTLET_ID
      ? VEND_CPTWH_OUTLET_ID
      : "";

  const firebase = loadFirebase();
  const db = firebase.firestore();
  let duplicate = false;

  const delay = Math.floor(Math.random() * 60) * 20;
  console.log(delay);

  const prevTimer = Date.now();
  await new Promise(resolve => setTimeout(resolve, delay));
  console.log(Date.now() - prevTimer);

  try {
    await db
      .collection("fulfillment.update")
      .doc(invoiceId)
      .get()
      .then(doc => {
        console.log(Date.now() - prevTimer);
        if (doc.exists) {
          if (doc.data()?.fulfillable === false) {
            duplicate = true;
          }
        }
      });

    await db
      .collection("fulfillment.id")
      .doc(`${body.id}`)
      .get()
      .then(doc => {
        console.log(Date.now() - prevTimer);
        if (doc.exists) {
          duplicate = true;
        }
      });

    if (process.env.NODE_ENV !== "development" && duplicate) {
      console.log(Date.now() - prevTimer);
      console.log(`Order: ${invoiceId} - Already processing`);
      res.status(200).json("duplicate");
      return;
    }

    const vendSearchOrder = await fetchVendSaleByInvoiceId(invoiceId);
    const shopifyAllFulfillments = (await fetchShopifyFulfillmentsByOrderId(body.order_id))?.data?.fulfillments?.filter(
      f => f.status === "success"
    );
    const vendOrder2 = (await fetchVendOrderById(vendSearchOrder.data.data[0].id))?.data?.register_sales[0];
    const vendOrder = (await fetchVendOrderById(vendSearchOrder.data.data[0].id))?.data?.register_sales[0];

    if (vendOrder.note === "JHB Fulfillment") {
      console.log("Already processed");
      res.status(200).json("Already processed");
      return;
    }

    if (shopifyAllFulfillments.length === 0) {
      console.log("shopifyAllFulfillments not found - Not ready to process fulfillments");
      res.status(200).json("sale not found on Vend");
      return;
    }

    if (vendSearchOrder.data.data.length < 1) {
      console.log("vendOrder not found");
      res.status(200).json("sale not found on Vend");
      return;
    }

    /*  Check if all products for the order are covered by the fulfillments */
    const checkProducts = [
      ...vendOrder?.register_sale_products.filter(
        t =>
          t.product_id !== "02dcd191-ae62-11e7-f130-7c36aba744d9" &&
          t.product_id !== "0a91b764-1c62-11eb-e0eb-af3ff44fe9b0" &&
          t.product_id !== "0a4735cc-4962-11e7-fc9e-fa9751cfd9ee" &&
          t.product_id !== "0a6f6e36-8b62-11ea-f3d6-96929af580bf" &&
          t.product_id !== "0a4735cc-4962-11e7-fc9e-f6d43e4e02b3" &&
          t.product_id !== "0a6f6e36-8b62-11ea-f3d6-968ff95c2860"
      ),
    ];

    shopifyAllFulfillments.forEach(fulfillment => {
      fulfillment?.line_items?.forEach(product => {
        const editIndex = checkProducts.findIndex(t => t.quantity >= product.quantity && t.sku === product.sku);
        checkProducts[editIndex].quantity = checkProducts[editIndex].quantity - product.quantity;
      });
    });

    const usedAllProducts = checkProducts.every(t => t.quantity === 0);

    if (!usedAllProducts) {
      console.log("awaiting outstanding fulfillments");
      await db
        .collection("fulfillment.update")
        .doc(invoiceId)
        .set({
          body: JSON.stringify(body),
          fulfillments: JSON.stringify(shopifyAllFulfillments),
          vendOrder: JSON.stringify(vendOrder),
          fulfillment_id: body.id,
          created_at_ISO: new Date(prevTimer).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
        });
      res.status(200).json("awaiting outstanding fulfillments");
      return;
    }

    if (shopifyAllFulfillments.every(fulfillment => `${fulfillment.location_id}` !== process.env.SHOPIFY_JHB_OUTLET_ID)) {
      await db
        .collection("fulfillment.update")
        .doc(invoiceId)
        .set({
          body: JSON.stringify(body),
          fulfillments: JSON.stringify(shopifyAllFulfillments),
          fulfillment_id: body.id,
          created_at_ISO: new Date(prevTimer).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
        });
      res.status(200).json("All good in the hood - all fulfillments for CPT");
      return;
    }

    const productPromise = [];
    vendSearchOrder.data.data[0].line_items.forEach(({ product_id }) => {
      productPromise.push(fetchVendProductById(product_id));
    });

    const [...lineItems] = await Promise.allSettled([...productPromise]);

    const vendProducts: vendProduct[] = lineItems.reduce((acc, product) => {
      if (product.status === "fulfilled" && product.value.data.products.length > 0) {
        return [...acc, ...product.value.data.products];
      }
      return acc;
    }, []);

    if (vendProducts.length !== lineItems.length) {
      console.log("products not found");
      res.status(200).json("Some Products not found on vend / error");
      return;
    }

    const updateProductsArray = createProductUpdates(shopifyAllFulfillments, vendProducts);

    const vendUpdatePromise = updateProductsArray.map(body => fetchVend("/products", "POST", body));
    const result = await Promise.allSettled(vendUpdatePromise);

    const closeSale = await postUpdateVendOrder({ ...vendOrder2, status: "DISPATCHED_CLOSED", note: "JHB Fulfillment" });

    console.log(JSON.stringify(updateProductsArray));

    const resultData = [];
    result.forEach(update => {
      if (update.status === "fulfilled") {
        resultData.push(update.value.data.product);
      }
    });

    await db
      .collection("fulfillment.update")
      .doc(invoiceId)
      .set({
        body: JSON.stringify(body),
        orders_processed: JSON.stringify(updateProductsArray),
        resultData: JSON.stringify(resultData),
        register_sale_data: JSON.stringify(closeSale.data.register_sale),
        fulfillment_id: body.id,
        created_at_ISO: new Date(prevTimer).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
      });

    await db
      .collection("fulfillment.id")
      .doc(`${body.id}`)
      .set({
        orders_processed: JSON.stringify(updateProductsArray),
        body: JSON.stringify(body),
        resultData: JSON.stringify(resultData),
        created_at_ISO: new Date(prevTimer).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
      });

    res.status(200).json("end");
  } catch (err) {
    console.log(err.message);
    await db
      .collection("fulfillment.error")
      .doc(`${body.id}`)
      .set({
        body: JSON.stringify(body),
        error: JSON.stringify(err),
        message: err.message,
        created_at_ISO: new Date(prevTimer).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
      });
    res.status(200).json("end");
  }
};
