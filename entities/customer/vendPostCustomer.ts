import { fetchVend } from "../../utils/fetch";
import { OrderWebhookRequestBody } from "../order/shopifyOrderCreateWebhook";
import { Customer } from "./vendFetchCustomer";

interface IPostCustomer {
  first_name: string,
  last_name: string,
  customer_code?: string,
  customer_group_id?: string,
  enable_loyalty?: boolean,
  email: string,
  note?: string,
  gender?: string,
  date_of_birth?: string,
  company_name?: string,
  do_not_email?: boolean,
  phone?: string,
  mobile?: string,
  fax?: string,
  twitter?: string,
  website?: string,
  physical_address1?: string,
  physical_address2?: string,
  physical_suburb?: string,
  physical_city?: string,
  physical_postcode?: string,
  physical_state?: string,
  physical_country_id?: string,
  postal_address1?: string,
  postal_address2?: string,
  postal_suburb?: string,
  postal_city?: string,
  postal_postcode?: string,
  postal_state?: string,
  postal_country_id?: string,
  custom_field_1?: string,
  custom_field_2?: string,
  custom_field_3?: string,
  custom_field_4?: string
}

export type vendPostCustomer = {
  data: {
    customer: Customer
  }
};

type IPostNewVendCustomerWithBody = (body: OrderWebhookRequestBody) => Promise<vendPostCustomer>;

export const postNewVendCustomer: IPostNewVendCustomerWithBody = (body) => {
  const customerConfig: IPostCustomer = {
    first_name: body?.customer?.first_name ?? "",
    last_name: body?.customer?.last_name ?? "",
    email: body?.email,
    physical_address1: body?.billing_address?.address1 ?? "",
    physical_address2: body?.billing_address?.address2 ?? "",
    physical_suburb: body?.billing_address?.city ?? "",
    physical_city: body?.billing_address?.zip ?? "",
    physical_postcode: body?.billing_address?.zip ?? "",
    physical_state: body?.billing_address?.province ?? "",
    physical_country_id: body?.billing_address?.province_code ?? "",
    postal_address1: body?.shipping_address?.address1 ?? "",
    postal_address2: body?.shipping_address?.address2 ?? "",
    postal_suburb: body?.shipping_address?.city ?? "",
    postal_city: body?.shipping_address?.zip ?? "",
    postal_postcode: body?.shipping_address?.zip ?? "",
    postal_state: body?.shipping_address?.province ?? "",
    postal_country_id: body?.shipping_address?.province_code ?? "",
    phone: body?.customer?.default_address.phone ?? "",
  };
  return fetchVend(`/customers`, "POST", customerConfig);
};
