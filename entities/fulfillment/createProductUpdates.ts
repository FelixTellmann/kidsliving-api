import { shopifyFulfillment } from "entities/order/shopifyFetchOrder";
import { registerSale, vendFetchOrder } from "entities/order/vendFetchOrder";
import { vendProduct } from "../product/vendFetchProducts";
import { FulfillmentWebhookRequestBody } from "./shopifyFulfillmentCreateWebhook";
import { vendFulfillmentSale } from "./vendFetchPickListBySaleId";

export const createProductUpdates = (shopify: shopifyFulfillment[], vendProducts: vendProduct[]) => {
  const resultArray = [];
  /* WTF IS GOING ON HERE??? */

  shopify.forEach(fulfillment => {
    if (`${fulfillment.location_id}` !== process.env.SHOPIFY_JHB_OUTLET_ID) return;

    fulfillment.line_items.forEach(product => {
      const { id, inventory } = vendProducts.find(
        p => p.sku === product.sku || p.variant_source_id === `${product.variant_id}`
      );
      resultArray.push({
        id,
        inventory: inventory?.map(({ outlet_id, count, ...rest }) => {
          if (outlet_id === process.env.VEND_JHB_OUTLET_ID) {
            count = `${+count - +product.quantity}`;
            console.log("VEND_JHB_OUTLET_ID");
          }
          if (outlet_id === process.env.VEND_CPT_OUTLET_ID) {
            console.log("VEND_CPT_OUTLET_ID");
            count = `${+count + +product.quantity}`;
          }
          return {
            ...rest,
            outlet_id,
            count,
          };
        }),
      });
    });
  });

  return resultArray;
};
