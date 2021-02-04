import axios, { AxiosPromise } from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { loadFirebase } from "../../lib/db";

function catchErrors(promiseArray) {
  return promiseArray.map((p) => p.catch(e => console.log(e.message, "error caught within Promise.All()")));
}


export default (async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const shopifyWebhook = req.headers[`x-shopify-shop-domain`] === process.env.SHOPIFY_DOMAIN;
  
  if (shopifyWebhook) {
    const { id: order_id, fulfillments, line_items } = req.body
    console.log(order_id)
  }
  res.status(200).json({ name: `done` });
});