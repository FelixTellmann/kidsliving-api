import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { id, name } = req.query;

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  const response = await axios({
    method: "get",
    url: `https://maps.googleapis.com/maps/api/place/details/json?reference=ChIJ_8R_b09czB0RszEq5W8tTls&key=AIzaSyDVIMagdRaKg3l2-3DrLkr01kFBP9mPOSU`,
  });

  console.log(response);
  res.status(200).json(response?.data?.result);
};
