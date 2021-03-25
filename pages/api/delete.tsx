import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { fetchShopifyProductByProductId } from "../../entities/product/shopifyFetchProducts";
import { fetchVendProductByHandle } from "../../entities/product/vendFetchProducts";
import { loadFirebase } from "../../lib/db";
import { fetchShopify, fetchShopifyGQL, fetchVend } from "../../utils/fetch";
import { getDifferences, simplifyProducts } from "../../utils/products";

const test = query =>
  axios({
    method: "get",
    url: `https://www.instagram.com/graphql/query/${query}`,
  });

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { body } = req;
  try {
    const result = await test(body.query);
    res.status(200).json(JSON.stringify(result.data.data));
  } catch (err) {
    console.log(err.message);
  }

  res.status(200).json("end");
};
