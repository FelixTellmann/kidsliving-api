import { loadFirebase } from "lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import { fetchShopify, fetchVend } from "utils/fetch";
import { getDifferences, hasVariantImage, isInactive, isUnpublished, simplifyProducts } from "utils/products";
import { isSameTags, mergeDescriptions, mergeTags } from "../../../utils";

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
  console.log(handle, source, source_id);

  const firebase = loadFirebase();
  const db = firebase.firestore();
  let duplicate = false;
  const update = false;

  if (source !== "SHOPIFY") {
    res.status(200).json("not on shopify");
    return;
  }

  try {
    /* Rather Block return request - should be identical in anyways - so very limited requests will be used... */
    await db.collection("product.update").doc(handle).get().then((doc) => {
      if (doc.exists && doc.data().created_at > Date.now() - 60 * 1000) { // 60 seconds ago
        duplicate = true;
        console.log(`id: ${handle} - Already processing`);
      }
    });

    /** STEP 2
     * Get data from Shopify & Vend for verification - exit if not found / error */
    const [v_req, s_req] = await Promise.allSettled([
      fetchVend(`products?handle=${handle}`),
      fetchShopify(`products/${source_id}.json?fields=images,variants,tags,status,product_type,id,body_html`),
    ]);

    if (v_req.status === "rejected" && v_req.reason.response.status === 429) {
      console.log("too many vend requests - error");
      res.status(429).json("too many requests - shopify");
      return;
    }

    if (s_req.status === "rejected" && s_req.reason.response.status === 429) {
      console.log("too many shopify requests - error");
      res.status(429).json("too many requests - shopify");
      return;
    }

    if (v_req.status === "rejected" || s_req.status === "rejected") {
      res.status(500).json("too many requests - shopify");
      return;
    }

    /** STEP 3
     * Analyse Vend Data */
    const vend = simplifyProducts(v_req.value.data?.products, "vend");

    /** STEP 4
     *  Analyse Shopify Data */
    const shopify = simplifyProducts(s_req.value.data?.product, "shopify");

    if (process.env.NODE_ENV === "development") {
      console.log(JSON.stringify({
        vend_0: vend[0],
        shopify_0: shopify[0],
      }, null, 2));
    } // LOGGING

    /** Step 5
     * Compare Vend & Shopify Data */
    const asd = getDifferences(vend, shopify);

    console.log(asd);
    /* const a = await Promise.allSettled([
      updates.length > 0 ? fetchShopify(`/products/${updates[0].product_id}.json`,
        "PUT",
        {
          product: {
            id: updates[0].product_id,
            tags: updates[0].tags,
            body_html: updates[0].description,
            product_type: updates[0].product_type,
          },
        }) : null,
      ...updates.map(({ variant_id, sku, price, option1, option2, option3 }) => fetchShopify(`/variants/${variant_id}.json`,
        "PUT",
        {
          variant: {
            id: variant_id,
            sku,
            price,
            option1,
            option2,
            option3,
          },
        })),
    ]);
    console.log(a); */
  } catch (err) {
    res.status(200).json(`error: ${err.message}`);
    return;
  }
  res.status(200).json("end");
};
