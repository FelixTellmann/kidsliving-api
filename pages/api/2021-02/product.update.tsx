import { loadFirebase } from "lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import { fetchShopify, fetchShopifyGQL, fetchVend } from "utils/fetch";
import { createGqlQuery, getDifferences, simplifyProducts } from "utils/products";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  /** STEP 1
   * Validate incoming webhook - get handle && source_id   * */
  const { VEND_RETAILER_ID, SHOPIFY_DOMAIN } = process.env;

  const { body: { payload, retailer_id, ...body }, headers } = req;
  const vhook = retailer_id === VEND_RETAILER_ID;
  const shook = headers[`x-shopify-shop-domain`] === SHOPIFY_DOMAIN;

  if (!vhook && !shook) {
    res.status(405).json("Not Allowed");
    return;
  }

  const { handle, source = "SHOPIFY", id, source_id = String(id) } = vhook ? JSON.parse(payload) : body;
  const product_id = source_id?.replace(/_unpub/gi, '');
  console.log(handle, source_id);

  const firebase = loadFirebase();
  const db = firebase.firestore();
  let duplicate = false;

  if (source !== "SHOPIFY") {
    res.status(200).json("not on shopify");
    return;
  }

  if (shook) {
    res.status(200).json('Shopify Webhook not available yet... 2021-02-10');
    return;
  }

  const delay = Math.floor(Math.random() * 50) * 100;
  console.log(delay);

  try {
    const prevTimer = Date.now();
    await new Promise((resolve) => setTimeout(resolve, delay));
    console.log(Date.now() - prevTimer);
    /* Rather Block return request - should be identical in anyways - so very limited requests will be used... */
    await db.collection("product.update").doc(product_id).get().then((doc) => {
      console.log(Date.now() - prevTimer);
      if (doc.exists && doc.data().created_at > Date.now() - 45 * 1000) { // 30 seconds ago
        duplicate = true;
      }
    });

    if (duplicate) {
      console.log(Date.now() - prevTimer);
      console.log(`id: ${handle} - Already processing`);
      res.status(200).json("duplicate");
      return;
    }

    await db.collection("product.update")
      .doc(product_id)
      .set({
        created_at: prevTimer,
        created_at_ISO: new Date(prevTimer).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
        handle,
        product_id,
        source: vhook ? "vend" : "shopify",
      });

    // console.log(result[result.length - 1].value.data.extensions.cost);

    /** STEP 2
     * Get data from Shopify & Vend for verification - exit if not found / error */
    const [v_req, s_gql_req] = await Promise.allSettled([
      fetchVend(`products?handle=${handle}`),
      fetchShopifyGQL(createGqlQuery(product_id)),
    ]);

    if (v_req.status === "rejected" && v_req.reason.response.status === 429) {
      console.log("too many vend requests - error");
      res.status(429).json("too many requests - shopify");
      return;
    }

    if (s_gql_req.status === "fulfilled" && s_gql_req.value.data?.errors?.length > 0) {
      console.log("too many shopify requests - error");
      res.status(429).json("too many requests - shopify");
      return;
    }

    if (v_req.status === "rejected" || s_gql_req.status === "rejected") {
      res.status(500).json("Request Rejected - shopify / Vend");
      return;
    }

    /** STEP 3
     * Analyse Vend Data */
    const vend = simplifyProducts(v_req.value.data?.products, "vend");
    /** STEP 4
     *  Analyse Shopify Data */
    const shopify_gql = simplifyProducts(s_gql_req.value.data?.data?.product, "shopify_gql");

    /** Step 5
     * Compare Vend & Shopify Data */
    const to_process = getDifferences(vend, shopify_gql);

    const to_process_count = Object.values(to_process).reduce((acc, itm) => {
      return [...acc, ...itm];
    }, []).length;

    if (to_process_count === 0) {
      console.log(`No Changes`);
      res.status(200).json("No Changes");
      return;
    }

    console.log(`${to_process_count} number of requests`);

    const updateArray = [
      ...to_process.vendProducts.map(({ api, method, body }) => fetchVend(api, method, body)),
      ...to_process.shopifyDeleteVariants.map(({ api, method }) => fetchShopify(api, method)),
      ...to_process.shopifyProduct.map(({ api, method, body }) => fetchShopify(api, method, body)),
      ...to_process.shopifyVariants.map(({ api, method, body }) => fetchShopify(api, method, body)),
      ...to_process.shopifyNewVariants.map(({ body }) => fetchShopifyGQL(body)),
      ...to_process.shopifyConnectInventory.map(({ api, method, body }) => fetchShopify(api, method, body)),
      ...to_process.shopifyDisconnectInventory.map(({ api, method, body }) => fetchShopify(api, method, body)),
    ];

    if (process.env.NODE_ENV === "development") {
      console.log(JSON.stringify({
        /* vend_0: vend[0],
        shopify_0: shopify_gql[0], */
        to_process,
      }, null, 2));
    } // LOGGING

    await db.collection("product.update")
      .doc(product_id)
      .set({
        created_at: prevTimer,
        created_at_ISO: new Date(Date.now()).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
        handle,
        product_id,
        source: vhook ? "vend" : "shopify",
        processed: JSON.stringify({
          /* vend_0: vend[0],
          shopify_0: shopify_gql[0], */
          to_process,
        }, null, 2),
      });

    const final = await Promise.allSettled(updateArray);

    final.forEach((request) => {
      console.log(request.status);
      if (request.status === "rejected") {
        console.log(request.reason.response.message);
      }
      if (request.status === "fulfilled") {
        request.value.data?.extensions?.cost && console.log(request.value.data?.extensions?.cost);
      }
    });
  } catch (err) {
    res.status(200).json(`error: ${err.message}`);
    return;
  }
  res.status(200).json("end");
};
