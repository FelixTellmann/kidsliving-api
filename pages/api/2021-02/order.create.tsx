import { fetchVendCustomerByEmail } from "entities/customer/vendFetchCustomer";
import { fetchShopifyOrderById } from "entities/order";
import { fetchVendAllProductsBySku } from "entities/product/vendFetchProducts";
import { loadFirebase } from "lib/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { postNewVendCustomer } from "../../../entities/customer/vendPostCustomer";
import { OrderWebhookRequestBody } from "../../../entities/order/shopifyOrderCreateWebhook";
import { fetchVendSaleByInvoiceId } from "../../../entities/search/vendFetchSearchSale";

export const ProductUpdateShopifyCounter = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  /** STEP 1
   * Validate incoming webhook - get handle && source_id   * */
  const { SHOPIFY_DOMAIN } = process.env;

  const { body, headers }: { body: OrderWebhookRequestBody, headers: any } = req;
  const shook = headers[`x-shopify-shop-domain`] === SHOPIFY_DOMAIN;

  if (!shook) {
    res.status(405).json("Not Allowed");
    return;
  }

  if (!body?.line_items.some(({ title }) => title.includes("TESTING TESTING"))) {
    res.status(200).json({ name: "John Doe3" });
    return;
  }

  const [shopifyOrderPromise, customerPromise, vendSalePromise, lineItemPromise] = await Promise.allSettled([
    fetchShopifyOrderById(body.id),
    fetchVendCustomerByEmail(body.email),
    fetchVendSaleByInvoiceId(body.order_number),
    fetchVendAllProductsBySku(body.line_items),
  ]);

  if (shopifyOrderPromise.status === "rejected" || customerPromise.status === "rejected" || lineItemPromise.status
    === "rejected"
    || vendSalePromise.status === "rejected") {
    console.log(shopifyOrderPromise.status, "shopifyOrderDetails.status");
    console.log(customerPromise.status, "customer.status");
    console.log(lineItemPromise.status, "sales.status");
    res.status(200).json({ name: "John Doe2" });
    return;
  }

  /* If Order already exists - EXIT (TODO: in future change to edit base don fulfillment changes) */
  const vendOrder = vendSalePromise.value?.data?.data?.find(({ source_id }) => +source_id === body.id);
  if (vendOrder) {
    console.log("Order Already exists");
    res.status(200).json("Order Already exists");
    return;
  }

  /* If Customer already exists - Yay, if not, need to create */
  const oldCustomer = customerPromise.value.data.customers.find(({ email }) => body.email);

  let newCustomer;
  if (!oldCustomer) {
    const [newCustomerPromise] = await Promise.allSettled([postNewVendCustomer(body)]);
    if (newCustomerPromise.status !== 'fulfilled') {
      res.status(200).json('Could not Create Customer - Error');
      return;
    }
    newCustomer = newCustomerPromise?.value?.data?.customer;
  }

  const customer = oldCustomer ?? newCustomer;

  console.log(customer);

  /* TODO: Match variant_source_id back to line-item variant id! or if length is 1 and variatn_source_id isnt setup properly (due to new variant created) */
  /* sales.value.forEach((d) => d.status !== "rejected" && console.log(d.value.data));
  console.log(vendSale.value.data.data, "asd");
  console.log(shopifyOrderDetails.value.data.data.order);
  console.log(customer.value.data.customers[0].first_name); */

  const firebase = loadFirebase();
  const db = firebase.firestore();

  const duplicate = false;

  await db.collection("testing")
    .doc()
    .set({
      created_at_ISO: new Date(Date.now()).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
      body: JSON.stringify(body),
      body2: JSON.stringify(shopifyOrderPromise.value.data.data.order),
    });

  res.status(200).json({ name: "John Doe" });
};

export default ProductUpdateShopifyCounter;
