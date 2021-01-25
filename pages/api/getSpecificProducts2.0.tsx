import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

type ProductData = unknown[]


const productIds = [
  "02dcd191-ae62-11e6-edd8-e17944c70e9b",
  "02dcd191-ae62-11e6-f485-c5f02317eb1f",
  "02dcd191-ae62-11e6-f485-c5f02bb523d1",
  "02dcd191-ae62-11e7-edd8-147fe864a1f9",
  "25063cc5-6582-f119-71e9-175a6ef9dce2",
  "30f6b238-fba7-2cc5-8307-418f179c2ef8",
  "027e8bf1-484e-8a3a-f2df-0a11267ceb17",
  "0e43e970-379b-1948-d3c2-2ac7b58e380b",
  "64be4268-bfc7-3b5b-d924-7f96ba2eee75",
  "22168ec9-2dfd-7c74-42c1-656288933930",
  "3e2e58e8-f111-0182-736c-a0771b68d273",
  "2928a6f1-9d4d-01b7-5cf0-6ddc56790581",
  "3e09e895-b960-991a-4321-15075229b18c",
  "9475aafb-262a-d308-4d01-c4803a4eb49a",
  "02dcd191-ae62-11e7-edd8-19264e340193",
  "44964bf9-1ca9-3b4e-09d1-5a0fcde37bda",
  "9629af06-d3a6-4842-d36f-efbe3109e8a8",
  "b782bc47-a958-0f0d-f2fb-fb942372dfc1",
  "4aaca8b2-847d-15ee-1baa-3f72443a3fa3",
  "19610f95-4574-0289-adb9-bd56a608536c",
  "d4ffc2b4-4f39-29ee-da68-6997a9896798",
  "ed8cec24-6677-9714-e38c-804058422fc2",
  "f12378c8-dbfd-63d3-5f55-cd7a64bbf663",
  "ee91d699-40e2-d762-7bdb-aa87160839fc",
  "c63281ca-ee1b-d9d2-0a1d-e0bfa36809cf",
  "a9fd67b6-855b-6f76-0b93-14575daa9890",
  "c5489e14-2849-f555-bd06-3393dd7de102",
  "02dcd191-ae62-11e6-f485-4cbc597e5049"
]

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  
  const getSingleProduct = async (id: string): Promise<unknown> => {
    try {
      const response = await axios({
        method: "get",
        url: `https://kidsliving.vendhq.com/api/2.0/products/${id}`,
        headers: {
          "Accept": "application/json",
          "Authorization": "Bearer 5OtjwgBqfHJZh1Ed36qBb_JUDDKnjwlAJ7l8fBmg",
          "Content-Type": "application/json",
          "Cookie": "rguserid=b2b95383-16dd-4132-a3d2-f53bdec946bb; rguuid=true; rgisanonymous=true"
        }
      });
      
      return response.data.data
      
    } catch ({ response }) {
      const { config } = response;
      return config
    }
    
  };
  
  const products: ProductData = []
  
  for (let i = 0; i < productIds.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    products.push(await getSingleProduct(productIds[i]))
    console.log(i)
  }
  
  
  res.status(200).json(products);
}
