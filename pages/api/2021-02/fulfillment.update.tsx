import { NextApiRequest, NextApiResponse } from "next";
import { FulfillmentWebhookRequestBody } from "../../../entities/fulfillment/shopifyFulfillmentCreateWebhook";
import { fetchVendGqlSaleById } from "../../../entities/fulfillment/vendFetchPickListBySaleId";
import { fetchShopifyGqlOrderByIdNoDetail } from "../../../entities/order/shopifyFetchOrder";
import { fetchVendSaleByInvoiceId } from "../../../entities/search/vendFetchSearchSale";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  /** STEP 1
   * Validate incoming webhook - get handle && source_id   * */
  const { SHOPIFY_DOMAIN } = process.env;

  const { headers } = req;
  const body: FulfillmentWebhookRequestBody = req.body;
  const shook = headers[`x-shopify-shop-domain`] === SHOPIFY_DOMAIN;

  if (!shook) {
    res.status(405).json("Not Allowed");
    return;
  }

  console.log(JSON.stringify(body.name.replace(/^#/, "").split(".")[0]));

  try {
    const order = await fetchShopifyGqlOrderByIdNoDetail(body.order_id);
    console.log(order.data.data);
    const vendOrder = await fetchVendSaleByInvoiceId(body.name.replace(/^#/, "").split(".")[0]);
    const vendPickList = await fetchVendGqlSaleById(vendOrder.data.data[0].id);
    /*console.log(vendPickList);*/
  } catch (err) {
    console.log(err.response.data.errors);
  }

  res.status(200).json("end");
};
