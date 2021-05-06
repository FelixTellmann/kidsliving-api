import chalk from "chalk";
import {
  fetchVendProducts,
  postVendProduct,
  TPostVendProduct,
  vendProduct,
  vendProductInput,
} from "entities/product/vendFetchProducts";
import { init } from "gts/build/src/init";
import { addTag, delay, includesTags, isSameTags, removeTag } from "utils";

async function getAllVendProducts() {
  const [initialRequest] = await Promise.allSettled([fetchVendProducts()]);

  if (initialRequest.status !== "fulfilled") return;

  console.log(initialRequest.value.data.pagination);
  const pages = initialRequest.value.data.pagination?.pages ?? 1;

  if (pages === 1) return initialRequest.value.data.products;

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

function filterFXTags(tags) {
  let tagArray = tags.split(",").map(t => t.trim());
  if (tagArray.some(t => (t.includes("FX_") || t.includes("Fx_")) && !t.includes("FX_needs_variant_image"))) {
    tagArray = tagArray.filter(t => (!t.includes("FX_") && !t.includes("Fx_")) || t.includes("FX_needs_variant_image"));
  }
  return tagArray.join(",");
}

function filterAddToShopifyTags(tags, source_id, variant_source_id) {
  if (source_id && variant_source_id) {
    if (includesTags(tags, "FX_add_to_shopify")) {
      return removeTag(tags, "FX_add_to_shopify");
    }
    return tags;
  }

  if (!includesTags(tags, "FX_add_to_shopify")) {
    return addTag(tags, "FX_add_to_shopify");
  }
  return tags;
}

function filterUpdatesNeeded(vendProducts: vendProduct[]): vendProductInput[] {
  return vendProducts.reduce((acc, product) => {
    let skip = true;

    const filteredFXTags = filterFXTags(product.tags);
    // const filteredAddToShopifyTags = filterAddToShopifyTags(filteredFXTags, product.source_id, product.variant_source_id);

    if (!isSameTags(product.tags, filteredFXTags)) skip = false;

    if (skip) return acc;
    return [
      ...acc,
      {
        id: product.id,
        tags: filteredFXTags,
      },
    ];
  }, [] as vendProductInput[]);
}

const handler = async _ => {
  console.log("wems!");
  const startTime = Date.now();
  console.log(Date.now() - startTime + "ms");

  console.log(chalk.green(`1. Setup Amplify auto create functions & include API keys for env variables - done`));

  console.log(chalk.green(`2. Load all Products from Vend - Log Pagination:`));
  const vendProducts = await getAllVendProducts();

  console.log(chalk.gray(`3. Update Products based on Criteria - i.e. not on shopify - but is on Shopify - FX tags`));

  const updateRequests = filterUpdatesNeeded(vendProducts);

  console.log(updateRequests.length);

  const promiseArray = [[]];
  for (let i = 0; i < updateRequests.length; i += 50) {
    promiseArray.push(updateRequests.slice(i, i + 50));
  }

  let resultArray = [];
  for (let i = 0; i < promiseArray.length; i++) {
    resultArray = [...resultArray, ...(await Promise.allSettled(promiseArray[i].map(v => postVendProduct(v))))];
    console.log(i, Date.now() - startTime + "ms");
    console.log(resultArray.filter(r => r.status === "rejected").length);
    if (i % 2 === 0) await delay(5000);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updateRequests),
  };
};

exports.handler = handler;

export default async (req, res) => {
  const { body } = await handler("");
  res.status(200).json(body);
};
