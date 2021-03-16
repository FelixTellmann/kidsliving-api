import { NextApiRequest, NextApiResponse } from "next";
import { createProductUpdates } from "../../../entities/fulfillment/createProductUpdates";
import { FulfillmentWebhookRequestBody } from "../../../entities/fulfillment/shopifyFulfillmentCreateWebhook";
import { fetchVendGqlSaleById } from "../../../entities/fulfillment/vendFetchPickListBySaleId";
import { fetchShopifyGqlOrderByIdNoDetail } from "../../../entities/order/shopifyFetchOrder";
import { fetchVendProductById, vendProduct } from "../../../entities/product/vendFetchProducts";
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

  const order = await fetchShopifyGqlOrderByIdNoDetail(body.order_id);
  console.log(order.data.data);
  const vendOrder = await fetchVendSaleByInvoiceId(body.name.replace(/^#/, "").split(".")[0]);

  if (vendOrder.data.data.length < 1) {
    res.status(200).json("sale not found on Vend");
    return;
  }

  console.log(JSON.stringify(vendOrder.data.data), "vendOrder");
  const productPromise = [];
  vendOrder.data.data[0].line_items.forEach(({ product_id }) => {
    productPromise.push(fetchVendProductById(product_id));
  });

  const [vendFulfillments, ...lineItems] = await Promise.allSettled([
    await fetchVendGqlSaleById(vendOrder.data.data[0].id),
    ...productPromise,
  ]);

  if (vendFulfillments.status !== "fulfilled") {
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
    res.status(200).json("Some Products not found on vend / error");
    return;
  }

  const updateProductsArray = createProductUpdates(body, vendFulfillments.value.data.data.sale, vendProducts);

  // console.log(JSON.stringify(vendFulfillments.value.data.data.sale), " vendFullfillmetn");
  // console.log(JSON.stringify(body), "body");

  console.log(updateProductsArray);
  res.status(200).json("end");
};
