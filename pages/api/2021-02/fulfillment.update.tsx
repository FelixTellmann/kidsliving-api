import { NextApiRequest, NextApiResponse } from "next";
import { createProductUpdates } from "entities/fulfillment/createProductUpdates";
import { FulfillmentWebhookRequestBody } from "entities/fulfillment/shopifyFulfillmentCreateWebhook";
import { fetchVendGqlSaleById } from "entities/fulfillment/vendFetchPickListBySaleId";
import { fetchShopifyGqlOrderById, fetchShopifyGqlOrderByIdNoDetail } from "../../../entities/order/shopifyFetchOrder";
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

    if (duplicate) {
      console.log(Date.now() - prevTimer);
      console.log(`Order: ${invoiceId} - Already processing`);
      res.status(200).json("duplicate");
      return;
    }

    const vendOrder = await fetchVendSaleByInvoiceId(invoiceId);
    const shopifyOrder = await fetchShopifyGqlOrderByIdNoDetail(body.order_id);
    const { fulfillable } = shopifyOrder?.data?.data?.order;

    if (vendOrder.data.data.length < 1) {
      console.log("vendOrder not found");
      res.status(200).json("sale not found on Vend");
      return;
    }

    const productPromise = [];
    vendOrder.data.data[0].line_items.forEach(({ product_id }) => {
      productPromise.push(fetchVendProductById(product_id));
    });

    const [vendFulfillments, ...lineItems] = await Promise.allSettled([
      await fetchVendGqlSaleById(vendOrder.data.data[0].id),
      ...productPromise,
    ]);

    if (vendFulfillments.status !== "fulfilled") {
      console.log("vend api error");
      res.status(200).json("sale not found on Vend");
      return;
    }

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

    const updateProductsArray = createProductUpdates(body, vendFulfillments.value.data.data.sale, vendProducts);

    const vendUpdatePromise = updateProductsArray.map(body => fetchVend("/products", "POST", body));
    const result = await Promise.allSettled(vendUpdatePromise);

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
        fulfillable,
        resultData: JSON.stringify(resultData),
        fulfillment_id: body.id,
        created_at_ISO: new Date(prevTimer).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
      });

    await db
      .collection("fulfillment.id")
      .doc(`${body.id}`)
      .set({
        orders_processed: JSON.stringify(updateProductsArray),
        body: JSON.stringify(body),
        fulfillable,
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
