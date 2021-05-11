import { loadFirebase } from "lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import { fetchShopify, fetchShopifyGQL, fetchVend } from "utils/fetch";
import { getDifferences, simplifyProducts } from "utils/products";
import { fetchShopifyProductByProductId } from "../../../entities/product/shopifyFetchProducts";
import { fetchVendProductByHandle } from "../../../entities/product/vendFetchProducts";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  /** STEP 1
   * Validate incoming webhook - get handle && source_id   * */
  const { VEND_RETAILER_ID, SHOPIFY_DOMAIN, NODE_ENV } = process.env;

  const {
    body: { payload, retailer_id, ...body },
    headers,
  } = req;
  const vhook = retailer_id === VEND_RETAILER_ID;
  const shook = headers[`x-shopify-shop-domain`] === SHOPIFY_DOMAIN;

  if (!vhook && !shook) {
    res.status(405).json("Not Allowed");
    return;
  }

  const { handle, source = "SHOPIFY", id, source_id = String(id) } = vhook ? JSON.parse(payload) : body;
  const product_id = source_id?.replace(/_unpub/gi, "");
  console.log(handle, source_id);

  if (handle === "danishpacifier") {
    console.log(`Too many variants`);
    res.status(200).json("Too many variants");
    return;
  }

  if (handle === "giftvoucher") {
    console.log("giftvoucher");
    res.status(200).json("Request Rejected - ERROR -Giftvoucher");
    return;
  }

  const firebase = loadFirebase();
  const db = firebase.firestore();
  let duplicate = false;

  if (/* source !== "SHOPIFY" */ source_id?.length < 2 || source_id === null) {
    console.log(`source !== "SHOPIFY"`);
    res.status(200).json("not on shopify");
    return;
  }

  const delay = Math.floor(Math.random() * 120) * 50;
  console.log(delay);
  let s_created_at = Date.now();
  let v_created_at = Date.now();

  try {
    const prevTimer = Date.now();
    await new Promise(resolve => setTimeout(resolve, delay));
    console.log(Date.now() - prevTimer);
    /* Rather Block return request - should be identical in anyways - so very limited requests will be used... */
    await db
      .collection("product.update")
      .doc(product_id)
      .get()
      .then(doc => {
        console.log(Date.now() - prevTimer);
        if (doc.exists) {
          // 30 seconds ago
          if (doc.data().v_created_at > Date.now() - (vhook ? 10 : 20) * 1000) {
            console.log(`wait: ${Math.floor((Date.now() - 20 * 1000 - doc.data().v_created_at) / -1000)}s`);
            duplicate = true;
          }
          if (doc.data().s_created_at > Date.now() - (shook ? 10 : 20) * 1000) {
            console.log(`wait: ${Math.floor((Date.now() - 40 * 1000 - doc.data().s_created_at) / -1000)}s`);
            duplicate = true;
          }
          if (vhook) {
            s_created_at = doc.data().s_created_at;
          }

          if (shook) {
            v_created_at = doc.data().v_created_at;
          }
        }
      });

    if (duplicate) {
      console.log(Date.now() - prevTimer);
      console.log(`id: ${handle} - Already processing - initial source: ${vhook ? "vend" : "shopify"}`);
      res.status(200).json("duplicate");
      return;
    }

    await db
      .collection("product.update")
      .doc(product_id)
      .set({
        s_created_at,
        v_created_at,
        created_at_ISO: new Date(prevTimer).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
        handle,
        product_id,
        source: vhook ? "vend" : "shopify",
      });

    // console.log(result[result.length - 1].value.data.extensions.cost);

    /** STEP 2
     * Get data from Shopify & Vend for verification - exit if not found / error */
    const [v_req, s_gql_req] = await Promise.allSettled([
      fetchVendProductByHandle(handle),
      fetchShopifyProductByProductId(product_id),
    ]);

    if (v_req.status === "rejected" && v_req.reason.response.status === 429) {
      console.log("too many vend requests - error");
      res.status(429).json("too many requests - shopify");
      return;
    }

    if (s_gql_req.status === "fulfilled" && s_gql_req.value?.data?.errors) {
      console.log("too many shopify requests - error");
      res.status(429).json("too many requests - shopify");
      return;
    }

    if (v_req.status === "rejected" || s_gql_req.status === "rejected") {
      res.status(500).json("Request Rejected - shopify / Vend");
      return;
    }

    if (!s_gql_req.value.data?.data?.product) {
      res.status(200).json("No matching product_id on Shopify");
      return;
    }

    if (v_req.status === "fulfilled" && v_req.value?.data?.products?.length > 32) {
      res.status(200).json("Too many variants to handle safely.");
      return;
    }

    /** STEP 3
     * Analyse Vend Data */
    const vend = simplifyProducts(v_req.value.data?.products, "vend");

    /** STEP 4
     *  Analyse Shopify Data */
    const shopify = simplifyProducts(s_gql_req.value.data?.data?.product, "shopify");

    /** Step 5
     * Compare Vend & Shopify Data */
    const to_process = getDifferences(vend, shopify, shook);

    const to_process_count = Object.values(to_process).reduce((acc, itm) => {
      return [...acc, ...itm];
    }, [])?.length;

    if (to_process_count === 0) {
      console.log(`No Changes`);
      await db
        .collection("product.update")
        .doc(product_id)
        .set({
          s_created_at: Date.now(),
          v_created_at,
          created_at_ISO: new Date(Date.now()).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
          vend: JSON.stringify(vend),
          shopify: JSON.stringify(shopify),
          handle,
          product_id,
          source: vhook ? "vend" : "shopify",
          processed: JSON.stringify(
            {
              /* vend_0: vend[0],
            shopify_0: shopify[0], */
              to_process,
            },
            null,
            2
          ),
        });
      res.status(200).json("No Changes");
      return;
    }

    console.log(`${to_process_count} number of requests`);

    const updateArray = [
      ...to_process.vendProducts.map(({ api, method, body }) => fetchVend(api, method, body)),
      ...to_process.shopifyDeleteVariants.map(({ api, method }) => fetchShopify(api, method)),
      ...to_process.shopifyProduct.map(({ api, method, body }) => fetchShopify(api, method, body)),
      ...to_process.shopifyVariants.map(({ body }) => fetchShopifyGQL(body)),
      ...to_process.shopifyNewVariants.map(({ body }) => fetchShopifyGQL(body)),
      ...to_process.shopifyDisconnectInventory.map(({ api, method, body }) => fetchShopify(api, method, body)),
    ];

    if (process.env.NODE_ENV === "development") {
      console.log(
        JSON.stringify(
          {
            /* vend_0: vend[0],
        shopify_0: shopify[0], */
            to_process,
          },
          null,
          2
        ),
        "development"
      );
    } // LOGGING

    const final = await Promise.allSettled(updateArray);

    const result = [];
    final.forEach(request => {
      console.log(request.status);
      if (request.status === "rejected") {
        console.log(request.reason.response);
        result.push(request.reason.response.message, request.reason.response.status);
      }
      if (request.status === "fulfilled") {
        console.log(request.value?.data?.errors);
        request.value.data?.extensions?.cost && console.log(request.value.data?.extensions?.cost);
        request.value.data?.extensions?.cost && result.push(request.value.data?.extensions?.cost);
        request.value.data?.product?.id &&
          result.push({ id: request.value.data?.product?.id, name: request.value.data?.product?.name });
      }
    });

    await db
      .collection("product.update")
      .doc(product_id)
      .set({
        s_created_at: Date.now(),
        v_created_at,
        created_at_ISO: new Date(Date.now()).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
        vend,
        shopify,
        handle,
        product_id,
        source: vhook ? "vend" : "shopify",
        processed: JSON.stringify(
          {
            /* vend_0: vend[0],
          shopify_0: shopify[0], */
            to_process,
          },
          null,
          2
        ),
        result: JSON.stringify(result),
      });
  } catch (err) {
    console.log(err.message);
    res.status(200).json(`error: ${err.message}`);
    return;
  }
  res.status(200).json("end");
};
