import chalk from "chalk";
import { fetchVendConsignments, vendConsignment } from "entities/consignment/vendFetchConsignments";
import {
  fetchVendConsignmentProductsById,
  vendConsignmentProduct,
} from "entities/consignmentProducts/vendFetchConsignmentProducts";
import { fetchVendProducts, vendProduct, vendProductInput } from "entities/product/vendFetchProducts";
import { isSameTags } from "utils";

async function getAllVendProducts() {
  const [initialRequest] = await Promise.allSettled([fetchVendProducts()]);

  if (initialRequest.status !== "fulfilled") return [];

  console.log(initialRequest.value.data.pagination);
  const pages = initialRequest.value.data.pagination?.pages ?? 1;

  if (pages === 1) return initialRequest.value.data.products ?? [];

  const pagesToFetch = [];
  for (let i = 2; i <= pages; i++) {
    pagesToFetch.push(fetchVendProducts(i));
  }

  const pageRequests = await Promise.allSettled(pagesToFetch);

  return pageRequests.reduce((acc, pageRequest) => {
    if (pageRequest.status !== "fulfilled") return acc;
    return [...acc, ...pageRequest.value.data.products];
  }, initialRequest.value.data.products);
}

async function getAllVendConsignments(monthsAgo = 5) {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const fiveMonthAgo = date.toISOString().split("T")[0];
  const [initialRequest] = await Promise.allSettled([fetchVendConsignments(fiveMonthAgo)]);

  if (initialRequest.status !== "fulfilled") return [];

  console.log(initialRequest.value.data.pagination);
  const pages = initialRequest.value.data.pagination?.pages ?? 1;

  if (pages === 1) return initialRequest.value.data.consignments ?? [];

  const pagesToFetch = [];
  for (let i = 2; i <= pages; i++) {
    pagesToFetch.push(fetchVendConsignments(fiveMonthAgo, i));
  }

  const pageRequests = await Promise.allSettled(pagesToFetch);

  return pageRequests.reduce((acc, pageRequest) => {
    if (pageRequest.status !== "fulfilled") return acc;
    return [...acc, ...pageRequest.value.data.consignments];
  }, initialRequest.value.data.consignments);
}

async function getAllVendConsignmentProducts(id: string): Promise<vendConsignmentProduct[]> {
  const [initialRequest] = await Promise.allSettled([fetchVendConsignmentProductsById(id)]);

  if (initialRequest.status !== "fulfilled") return [];

  const pages = initialRequest.value.data.pagination?.pages ?? 1;

  if (pages === 1) return initialRequest.value.data.consignment_products ?? [];

  const pagesToFetch = [];
  for (let i = 2; i <= pages; i++) {
    pagesToFetch.push(fetchVendConsignmentProductsById(id, i));
  }

  const pageRequests = await Promise.allSettled(pagesToFetch);

  return pageRequests.reduce((acc, pageRequest) => {
    if (pageRequest.status !== "fulfilled") return acc;
    return [...acc, ...pageRequest.value.data.consignments];
  }, initialRequest.value.data.consignment_products);
}

const handler = async _ => {
  const startTime = Date.now();
  console.log(Date.now() - startTime + "ms");

  console.log(chalk.green(`1. Setup Amplify auto create functions & include API keys for env variables - done`));

  console.log(chalk.green(`2. Load all Consignments  from Vend - Log Pagination:`));
  console.log(chalk.green(`3. Load all Products from Vend - Log Pagination:`));
  const [vendConsignmentsRequest, vendProductsRequest] = await Promise.allSettled([
    getAllVendConsignments(5),
    getAllVendProducts(),
  ]);

  if (vendConsignmentsRequest.status !== "fulfilled" || vendProductsRequest.status !== "fulfilled") {
    return {
      statusCode: 50,
      body: JSON.stringify("Server Error"),
    };
  }

  const vendConsignments: vendConsignment[] = vendConsignmentsRequest.value.filter(
    ({ status, type }) => status === "OPEN" && type === "SUPPLIER"
  );

  const vendProducts = vendProductsRequest.value;

  console.log(vendConsignments[6]);
  console.log(chalk.green(`4. Load all consignment Products`));
  const consignmentProductsRequests = await Promise.allSettled(
    vendConsignments.map(({ id }) => getAllVendConsignmentProducts(id))
  );
  const consignmentProducts: vendConsignmentProduct[] = consignmentProductsRequests.reduce((acc, consignmentProduct) => {
    if (consignmentProduct.status === "rejected") return acc;
    return [...acc, ...consignmentProduct.value];
  }, []);

  console.log(consignmentProducts[0], consignmentProducts.length);

  console.log(chalk.gray(`4. Update Products based on Criteria - i.e. not on shopify - but is on Shopify - FX tags`));

  console.log(consignmentProducts[0]);
  const data = consignmentProducts.reduce(
    (acc, consignmentProduct) => {
      const vendProduct = vendProducts.find(({ id }) => id === consignmentProduct.product_id);
      const vendConsignment = vendConsignments.find(({ id }) => id === consignmentProduct.consignment_id);

      if (!vendProduct) return acc;
      acc.counter++;

      if (!vendProduct.source_id || !vendProduct.variant_source_id || vendProduct.source_id.includes("unpub")) return acc;
      acc.onShopify++;

      const container = vendConsignment.name.toLowerCase().includes("container");
      const expectedDate = vendConsignment.name
        .toLowerCase()
        .replace(/(container|preorder)/gi, "")
        .trim();
      const preorder = vendConsignment.name.toLowerCase().includes("preorder");
      preorder && acc.preorder++;

      if (acc[consignmentProduct.product_id]) {
        acc[consignmentProduct.product_id].consignments.push({
          name: vendConsignment.name,
          quantity: consignmentProduct.count,
          expectedDate,
        });
        acc[consignmentProduct.product_id].preorder = acc[consignmentProduct.product_id].preorder || preorder;
        acc[consignmentProduct.product_id].container = acc[consignmentProduct.product_id].container || container;
        return acc;
      }

      acc[consignmentProduct.product_id] = {
        product_id: vendProduct.source_id,
        variant_id: vendProduct.variant_source_id,
        tags: vendProduct.tags,
        consignments: [{ name: vendConsignment.name, quantity: consignmentProduct.count, expectedDate }],
        preorder,
        container,
      };

      return acc;
    },
    { counter: 0, onShopify: 0, preorder: 0 }
  );

  /* const promiseArray = [[]];
  for (let i = 0; i < updateRequests.length; i += 50) {
    promiseArray.push(updateRequests.slice(i, i + 50));
  }

  let resultArray = [];
  for (let i = 0; i < promiseArray.length; i++) {
    resultArray = [...resultArray, ...(await Promise.allSettled(promiseArray[i].map(v => postVendProduct(v))))];
    console.log(i, Date.now() - startTime + "ms");
    console.log(resultArray.filter(r => r.status === "rejected").length);
    if (i % 2 === 0) await delay(5000);
  }*/

  console.log(Date.now() - startTime + "ms");
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};

exports.handler = handler;

export default async (req, res) => {
  const { body } = await handler("");
  res.status(200).json(body);
};
