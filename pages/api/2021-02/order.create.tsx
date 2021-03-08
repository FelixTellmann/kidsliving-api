import { fetchVendCustomerByEmail } from "entities/customer/vendFetchCustomer";
import { fetchVendAllProductsBySku, fetchVendProductByHandle } from "entities/product/vendFetchProducts";
import { loadFirebase } from "lib/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { postNewVendCustomer } from "../../../entities/customer/vendPostCustomer";
import { fetchShopifyFulfillmentOrdersById } from "../../../entities/order/shopifyFetchOrder";
import { OrderWebhookRequestBody } from "../../../entities/order/shopifyOrderCreateWebhook";
import { fetchVendOrderById } from "../../../entities/order/vendFetchOrder";
import { postNewVendOrder } from "../../../entities/order/vendPostOrder";
import { postNewVendOrderReturnConfig } from "../../../entities/order/vendPostOrderReturnConfig";
import { fetchVendSaleByInvoiceId } from "../../../entities/search/vendFetchSearchSale";

const {
  VEND_USER_SALE_ID,
  VEND_REGISTER_CPT_TILL2_ID,
  VEND_REGISTER_JHB_TILL2_ID,
  VEND_TAX_ID,
  VEND_PAYMENT_EFT_ID,
  VEND_PAYMENT_CC_ID,
  SHOPIFY_CPT_OUTLET_ID,
  SHOPIFY_JHB_OUTLET_ID,
  SHOPIFY_DOMAIN,
} = process.env;

export const ProductUpdateShopifyCounter = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  /** STEP 1
   * Validate incoming webhook - get handle && source_id   * */

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

  const firebase = loadFirebase();
  const db = firebase.firestore();

  const duplicate = false;

  const [shopifyFulfillmentPromise, customerPromise, vendSalePromise, vendShippingItemPromise, lineItemPromise] = await Promise.allSettled(
    [
      fetchShopifyFulfillmentOrdersById(body.id),
      fetchVendCustomerByEmail(body.email),
      fetchVendSaleByInvoiceId(body.order_number),
      fetchVendProductByHandle(body.shipping_lines[0]?.code.replace(/\s/gi, "")
        || "courier-door-to-door-delivery-economy"),
      fetchVendAllProductsBySku(body),
    ],
  );

  if (shopifyFulfillmentPromise.status === "rejected"
    || customerPromise.status === "rejected"
    || vendShippingItemPromise.status === "rejected"
    || lineItemPromise.status === "rejected"
    || vendSalePromise.status === "rejected") {
    console.log(shopifyFulfillmentPromise.status, "shopifyOrderDetails.status");
    console.log(customerPromise.status, "customer.status");
    console.log(lineItemPromise.status, "sales.status");
    res.status(200).json({ name: "John Doe2" });
    return;
  }

  const hasJHBLineItems = shopifyFulfillmentPromise.value.data.fulfillment_orders.some(({ assigned_location_id }) => {
    return `${assigned_location_id}` === SHOPIFY_JHB_OUTLET_ID;
  });

  if (!hasJHBLineItems) {
    res.status(200).json("All Line Items are CPT");
    return;
  }

  /**
   *  If Order already exists - EXIT (TODO: in future change to edit base don fulfillment changes) */
  const vendOrder = vendSalePromise.value?.data?.data?.find(({ source_id }) => +source_id === body.id);
  let order;
  if (vendOrder) {
    console.log("Order Already exists");
    order = (await fetchVendOrderById(vendOrder.id))?.data?.register_sales[0];
    res.status(200).json("Order Already exists");
    return;
  }

  /**
   *  If Customer already exists - Yay, if not, need to create */
  const oldCustomer = customerPromise.value.data.customers.find(({ email }) => body.email);
  let newCustomer;
  if (!oldCustomer) {
    const [newCustomerPromise] = await Promise.allSettled([postNewVendCustomer(body)]);
    if (newCustomerPromise.status !== "fulfilled") {
      res.status(200).json("Could not Create Customer - Error");
      return;
    }
    newCustomer = newCustomerPromise?.value?.data?.customer;
  }
  const customer = oldCustomer ?? newCustomer;

  const orderResult = await postNewVendOrder(body,
    lineItemPromise.value,
    vendShippingItemPromise.value,
    customer,
    shopifyFulfillmentPromise.value,
    order);

  const config = postNewVendOrderReturnConfig(body,
    lineItemPromise.value,
    vendShippingItemPromise.value,
    customer,
    shopifyFulfillmentPromise.value,
    order);
  console.log(orderResult?.data);

  await db.collection("testing")
    .doc()
    .set({
      created_at_ISO: new Date(Date.now()).toISOString().split(".")[0].split("T").join(" ").replace(/-/gi, "/"),
      body: JSON.stringify(body),
      body2: JSON.stringify(shopifyFulfillmentPromise.value.data.fulfillment_orders),
      body3: JSON.stringify(orderResult?.data),
      orderConfig: JSON.stringify(config),
    });

  res.status(200).json({ name: "John Doe" });
};

export default ProductUpdateShopifyCounter;
