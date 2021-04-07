import { shopifyDateToVendDate } from "utils";
import { fetchVend } from "utils/fetch";
import { Customer } from "../customer/vendFetchCustomer";
import { vendFetchProducts, vendProduct } from "../product/vendFetchProducts";
import { fulfillmentOrder, shopifyFetchFulfillmentOrder } from "./shopifyFetchOrder";
import { OrderWebhookRequestBody } from "./shopifyOrderCreateWebhook";
import { registerSale, vendFetchOrder } from "./vendFetchOrder";

const {
  VEND_USER_SALE_ID,
  VEND_REGISTER_CPT_TILL2_ID,
  VEND_REGISTER_JHB_TILL2_ID,
  VEND_TAX_ID,
  VEND_NO_TAX_ID,
  VEND_PAYMENT_EFT_ID,
  VEND_PAYMENT_CC_ID,
  SHOPIFY_CPT_OUTLET_ID,
} = process.env;

interface IPostOrder {
  id?: string;
  source: "SHOPIFY";
  source_id: string;
  register_id: "02dcd191-ae2b-11e6-f485-4cb68690ad06" | string;
  market_id?: string;
  customer_id?: string;
  user_id?: "02dcd191-ae2b-11e6-f485-4cb686916cb9" | string;
  user_name?: string;
  sale_date?: string;
  created_at?: string;
  updated_at?: string;
  total_price?: number;
  total_cost?: number;
  total_tax?: number;
  tax_name?: string;
  note?: string;
  status: "AWAITING_DISPATCH" | "DISPATCHED_CLOSED" | "VOIDED";
  short_code?: string;
  invoice_number: string;
  accounts_transaction_id?: string;
  return_for?: string;
  register_sale_products: {
    id?: string;
    product_id: string;
    register_id?: "02dcd191-ae2b-11e6-f485-4cb68690ad06" | "02dcd191-ae62-11e8-ed44-1e3728580fcd" | string;
    sequence?: string;
    handle?: string;
    sku?: string;
    name?: string;
    quantity?: number;
    price?: number;
    cost?: number;
    price_set?: number;
    discount?: number;
    loyalty_value?: number;
    tax?: number;
    tax_id?: string;
    tax_name?: string;
    tax_rate?: number;
    tax_total?: number;
    price_total?: number;
    display_retail_price_tax_inclusive?: string;
    status?: string;
    attributes?: {
      name?: string;
      value?: string;
    }[];
  }[];
  register_sale_payments: {
    id?: string;
    payment_type_id?: string;
    register_id?: string;
    retailer_payment_type_id?: string;
    name?: string;
    label?: string;
    payment_date?: string;
    amount?: number;
  }[];
}

type vendPostOrder = {
  data: {
    register_sale: registerSale;
  };
};

type IPostNewVendOrder = (
  shopifyOrderWebhook: OrderWebhookRequestBody,
  vendProducts: PromiseSettledResult<vendFetchProducts>[],
  vendShippingProduct: vendFetchProducts,
  vendCustomer: Customer,
  fulfillmentOrders: shopifyFetchFulfillmentOrder,
  vendOrder?: vendFetchOrder
) => Promise<vendPostOrder>;

