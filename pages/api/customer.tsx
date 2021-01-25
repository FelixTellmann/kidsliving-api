import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  
  const { SHOPIFY_API_KEY, SHOPIFY_API_PASSWORD, SHOPIFY_API_STORE, SHOPIFY_API_VERSION, VEND_RETAILER_ID } = process.env;
  
  test
  
  function searchShopifyCustomersViaEmail(email) {
    return axios({
      method: "get",
      url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_API_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${email}`,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
  }
  
  function createCustomer({ first_name, last_name, email, phone, do_not_email }) {
    const payload = {
      "customer": {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "tags": "Vend Auto Import",
        "accepts_marketing": true
      }
    };
    
    console.log(payload);
    return axios({
      method: "POST",
      url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_API_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers`,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      data: JSON.stringify(payload)
    });
  }
  
  try {
    if (req.body.retailer_id === VEND_RETAILER_ID) {
      console.log(JSON.parse(req.body.payload).email);
      console.log((await searchShopifyCustomersViaEmail(JSON.parse(req.body.payload).email)).data.customers.length);
      if ((await searchShopifyCustomersViaEmail(JSON.parse(req.body.payload).email)).data.customers.length === 0) {
        await createCustomer({ ...JSON.parse(req.body.payload) });
      }
    }
    res.status(200).send("success");
  } catch (err) {
    res.status(500).send("Internal Server Error - Could not save");
  }
}
