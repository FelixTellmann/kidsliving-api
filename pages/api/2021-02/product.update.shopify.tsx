import type { NextApiRequest, NextApiResponse } from "next";
import { loadFirebase } from "../../../lib/db";

export const ProductUpdateShopify = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
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
  const product_id = source_id?.replace(/_unpub/gi, "");
  console.log(handle, source_id);

  const firebase = loadFirebase();
  const db = firebase.firestore();
  let duplicate = false;
  let db_data = {
    updated_at: Date.now(),
    count: 0,
    product_ids: {},
    duplicate_counts: {},
  };

  const delay = Math.floor(Math.random() * 60) * 100;
  console.log(delay);

  try {
    const prevTimer = Date.now();
    await new Promise((resolve) => setTimeout(resolve, delay));
    console.log(Date.now() - prevTimer);
    /* Rather Block return request - should be identical in anyways - so very limited requests will be used... */
    await db.collection("product.update.shopify").doc("count").get().then((doc) => {
      console.log(Date.now() - prevTimer);
      if (doc.exists) { // 1 request per 10 seconds
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        db_data = doc.data();
        const { updated_at } = db_data;
        if (updated_at > Date.now() - 10 * 1000) {
          duplicate = true;
        }
      }
    });

    if (duplicate) {
      console.log(Date.now() - prevTimer);
      console.log(`id: ${handle} - Already processing`);
      res.status(200).json("duplicate");
      return;
    }

    db_data = {
      updated_at: prevTimer,
      count: +db_data.count + 1,
      duplicate_counts: { },
      product_ids: {
        ...db_data.product_ids,
        source_id: db_data.product_ids[source_id] ? +db_data.product_ids[source_id] + 1 : 1,
      },
    };

    db_data.duplicate_counts = Object.values(db_data.product_ids).reduce((acc, val) => {
      if (acc[`_${val}`]) {
        acc[`_${val}`] = +acc[`_${val}`] + 1;
      } else {
        acc[`_${val}`] = 1;
      }
      return acc;
    }, {});

    await db.collection("product.update.shopify")
      .doc("count")
      .set({ ...db_data });
  } catch (err) {
    console.log(err.message);
    res.status(200).json(`error: ${err.message}`);
    return;
  }

  res.status(200).json({ name: "John Doe" });
};

export default ProductUpdateShopify;