export const postNewVendOrder: IPostNewVendOrder = (
  shopifyOrderWebhook,
  vendProducts,
  vendShippingProduct,
  vendCustomer,
  fulfillmentOrders,
  vendOrder
) => {
  const shippingLineItems = vendShippingProduct.data.products.reduce((acc, product, index) => {
    if (index > 0) return acc;
    acc.push({
      product_id: product.id,
      register_id: VEND_REGISTER_CPT_TILL2_ID,
      quantity: 1,
      price: +Math.round(+shopifyOrderWebhook.shipping_lines[0].discounted_price / 1.15).toPrecision(2),
      tax: +Math.round((+shopifyOrderWebhook.shipping_lines[0].discounted_price / 1.15) * 0.15).toPrecision(2),
      tax_id: VEND_TAX_ID,
      tax_rate: 0.15,
      tax_name: "VAT",
      status: "CONFIRMED",
    });
    return acc;
  }, []);

  const orderConfig: IPostOrder = {
    source: "SHOPIFY",
    source_id: `${shopifyOrderWebhook.id}`,
    register_id: VEND_REGISTER_CPT_TILL2_ID,
    status: shopifyOrderWebhook.fulfillment_status === "fufilled" ? "DISPATCHED_CLOSED" : "AWAITING_DISPATCH",
    invoice_number: `${shopifyOrderWebhook.order_number}`,
    note: shopifyOrderWebhook.note,
    user_id: VEND_USER_SALE_ID,
    customer_id: vendCustomer.id,
    register_sale_products: [
      ...shopifyOrderWebhook.line_items.map(line_item => {
        const vendProduct = vendProducts.reduce((acc, vendProduct) => {
          if (vendProduct.status !== "fulfilled") return acc;
          if (+vendProduct.value.data.products[0].variant_source_id.replace(/_unpub/gi, "") === line_item.variant_id) {
            acc = { ...vendProduct.value.data.products[0] };
          }
          return acc;
        }, {} as vendProduct);

        const matchingFulfillment =
          fulfillmentOrders.data.fulfillment_orders.find(fulfillmentOrder => {
            return (
              fulfillmentOrder.status === "open" &&
              fulfillmentOrder.line_items.some(({ line_item_id }) => line_item.id === line_item_id)
            );
          }) ??
          fulfillmentOrders.data.fulfillment_orders.reduce((acc, fulfillmentOrder) => {
            if (fulfillmentOrder.line_items.some(({ line_item_id }) => line_item.id === line_item_id)) {
              /* FIXME: Hacky way to find last item in array.... */
              acc = { ...fulfillmentOrder };
            }
            return acc;
          }, {} as fulfillmentOrder);

        const totalDiscountPerLineItem = line_item.discount_allocations.reduce((acc, { amount }) => {
          return (acc += parseFloat(amount));
        }, 0);

        const price = +line_item.price - totalDiscountPerLineItem / line_item.quantity;

        return {
          product_id: vendProduct.id,
          register_id:
            `${matchingFulfillment.assigned_location_id}` === SHOPIFY_CPT_OUTLET_ID
              ? VEND_REGISTER_CPT_TILL2_ID
              : VEND_REGISTER_JHB_TILL2_ID,
          quantity: line_item.quantity,
          price: line_item.taxable ? +Math.round(+price / 1.15).toPrecision(2) : +price,
          discount: totalDiscountPerLineItem / line_item.quantity || undefined,
          tax: line_item.taxable ? +Math.round((+price / 1.15) * 0.15).toPrecision(2) : 0.0,
          tax_id: line_item.taxable ? VEND_TAX_ID : VEND_NO_TAX_ID,
          tax_rate: line_item.taxable ? 0.15 : 0,
          tax_name: line_item.taxable ? "VAT" : "No Tax",
          status: "CONFIRMED",
        };
      }),
      ...shippingLineItems,
    ],
    register_sale_payments:
      shopifyOrderWebhook.financial_status === "paid"
        ? [
            {
              retailer_payment_type_id: shopifyOrderWebhook.gateway === "paygate" ? VEND_PAYMENT_CC_ID : VEND_PAYMENT_EFT_ID,
              amount: +shopifyOrderWebhook.total_price,
              register_id: VEND_REGISTER_CPT_TILL2_ID,
              payment_date: shopifyDateToVendDate(shopifyOrderWebhook.processed_at),
            },
          ]
        : [],
  };

  return fetchVend(`/register_sales`, "POST", orderConfig);
};

export const postUpdateVendOrder: IPostNewVendOrder = body => {
  return fetchVend(`/register_sales`, "POST", body);
};
