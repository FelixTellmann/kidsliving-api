import { fetchVend } from "utils/fetch";

export type vendFetchOrder = {
  data: {
    "register_sales": {
      "id": string | null
      "source": string | null
      "source_id": string | null
      "register_id": string | null
      "market_id": string | null
      "customer_name": string | null
      "customer": {
        "id": string | null
        "name": string | null
        "customer_code": string | null
        "customer_group_id": string | null
        "customer_group_name": string | null
        "first_name": string | null
        "last_name": string | null
        "company_name": string | null
        "phone": string | null
        "mobile": string | null
        "fax": string | null
        "email": string | null
        "do_not_email": string | null
        "twitter": string | null
        "website": string | null
        "physical_address1": string | null
        "physical_address2": string | null
        "physical_suburb": string | null
        "physical_city": string | null
        "physical_postcode": string | null
        "physical_state": string | null
        "physical_country_id": string | null
        "postal_address1": string | null
        "postal_address2": string | null
        "postal_suburb": string | null
        "postal_city": string | null
        "postal_postcode": string | null
        "postal_state": string | null
        "postal_country_id": string | null
        "updated_at": string | null
        "deleted_at": string | null
        "balance": string | null
        "year_to_date": string | null
        "date_of_birth": string | null
        "sex": string | null
        "note": string | null
        "contact": {
          "company_name": string | null
          "phone": string | null
          "email": string | null
        },
        "custom_field_1": string | null
        "custom_field_2": string | null
        "custom_field_3": string | null
        "custom_field_4": string | null
      },
      "user_id": string | null
      "user_name": string | null
      "sale_date": string | null
      "created_at": string | null
      "updated_at": string | null
      "total_price": number
      "total_cost": number
      "total_tax": number
      "note": string | null
      "status": string | null
      "short_code": string | null
      "invoice_number": string | null
      "accounts_transaction_id": string | null
      "return_for": string | null
      "register_sale_products"?: {
        "id": string | null
        "product_id": string | null
        "register_id": string | null
        "sequence": string | null
        "handle": string | null
        "sku": string | null
        "name": string | null
        "quantity": number
        "price": number
        "cost": number
        "price_set": number
        "discount": number
        "loyalty_value": number
        "tax": number
        "tax_id": string | null
        "tax_name": string | null
        "tax_rate": number
        "tax_total": number
        "price_total": number
        "display_retail_price_tax_inclusive": string | null
        "status": string | null
        "attributes": [
          {
            "name": string | null
            "value": string | null
          },
        ]
      }[]
      "register_sale_payments"?: {
        "id": string | null
        "register_id": string | null
        "retailer_payment_type_id": string | null
        "payment_type_id": string | null
        "name": string | null
        "label": string | null
        "payment_date": string | null
        "amount": number
      }[]
      "customer_id": string | null
      "taxes"?: {
        "tax": number
        "name": string | null
        "rate": number
        "id": string | null
      }[]
      "totals": {
        "total_tax": number
        "total_price": number
        "total_payment": number
        "total_to_pay": number
      },
      "tax_name": string | null
    }[]

  }
};

type IFetchVendOrderById = (sale_id: string) => Promise<vendFetchOrder>;

export const fetchVendOrderById: IFetchVendOrderById = (sale_id) => {
  return fetchVend(`/register_sales/${sale_id}`);
};
