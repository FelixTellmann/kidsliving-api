import axios, { AxiosPromise } from "axios";

const { VEND_API, SHOPIFY_API_KEY, SHOPIFY_API_PASSWORD, SHOPIFY_API_STORE, SHOPIFY_API_VERSION } = process.env;

type fetchProps = (
  api: string,
  method?: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown | string
) => AxiosPromise;

export const fetchVend: fetchProps = (api, method = "GET", body = {}) => {
  const config = {
    method,
    url: `https://kidsliving.vendhq.com/api/${api}`,
    headers: {
      Authorization: `Bearer ${VEND_API}`,
      "Content-Type": "application/json",
    },
    data: method !== "GET" ? typeof body === "string" ? body : JSON.stringify(body) : undefined,
  };

  return axios(config);
};

export const fetchShopify: fetchProps = (api, method = "GET", body = {}) => {
  const config = {
    method,
    url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_API_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/${api}`,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    data: method !== "GET" ? typeof body === "string" ? body : JSON.stringify(body) : undefined,
  };

  return axios(config);
};

export const fetchShopifyGQL = (gql: string): AxiosPromise => {
  return axios({
    method: "POST",
    url: `https://${SHOPIFY_API_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    headers: {
      Accept: "application/graphql",
      "Content-Type": "application/graphql",
      "X-Shopify-Access-Token": SHOPIFY_API_PASSWORD,
    },
    data: gql,
  });
};
