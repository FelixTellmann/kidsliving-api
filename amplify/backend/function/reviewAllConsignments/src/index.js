module.exports = (() => {
    const defines = {};
    const entry = [null];
    function define(name, dependencies, factory) {
        defines[name] = { dependencies, factory };
        entry[0] = name;
    }
    define("require", ["exports"], (exports) => {
        Object.defineProperty(exports, "__cjsModule", { value: true });
        Object.defineProperty(exports, "default", { value: (name) => resolve(name) });
    });
    var __importDefault = (this && this.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    define("utils/fetch", ["require", "exports", "axios"], function (require, exports, axios_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.fetchVendGQL = exports.fetchShopifyGQL = exports.fetchShopify = exports.fetchVend = void 0;
        axios_1 = __importDefault(axios_1);
        const { VEND_API, SHOPIFY_API_KEY, SHOPIFY_API_PASSWORD, SHOPIFY_API_STORE, SHOPIFY_API_VERSION } = process.env;
        const fetchVend = (api, method = "GET", body = {}) => {
            const config = {
                method,
                url: `https://kidsliving.vendhq.com/api/${api.replace(/^\//, "")}`,
                headers: {
                    Authorization: `Bearer ${VEND_API}`,
                    "Content-Type": "application/json",
                },
                data: method !== "GET" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
            };
            return axios_1.default(config);
        };
        exports.fetchVend = fetchVend;
        const fetchShopify = (api, method = "GET", body = {}) => {
            const config = {
                method,
                url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_API_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/${api.replace(/^\//, "")}`,
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                data: method !== "GET" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
            };
            return axios_1.default(config);
        };
        exports.fetchShopify = fetchShopify;
        const fetchShopifyGQL = (gql) => {
            return axios_1.default({
                method: "POST",
                url: `https://${SHOPIFY_API_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
                headers: {
                    Accept: "application/graphql",
                    "Content-Type": "application/graphql",
                    "X-Shopify-Access-Token": SHOPIFY_API_PASSWORD,
                },
                data: gql,
            });
        };
        exports.fetchShopifyGQL = fetchShopifyGQL;
        const fetchVendGQL = (gql) => {
            return axios_1.default({
                method: "POST",
                url: `https://kidsliving.vendhq.com/api/graphql`,
                headers: {
                    Accept: "*/*",
                    "Content-Type": "application/JSON",
                    Authorization: `Bearer ${VEND_API}`,
                },
                data: JSON.stringify(gql),
            });
        };
        exports.fetchVendGQL = fetchVendGQL;
    });
    define("entities/order/shopifyOrderCreateWebhook", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
    });
    define("entities/consignment/vendFetchConsignments", ["require", "exports", "utils/fetch"], function (require, exports, fetch_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.fetchVendConsignmentsv2 = exports.fetchVendConsignments = void 0;
        const fetchVendConsignments = (since = "2018-04-01", page = 1, page_size = 200) => {
            return fetch_1.fetchVend(`consignment?since=${since}&page=${page}&page_size=${page_size}`);
        };
        exports.fetchVendConsignments = fetchVendConsignments;
        const fetchVendConsignmentsv2 = (status, after, before, page_size = 200) => {
            return fetch_1.fetchVend(`2.0/consignments?since=2018-04-01&status=${status}&page_size=${page_size}${after ? `&after=${after}` : ""}${before ? `&before=${before}` : ""}`);
        };
        exports.fetchVendConsignmentsv2 = fetchVendConsignmentsv2;
    });
    /*
    export type postVendConsignmentReturn = {
      data: {
        product: vendConsignment;
      };
    };
    
    export type vendProductInput = {
      //  Existing product ID. If included in the POST request it will cause an update instead of a creating a new object.
      id?: string;
      //  The ID that can be used to reference a product in another system.
      source_id?: string;
      // Does not show in result - "" - empty string does not work!
      source?: "USER" | "TAKEALOT" | "SHOPIFY" | string;
      //  Reference ID to an external object. Value will be returned as variant_source_id.
      source_variant_id?: string;
      //  The handle of the product. Creating a new product with a handle identical to one of an existing product will cause creating a variant.
      handle?: string;
      //  The name of the product type associated with the product. Maximum 50 characters.
      type?: string;
      //  The name of the variant option 1.
      variant_option_one_name?: string;
      //  The value of the variant option 1.
      variant_option_one_value?: string;
      //  The name of the variant option 2.
      variant_option_two_name?: string;
      //  The value of the variant option 2.
      variant_option_two_value?: string;
      //  The name of the variant option 3.
      variant_option_three_name?: string;
      //  The value of the variant option 3.
      variant_option_three_value?: string;
      //  Indicates whether the product is currently active. NOTE?: Currently has to be submitted as “0” or “1”. Will be returned as boolean value of true or false.
      active?: "0" | "1";
      //  The name of the product. Should be posted without any variant related suffixes.
      name?: string;
      //  The description of the product. May include HTML.
      description?: string;
      //  The SKU of the product. Should be unique for new products. If a SKU is not specified, the system will generate one for the product.
      sku?: string;
      //  A comma separated list of tags associated with the product.
      tags?: string;
      //  The name of the brand associated with the product.
      brand_name?: string;
      //  Product supplier’s name.
      supplier_name?: string;
      //  The supplier’s code or reference for the product.
      supplier_code?: string;
      //  The default cost of supply for the product.
      supply_price?: string;
      //  Code used to associate purchase (cost) of the product with a specific account.
      account_code_purchase?: string;
      //  Code used to associate sales of the product with a specific account. Value will be returned as account_code_sales.
      account_code?: string;
      //  Indicated whether the system should track inventory count for this product.
      track_inventory?: boolean;
      //  A number describing the position of a variant in the UI.
      button_order?: number;
      //  A list of inventory records associated with the product.
      inventory?: {
        //  The uui - ID of an outlet associated with this inventory record.
        outlet_id: string;
        //  The name of the outlet.
        outlet_name?: string;
        //  Current stock quantity of the product at the given outlet.
        count: string;
        //  Quantity below which the product should be included in the auto-filled stock orders.
        reorder_point?: string;
        //  The default of the quantity for auto-filled stock orders
        restock_level?: string;
      }[];
      //  FLOAT - Retail price for the product. Tax inclusive or exclusive depending on the store settings.
      retail_price?: number;
      //  The name of the default tax for the product.
      tax?: string;
    };
    
    export type TPostVendProduct = (product: vendProductInput) => Promise<postVendConsignmentReturn>;
    
    export const postVendProduct: TPostVendProduct = product => {
      return fetchVend(`products`, "POST", product);
    };
    */
    define("entities/consignmentProducts/vendFetchConsignmentProducts", ["require", "exports", "utils/fetch"], function (require, exports, fetch_2) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.fetchVendConsignmentProductsById = void 0;
        const fetchVendConsignmentProductsById = (consignment_id, page = 1, page_size = 200) => {
            return fetch_2.fetchVend(`consignment_product?consignment_id=${consignment_id}&page=${page}&page_size=${page_size}`);
        };
        exports.fetchVendConsignmentProductsById = fetchVendConsignmentProductsById;
    });
    define("entities/product/vendFetchProducts", ["require", "exports", "utils/fetch"], function (require, exports, fetch_3) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.postVendProduct = exports.fetchVendProducts = exports.fetchVendAllProductsBySku = exports.fetchVendProductById = exports.fetchVendProductBySku = exports.fetchVendProductByHandle = void 0;
        const fetchVendProductByHandle = handle => {
            return fetch_3.fetchVend(`products?handle=${handle}`);
        };
        exports.fetchVendProductByHandle = fetchVendProductByHandle;
        const fetchVendProductBySku = sku => {
            return fetch_3.fetchVend(`products?sku=${sku}`);
        };
        exports.fetchVendProductBySku = fetchVendProductBySku;
        const fetchVendProductById = id => {
            return fetch_3.fetchVend(`products/${id}`);
        };
        exports.fetchVendProductById = fetchVendProductById;
        const fetchVendAllProductsBySku = ({ line_items }) => {
            const getSaleProducts = [];
            line_items.forEach(({ sku }) => {
                getSaleProducts.push(exports.fetchVendProductBySku(sku));
            });
            return Promise.allSettled(getSaleProducts);
        };
        exports.fetchVendAllProductsBySku = fetchVendAllProductsBySku;
        const fetchVendProducts = (page = 1, page_size = 200) => {
            return fetch_3.fetchVend(`products?since=2018-04-01&page=${page}&page_size=${page_size}`);
        };
        exports.fetchVendProducts = fetchVendProducts;
        const postVendProduct = product => {
            return fetch_3.fetchVend(`products`, "POST", product);
        };
        exports.postVendProduct = postVendProduct;
    });
    define("utils/index", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.delay = exports.shopifyDateToVendDate = exports.queryfy = exports.isSameDescription = exports.includesTags = exports.isSameTags = exports.mergeDescriptions = exports.mergeTags = exports.removeTag = exports.addTag = exports.isSameArray = void 0;
        const isSameArray = (a, b) => {
            const cleanSortArray = (z) => JSON.stringify(z
                .map((x) => x.toString().trim().toLowerCase())
                .sort((x, y) => {
                if (x < y) {
                    return -1;
                }
                if (x > y) {
                    return 1;
                }
                return 0;
            }));
            return cleanSortArray(a) === cleanSortArray(b);
        };
        exports.isSameArray = isSameArray;
        const addTag = (string, tag) => [
            ...new Set(string
                .split(",")
                .map(t => t.trim())
                .concat(tag)),
        ]
            .join(",")
            .replace(/^,/, "");
        exports.addTag = addTag;
        const removeTag = (string, tag) => [
            ...new Set(string
                .split(",")
                .map(t => t.trim())
                .filter(x => x !== tag)),
        ]
            .join(",")
            .replace(/^,/, "");
        exports.removeTag = removeTag;
        const mergeTags = (tagList, tagListAddon) => [...new Set([...tagList.split(",").map((t) => t.trim()), ...tagListAddon.split(",").map((t) => t.trim())])]
            ?.filter(t => t !== "")
            .join(",")
            .replace(/^,/, "");
        exports.mergeTags = mergeTags;
        const mergeDescriptions = (description, descriptionAddon) => {
            return description.length > descriptionAddon.length ? description : descriptionAddon;
        };
        exports.mergeDescriptions = mergeDescriptions;
        const isSameTags = (tagList, secondTagList) => {
            return exports.isSameArray(tagList.split(","), secondTagList.split(","));
        };
        exports.isSameTags = isSameTags;
        const includesTags = (mainTaglist, smallerTaglist) => {
            return smallerTaglist
                .replace(/,\s*$/, "")
                .toLowerCase()
                .split(",")
                .map(t => t.trim())
                .every(tag => mainTaglist
                .replace(/,\s*$/, "")
                .toLowerCase()
                .split(",")
                .map(t => t.trim())
                .includes(tag));
        };
        exports.includesTags = includesTags;
        const isSameDescription = (description, secondDescription) => {
            const isSame = description.replace(/[^A-Za-z0-9]/gi, "") === secondDescription.replace(/[^A-Za-z0-9]/gi, "");
            if (!isSame) {
                console.log(description.replace(/[^A-Za-z0-9]/gi, ""));
                console.log(secondDescription.replace(/[^A-Za-z0-9]/gi, ""));
            }
            return isSame;
        };
        exports.isSameDescription = isSameDescription;
        const queryfy = (input) => {
            // Make sure we don't alter integers.
            const obj = JSON.parse(JSON.stringify(input));
            if (typeof obj === "number") {
                return obj;
            }
            // Stringify everything other than objects.
            if (typeof obj !== "object") {
                return JSON.stringify(obj);
            }
            if (Array.isArray(obj)) {
                const props = obj.map(val => exports.queryfy(val)).join(",");
                return `[${props}]`;
            }
            // Iterate through object keys to convert into a string
            // to be interpolated into the query.
            const props = Object.keys(obj)
                .map(key => `${key}:${exports.queryfy(obj[key])}`)
                .join(",");
            return `{${props}}`.replace(/"([A-Z]+)":/g, "$1:");
        };
        exports.queryfy = queryfy;
        const shopifyDateToVendDate = (date) => {
            console.log(date);
            const dateArray = new Date(date).toISOString().split("T");
            return `${dateArray[0]} ${dateArray[1].split(".")[0]}`;
        };
        exports.shopifyDateToVendDate = shopifyDateToVendDate;
        function delay(time) {
            return new Promise(resolve => setTimeout(resolve, time));
        }
        exports.delay = delay;
    });
    define("pages/api/2021-05/reviewAllConsignments", ["require", "exports", "chalk", "entities/consignment/vendFetchConsignments", "entities/consignmentProducts/vendFetchConsignmentProducts", "entities/product/vendFetchProducts", "utils/index", "utils/fetch"], function (require, exports, chalk_1, vendFetchConsignments_1, vendFetchConsignmentProducts_1, vendFetchProducts_1, utils_1, fetch_4) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.createGqlFetchVariantsWithMetafield = void 0;
        chalk_1 = __importDefault(chalk_1);
        const createGqlFetchVariantsWithMetafield = (key, namespace, after, page_count = 100) => {
            return `query {
        productVariants(first:${page_count}${after ? `,after:"${after}"` : ""}) {
          edges { 
            cursor
            node {
              id
              inventoryPolicy
              metafield(key: "${key}", namespace: "${namespace}") {
                id
                value
              }
            } 
          }
          pageInfo {
            hasNextPage
          } 
        }
      }`;
        };
        exports.createGqlFetchVariantsWithMetafield = createGqlFetchVariantsWithMetafield;
        async function getAllVendProducts() {
            const [initialRequest] = await Promise.allSettled([vendFetchProducts_1.fetchVendProducts()]);
            if (initialRequest.status !== "fulfilled")
                return [];
            console.log(initialRequest.value.data.pagination);
            const pages = initialRequest.value.data.pagination?.pages ?? 1;
            if (pages === 1)
                return initialRequest.value.data.products ?? [];
            const pagesToFetch = [];
            for (let i = 2; i <= pages; i++) {
                pagesToFetch.push(vendFetchProducts_1.fetchVendProducts(i));
            }
            const pageRequests = await Promise.allSettled(pagesToFetch);
            return pageRequests.reduce((acc, pageRequest) => {
                if (pageRequest.status !== "fulfilled")
                    return acc;
                return [...acc, ...pageRequest.value.data.products];
            }, initialRequest.value.data.products);
        }
        async function getAllVendConsignments(monthsAgo = 5, filterStatus = "OPEN", filterType = "SUPPLIER") {
            const date = new Date();
            date.setMonth(date.getMonth() - monthsAgo);
            const fiveMonthAgo = date.toISOString().split("T")[0];
            const [initialRequest] = await Promise.allSettled([vendFetchConsignments_1.fetchVendConsignments(fiveMonthAgo)]);
            if (initialRequest.status !== "fulfilled")
                return [[], []];
            console.log(initialRequest.value.data.pagination);
            const pages = initialRequest.value.data.pagination?.pages ?? 1;
            const pagesToFetch = [];
            for (let i = 2; i <= pages; i++) {
                pagesToFetch.push(vendFetchConsignments_1.fetchVendConsignments(fiveMonthAgo, i));
            }
            const pageRequests = await Promise.allSettled(pagesToFetch);
            const vendConsignmentsRequest = pageRequests.reduce((acc, pageRequest) => {
                if (pageRequest.status !== "fulfilled")
                    return acc;
                return [...acc, ...pageRequest.value.data.consignments];
            }, initialRequest.value.data.consignments);
            const vendConsignments = vendConsignmentsRequest.filter(({ status, type }) => status === filterStatus && type === filterType);
            console.log(vendConsignments[6]);
            console.log(chalk_1.default.green(`5. Load all consignment Products`));
            const consignmentProductsRequests = await Promise.allSettled(vendConsignments.map(({ id }) => getAllVendConsignmentProducts(id)));
            const consignmentProducts = consignmentProductsRequests.reduce((acc, consignmentProduct) => {
                if (consignmentProduct.status === "rejected")
                    return acc;
                return [...acc, ...consignmentProduct.value];
            }, []);
            return [vendConsignments, consignmentProducts];
        }
        async function getAllVendConsignmentProducts(id) {
            const [initialRequest] = await Promise.allSettled([vendFetchConsignmentProducts_1.fetchVendConsignmentProductsById(id)]);
            if (initialRequest.status !== "fulfilled")
                return [];
            const pages = initialRequest.value.data.pagination?.pages ?? 1;
            if (pages === 1)
                return initialRequest.value.data.consignment_products ?? [];
            const pagesToFetch = [];
            for (let i = 2; i <= pages; i++) {
                pagesToFetch.push(vendFetchConsignmentProducts_1.fetchVendConsignmentProductsById(id, i));
            }
            const pageRequests = await Promise.allSettled(pagesToFetch);
            return pageRequests.reduce((acc, pageRequest) => {
                if (pageRequest.status !== "fulfilled")
                    return acc;
                return [...acc, ...pageRequest.value.data.consignments];
            }, initialRequest.value.data.consignment_products);
        }
        async function getAllShopifyVariants() {
            let completed = false;
            let after = undefined;
            let variants = [];
            async function getData(after = undefined) {
                try {
                    const result = await fetch_4.fetchShopifyGQL(exports.createGqlFetchVariantsWithMetafield("preorders", "vend", after));
                    try {
                        if (!result.data.data.productVariants.edges) {
                            return [[], "", false];
                        }
                    }
                    catch (err) {
                        console.log(err.message, "asd");
                        return [[], "", false];
                    }
                    const { data: { productVariants: { edges: initialVariants, pageInfo: { hasNextPage }, }, }, extensions, } = result.data;
                    console.log(chalk_1.default.red(JSON.stringify(extensions)));
                    return [initialVariants.map(v => v.node), initialVariants[initialVariants.length - 1].cursor, hasNextPage];
                }
                catch (err) {
                    console.log(err.message);
                    return [[], "", false];
                }
            }
            while (!completed) {
                const [newVariants, lastCursor, hasNextPage] = await getData(after);
                await utils_1.delay(3750);
                if (!Array.isArray(newVariants))
                    return;
                variants = [...variants, ...newVariants];
                after = lastCursor;
                completed = !hasNextPage;
            }
            return variants;
        }
        const handler = async (_) => {
            const startTime = Date.now();
            console.log(Date.now() - startTime + "ms");
            console.log(chalk_1.default.green(`1. Setup Amplify auto create functions & include API keys for env variables - done`));
            console.log(chalk_1.default.green(`2. Load all Consignments  from Vend - Log Pagination:`));
            console.log(chalk_1.default.green(`3. Load all Products from Vend - Log Pagination:`));
            console.log(chalk_1.default.green(`4. Load all Variants from Shopify - Log Pagination:`));
            const [vendConsignmentsRequest, vendProductsRequest, shopifyMetafieldRequests] = await Promise.allSettled([
                getAllVendConsignments(5, "OPEN", "SUPPLIER"),
                getAllVendProducts(),
                getAllShopifyVariants(),
            ]);
            if (vendConsignmentsRequest.status !== "fulfilled" ||
                vendProductsRequest.status !== "fulfilled" ||
                shopifyMetafieldRequests.status !== "fulfilled") {
                return {
                    statusCode: 50,
                    body: JSON.stringify("Server Error"),
                };
            }
            const shopifyVariantsWithMetafield = shopifyMetafieldRequests.value;
            const vendProducts = vendProductsRequest.value;
            const [vendConsignments, unorderedConsignmentProducts] = vendConsignmentsRequest.value;
            console.log(chalk_1.default.gray(`4. Update Products based on Criteria - i.e. not on shopify - but is on Shopify - FX tags`));
            const { counter, onShopify, preorder, ...consignmentProductsObject } = unorderedConsignmentProducts.reduce((acc, consignmentProduct) => {
                const vendProduct = vendProducts.find(({ id }) => id === consignmentProduct.product_id);
                const vendConsignment = vendConsignments.find(({ id }) => id === consignmentProduct.consignment_id);
                if (!vendProduct)
                    return acc;
                acc.counter++;
                if ((vendProduct.source_id || vendProduct.variant_source_id) && !vendProduct.source_id.includes("unpub")) {
                    acc.onShopify++;
                }
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
                        quantity: +consignmentProduct.count,
                        expectedDate,
                        preorder: vendConsignment.name.toLowerCase().includes("preorder"),
                        container: vendConsignment.name.toLowerCase().includes("container"),
                    });
                    acc[consignmentProduct.product_id].preorder = acc[consignmentProduct.product_id].preorder || preorder;
                    acc[consignmentProduct.product_id].container = acc[consignmentProduct.product_id].container || container;
                    return acc;
                }
                acc[consignmentProduct.product_id] = {
                    product_id: vendProduct.source_id,
                    variant_id: vendProduct.variant_source_id,
                    tags: vendProduct.tags,
                    consignments: [
                        {
                            name: vendConsignment.name,
                            quantity: +consignmentProduct.count,
                            expectedDate,
                            preorder: vendConsignment.name.toLowerCase().includes("preorder"),
                            container: vendConsignment.name.toLowerCase().includes("container"),
                        },
                    ],
                    preorder,
                    container,
                };
                return acc;
            }, { counter: 0, onShopify: 0, preorder: 0 });
            const vendEditTags_addToShopify = [];
            const shopifyEditInventoryAndMetafield = [];
            console.log(chalk_1.default.blueBright(JSON.stringify({ counter, onShopify, preorder })));
            /*= =============== For All Vend Products - Check Tags (can be removed in future as its only to clean up old tags) ================ */
            const vendProductsWithUpdatedTags = vendProducts.map(({ id, tags, source_id, ...rest }) => {
                const hasTag_needsPublishToShopify = tags.includes("FX_needs_publish_to_shopify");
                const hasTag_needsVariantImage = tags.includes("FX_needs_variant_image");
                const hasTag_vendBrandTag = tags.includes(rest.brand_name);
                let newTags = tags
                    .split(",")
                    .filter(t => !t.toLowerCase().includes(`fx_`))
                    .join(",");
                if (!source_id && !source_id?.includes("_unpub") && hasTag_needsPublishToShopify) {
                    newTags = utils_1.addTag(newTags, "FX2_needs_publish_to_shopify");
                }
                if (hasTag_needsVariantImage) {
                    newTags = utils_1.addTag(newTags, "FX2_needs_variant_image");
                }
                if (!hasTag_vendBrandTag) {
                    newTags = newTags
                        .split(",")
                        .filter(t => !t.toLowerCase().includes(rest.brand_name.toLowerCase()))
                        .join(",");
                    newTags = utils_1.addTag(newTags, rest.brand_name);
                }
                return { ...rest, id, source_id, tags, newTags };
            });
            /*= =============== For all consignment products that container preorder or container
             *  - Add Tag on Vend
             * -  add to Shopify metafields  ================ */
            const consignmentProductsArray = Object.entries(consignmentProductsObject).reduce((acc, [vend_product_id, cP]) => {
                acc.push({ vend_product_id, ...cP });
                return acc;
            }, []);
            consignmentProductsArray.forEach(({ vend_product_id, preorder, container, product_id, variant_id, consignments }) => {
                const vendProductIndex = vendProductsWithUpdatedTags.findIndex(vpt => vpt.id === vend_product_id);
                if (!vendProductIndex)
                    return;
                const tags = vendProductsWithUpdatedTags[vendProductIndex]?.newTags ?? "";
                let newTags = tags;
                const shopifyMetafields = shopifyVariantsWithMetafield.find(m => m.id.includes(variant_id));
                if (!product_id && !tags.includes("FX2_needs_publish_to_shopify" && container)) {
                    newTags = utils_1.addTag(newTags, "FX2_needs_publish_to_shopify");
                }
                if (product_id &&
                    variant_id &&
                    !product_id.includes("unpub") &&
                    container &&
                    preorder &&
                    shopifyMetafields &&
                    (shopifyMetafields.inventoryPolicy === "DENY" || shopifyMetafields.metafield)) {
                    if (!newTags.includes("FX2_auto_preorder")) {
                        newTags = utils_1.addTag(newTags, "FX2_auto_preorder");
                    }
                    const input = JSON.stringify(consignments).replace(/"/gi, `\\"`);
                    if (shopifyMetafields.metafield?.value?.replace(/"/gi, `\\"`) !== input) {
                        shopifyEditInventoryAndMetafield.push(fetch_4.fetchShopifyGQL(`
                mutation { 
                  productVariantUpdate(input: {id: "gid://shopify/ProductVariant/${variant_id}", inventoryPolicy: CONTINUE, metafields: [{ key: "preorders", valueType: JSON_STRING, value: "${input}", namespace: "vend" }] }) {
                    productVariant { 
                      id
                      inventoryPolicy
                    } 
                    userErrors {
                      field
                      message
                    }
                  }
                }
              `));
                    }
                }
                vendProductsWithUpdatedTags[vendProductIndex].newTags = newTags;
            });
            /*= =============== All Metafields - Remove Products not found in consignment products with preorder / container  ================ */
            shopifyVariantsWithMetafield.forEach(({ id: variant_id, metafield }) => {
                const clean_variant_id = variant_id.replace("gid://shopify/ProductVariant/", "");
                const vendProductIndex = vendProductsWithUpdatedTags.findIndex(vp => vp.variant_source_id.includes(`${clean_variant_id}`));
                const v_Product = vendProductsWithUpdatedTags[vendProductIndex];
                if (v_Product) {
                    console.log(metafield);
                    const consignmentProduct = consignmentProductsArray.find(vcp => vcp.vend_product_id === v_Product.id);
                    const newTags = v_Product.newTags;
                    if (!consignmentProduct || !consignmentProduct?.preorder) {
                        vendProductsWithUpdatedTags[vendProductIndex].newTags = utils_1.removeTag(newTags, "FX2_auto_preorder");
                        if (metafield) {
                            shopifyEditInventoryAndMetafield.push(fetch_4.fetchShopifyGQL(` 
                mutation { 
                  metafieldDelete(input: {id: "${metafield.id}"}) {
                    deletedId
                    userErrors {
                      field
                      message
                    }
                  } 
                  productVariantUpdate(input: {id: "gid://shopify/ProductVariant/${clean_variant_id}", inventoryPolicy: DENY }) {
                    product {
                      id
                    }
                    productVariant {
                      id
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }
              `));
                        }
                    }
                }
            });
            vendProductsWithUpdatedTags.forEach(({ id, tags, newTags, variant_source_id, source_id, brand_name }) => {
                const needsCategoryTags = newTags.split(",").filter(t => {
                    if (/^fx2?_.*/gi.test(t)) {
                        return false;
                    }
                    if (t.includes(brand_name)) {
                        return false;
                    }
                    return true;
                }).length === 0;
                if (source_id && variant_source_id) {
                    if (needsCategoryTags && !source_id?.includes("_unpub")) {
                        newTags = utils_1.addTag(newTags, "FX2_needs_category_tags");
                    }
                    if (tags === "" && !newTags.includes("FX2_needs_category_tags") && !source_id?.includes("_unpub")) {
                        newTags = utils_1.addTag(newTags, "FX2_needs_category_tags");
                    }
                    if ((newTags.includes("FX2_needs_category_tags") && newTags.split(",").filter(t => !/^fx2?_.*/gi.test(t)).length > 0) ||
                        source_id?.includes("_unpub")) {
                        newTags = utils_1.removeTag(newTags, "FX2_needs_category_tags");
                    }
                }
                if (!utils_1.isSameTags(tags, newTags)) {
                    vendEditTags_addToShopify.push(vendFetchProducts_1.postVendProduct({ id, tags: newTags }));
                }
            });
            try {
                console.log(vendEditTags_addToShopify.length, "vendEditTags_addToShopify");
                console.log(shopifyEditInventoryAndMetafield.length, "shopifyEditInventoryAndMetafield");
                console.log(shopifyEditInventoryAndMetafield[0]);
                const final = await Promise.allSettled([...vendEditTags_addToShopify, ...shopifyEditInventoryAndMetafield]);
                console.log(Date.now() - startTime + "ms");
                const result = final.reduce((acc, requests) => {
                    if (requests.status !== "fulfilled")
                        return acc;
                    return [...acc, requests.value.data];
                }, []);
                /*console.log(JSON.stringify(result));*/
                return {
                    statusCode: 200,
                    body: JSON.stringify(result),
                };
            }
            catch (err) {
                console.log(err.message);
            }
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
                body: JSON.stringify({ counter, onShopify, preorder, ...consignmentProductsObject }),
            };
        };
        exports.handler = handler;
        exports.default = async (req, res) => {
            const { body } = await handler("");
            res.status(200).json(body);
        };
    });
    
    'marker:resolver';

    function get_define(name) {
        if (defines[name]) {
            return defines[name];
        }
        else if (defines[name + '/index']) {
            return defines[name + '/index'];
        }
        else {
            const dependencies = ['exports'];
            const factory = (exports) => {
                try {
                    Object.defineProperty(exports, "__cjsModule", { value: true });
                    Object.defineProperty(exports, "default", { value: require(name) });
                }
                catch {
                    throw Error(['module "', name, '" not found.'].join(''));
                }
            };
            return { dependencies, factory };
        }
    }
    const instances = {};
    function resolve(name) {
        if (instances[name]) {
            return instances[name];
        }
        if (name === 'exports') {
            return {};
        }
        const define = get_define(name);
        instances[name] = {};
        const dependencies = define.dependencies.map(name => resolve(name));
        define.factory(...dependencies);
        const exports = dependencies[define.dependencies.indexOf('exports')];
        instances[name] = (exports['__cjsModule']) ? exports.default : exports;
        return instances[name];
    }
    if (entry[0] !== null) {
        return resolve(entry[0]);
    }
})();