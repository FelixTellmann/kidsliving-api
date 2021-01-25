import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  res.status(200).json([])
  /*const { retailer_id } = req.body
  console.log(req.body.payload)
  const payload = JSON.parse(req.body.payload)
  console.log(payload)
  if (retailer_id === process.env.VEND_RETAILER_ID) {
    try {
  
  
      res.status(200).json([])
    } catch (err) {
      console.log(err.response.data)
    }
  } else {
    res.status(401).json([]);
  }
  res.status(200).json([])*/
}
