const handler = async _ => {
  console.log("wems!");

  return {
    statusCode: 200,
    //  Uncomment below to enable CORS requests
    //  headers: {
    //      "Access-Control-Allow-Origin": "*",
    //      "Access-Control-Allow-Headers": "*"
    //  },
    body: JSON.stringify("Hello from Lambda!"),
  };
};

exports.handler = handler;

export default async (req, res) => {
  await handler("");
  res.status(200).json("Success");
};
