import { fetchVend } from "utils/fetch";

export type Customer = {
  id: string,
  name: string | null,
  customer_code: string | null,
  customer_group_id: string | null,
  customer_group_ids: string[],
  customer_group_name: string | null,
  first_name: string | null,
  last_name: string | null,
  company_name: string | null,
  phone: string | null,
  mobile: string | null,
  fax: string | null,
  email: string | null,
  do_not_email: string | null,
  twitter: string | null,
  website: string | null,
  physical_address1: string | null,
  physical_address2: string | null,
  physical_suburb: string | null,
  physical_city: string | null,
  physical_postcode: string | null,
  physical_state: string | null,
  physical_country_id: string | null,
  postal_address1: string | null,
  postal_address2: string | null,
  postal_suburb: string | null,
  postal_city: string | null,
  postal_postcode: string | null,
  postal_state: string | null,
  postal_country_id: string | null,
  updated_at: string | null,
  deleted_at: string | null,
  balance: string | null,
  year_to_date: string | null,
  date_of_birth: string | null,
  sex: string | null,
  custom_field_1: string | null,
  custom_field_2: string | null,
  custom_field_3: string | null,
  custom_field_4: string | null,
  note: string | null,
  contact: {
    company_name: string | null,
    phone: string | null,
    email: string | null,
  }
};

export type vendFetchCustomer = {
  data: {
    customers: Customer[]
  }
};

type IFetchVendCustomerByEmail = (email: string) => Promise<vendFetchCustomer>;

export const fetchVendCustomerByEmail: IFetchVendCustomerByEmail = (email) => {
  return fetchVend(`customers?email=${email}`);
};
