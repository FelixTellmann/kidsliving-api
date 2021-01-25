import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { retailer_id } = req.body
  const payload = JSON.parse(req.body.payload)
  console.log(req.body.payload)
  if (retailer_id === process.env.VEND_RETAILER_ID) {
    try {
  
  
      res.status(200).json('success')
    } catch (err) {
      console.log(err.response)
    }
  } else {
    res.status(401).json('error');
  }
}
