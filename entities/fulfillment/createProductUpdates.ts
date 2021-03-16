import { vendProduct } from "../product/vendFetchProducts";
import { FulfillmentWebhookRequestBody } from "./shopifyFulfillmentCreateWebhook";
import { vendFulfillmentSale } from "./vendFetchPickListBySaleId";

const {
  SHOPIFY_CPT_OUTLET_ID,
  SHOPIFY_JHB_OUTLET_ID,
  SHOPIFY_CPTWH_OUTLET_ID,
  VEND_CPT_OUTLET_ID,
  VEND_JHB_OUTLET_ID,
  VEND_CPTWH_OUTLET_ID,
} = process.env;

export const createProductUpdates = (
  shopify: FulfillmentWebhookRequestBody & { vend_location_id?: string },
  vendFulfillmentList: vendFulfillmentSale,
  vendProducts: vendProduct[]
) => {
  shopify.vend_location_id =
    shopify.location_id === +SHOPIFY_CPT_OUTLET_ID
      ? VEND_CPT_OUTLET_ID
      : shopify.location_id === +SHOPIFY_JHB_OUTLET_ID
      ? VEND_JHB_OUTLET_ID
      : shopify.location_id === +SHOPIFY_CPTWH_OUTLET_ID
      ? VEND_CPTWH_OUTLET_ID
      : "";

  const vend: {
    quantity: number;
    outlet_id: string;
    product_id: string;
    source_variant_id: string | number;
    id: string;
    source_id: string | number;
    sku: string;
    outlet: string;
    status: string;
  }[] = [
    ...vendFulfillmentList.fulfillments.reduce((acc, fulfillment) => {
      return [
        ...acc,
        ...fulfillment?.lineItems?.map(lineItem => {
          return {
            id: fulfillment.id,
            product_id: lineItem.product.id,
            sku: lineItem.product.sku,
            quantity: lineItem.quantity,
            source_id: lineItem.product.sourceID,
            source_variant_id: lineItem.product.sourceVariantID,
            outlet: fulfillment.outlet.name,
            outlet_id: fulfillment.outlet.id,
            status: fulfillment.status,
          };
        }),
      ];
    }, []),
    ...vendFulfillmentList.picklists.reduce((acc, picklist) => {
      return [
        ...acc,
        ...picklist?.lineItems?.map(lineItem => {
          return {
            id: picklist.id,
            product_id: lineItem.saleLineItem.product.id,
            sku: lineItem.saleLineItem.product.sku,
            quantity: lineItem.pickedQuantity,
            source_id: lineItem.saleLineItem.product.sourceID,
            source_variant_id: lineItem.saleLineItem.product.sourceVariantID,
            outlet: picklist.outlet.name,
            outlet_id: picklist.outlet.id,
            status: picklist.state,
          };
        }),
      ];
    }, []),
  ];

  const resultArray = [];

  shopify.line_items.forEach(({ variant_id, quantity, sku }) => {
    let fulfillmentMatch = [vend.find(fulfillment => fulfillment.sku === sku && +fulfillment.quantity === quantity)];

    if (fulfillmentMatch[0] === undefined) {
      fulfillmentMatch = findFulfillment(sku, quantity, vend);
    }

    fulfillmentMatch.forEach(({ outlet_id: fulfillment_outlet_id, quantity: vendQuantity, product_id }) => {
      if (quantity < 1) return;
      if (shopify.vend_location_id === fulfillment_outlet_id) {
        quantity = quantity - +vendQuantity;
        console.log(shopify.vend_location_id, "all correct - no change needed here");
        return;
      }

      const { id, inventory } = vendProducts.find(({ id }) => product_id === id);
      console.log(JSON.stringify({ id, inventory }));
      resultArray.push({
        id,
        inventory: inventory?.map(({ outlet_id, count, ...rest }) => {
          return {
            ...rest,
            outlet_id,
            count:
              outlet_id === fulfillment_outlet_id
                ? +count + +quantity
                : outlet_id === shopify.vend_location_id
                ? +count - +quantity
                : +count,
          };
        }),
      });
    });
    console.log(fulfillmentMatch);
    console.log(JSON.stringify(resultArray));
  });
  return {};
};

function findFulfillment(sku, quantity, vend, returnArray = []) {
  if (vend.findIndex(fulfillment => fulfillment.sku === sku) !== undefined) {
    const index = vend.findIndex(fulfillment => fulfillment.sku === sku);
    console.log(index);
    const [found] = vend.splice(index, 1);
    quantity = quantity - +found.quantity;
    returnArray.push(found);
    if (quantity > 0 && vend.findIndex(fulfillment => fulfillment.sku === sku)) {
      return findFulfillment(sku, quantity, vend, returnArray);
    }
    return returnArray;
  }
  console.log(returnArray);
}
