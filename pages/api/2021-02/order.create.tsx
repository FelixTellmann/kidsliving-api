import type { NextApiRequest, NextApiResponse } from "next";
import { loadFirebase } from "lib/db";

export const ProductUpdateShopifyCounter = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  /** STEP 1
   * Validate incoming webhook - get handle && source_id   * */
  const { SHOPIFY_DOMAIN } = process.env;

  const { body, headers } = req;
  const shook = headers[`x-shopify-shop-domain`] === SHOPIFY_DOMAIN;

  if (!shook) {
    res.status(405).json("Not Allowed");
    return;
  }

  console.log(body);

  const firebase = loadFirebase();
  const db = firebase.firestore();
  const duplicate = false;

  res.status(200).json({ name: "John Doe" });
};

export default ProductUpdateShopifyCounter;
