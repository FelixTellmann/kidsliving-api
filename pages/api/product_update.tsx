import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    console.log(req.body)
  try {
  
  } catch (err) {
    console.log(err.response.data)
  }
  
  res.status(200).json('success');
}
