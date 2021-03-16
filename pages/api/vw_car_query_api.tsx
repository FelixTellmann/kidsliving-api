import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "json2csv";
import fs from "fs";

type VwCarQueryApiData = {
  name?: string;
};

export const VwCarQueryApi = async (req: NextApiRequest, res: NextApiResponse<VwCarQueryApiData>): Promise<void> => {
  const { year_start = "1990", year_end = "2019", make = "ford" } = req.query;

  const getData = async (year, make) => {
    return await axios({
      method: "GET",
      url: `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&year=${year}&make=${make}`,
    });
  };

  let result = [];

  for (let i = +year_start; i <= +year_end; i++) {
    const data = await getData(i, make);
    result = [...result, ...JSON.parse(data.data.replace(`?({"Trims":`, "").replace(`}]});`, `}]`))];
  }

  fs.writeFile("cars2.csv", parse(result), err => {
    if (err) throw err;
    console.log("cars file saved");
  });

  res.status(200).json({ name: "John Doe" });
};

export default VwCarQueryApi;
