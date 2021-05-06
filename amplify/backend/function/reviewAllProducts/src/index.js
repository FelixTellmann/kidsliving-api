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
    define("entities/product/vendFetchProducts", ["require", "exports", "utils/fetch"], function (require, exports, fetch_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.postVendProduct = exports.fetchVendProducts = exports.fetchVendAllProductsBySku = exports.fetchVendProductById = exports.fetchVendProductBySku = exports.fetchVendProductByHandle = void 0;
        const fetchVendProductByHandle = handle => {
            return fetch_1.fetchVend(`products?handle=${handle}`);
        };
        exports.fetchVendProductByHandle = fetchVendProductByHandle;
        const fetchVendProductBySku = sku => {
            return fetch_1.fetchVend(`products?sku=${sku}`);
        };
        exports.fetchVendProductBySku = fetchVendProductBySku;
        const fetchVendProductById = id => {
            return fetch_1.fetchVend(`products/${id}`);
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
            return fetch_1.fetchVend(`products?since=2018-04-01&page=${page}&page_size=${page_size}`);
        };
        exports.fetchVendProducts = fetchVendProducts;
        const postVendProduct = product => {
            return fetch_1.fetchVend(`products`, "POST", product);
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
            return `{${props}}`.replace(/"([A-Z]+)"/g, "$1");
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
    define("pages/api/2021-05/reviewAllProducts", ["require", "exports", "chalk", "entities/product/vendFetchProducts", "utils/index"], function (require, exports, chalk_1, vendFetchProducts_1, utils_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        chalk_1 = __importDefault(chalk_1);
        async function getAllVendProducts() {
            const [initialRequest] = await Promise.allSettled([vendFetchProducts_1.fetchVendProducts()]);
            if (initialRequest.status !== "fulfilled")
                return;
            console.log(initialRequest.value.data.pagination);
            const pages = initialRequest.value.data.pagination?.pages ?? 1;
            if (pages === 1)
                return initialRequest.value.data.products;
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
        function filterFXTags(tags) {
            let tagArray = tags.split(",").map(t => t.trim());
            if (tagArray.some(t => (t.includes("FX_") || t.includes("Fx_")) && !t.includes("FX_needs_variant_image"))) {
                tagArray = tagArray.filter(t => (!t.includes("FX_") && !t.includes("Fx_")) || t.includes("FX_needs_variant_image"));
            }
            return tagArray.join(",");
        }
        function filterAddToShopifyTags(tags, source_id, variant_source_id) {
            if (source_id && variant_source_id) {
                if (utils_1.includesTags(tags, "FX_add_to_shopify")) {
                    return utils_1.removeTag(tags, "FX_add_to_shopify");
                }
                return tags;
            }
            if (!utils_1.includesTags(tags, "FX_add_to_shopify")) {
                return utils_1.addTag(tags, "FX_add_to_shopify");
            }
            return tags;
        }
        function filterUpdatesNeeded(vendProducts) {
            return vendProducts.reduce((acc, product) => {
                let skip = true;
                const filteredFXTags = filterFXTags(product.tags);
                // const filteredAddToShopifyTags = filterAddToShopifyTags(filteredFXTags, product.source_id, product.variant_source_id);
                if (!utils_1.isSameTags(product.tags, filteredFXTags))
                    skip = false;
                if (skip)
                    return acc;
                return [
                    ...acc,
                    {
                        id: product.id,
                        tags: filteredFXTags,
                    },
                ];
            }, []);
        }
        const handler = async (_) => {
            console.log("wems!");
            const startTime = Date.now();
            console.log(Date.now() - startTime + "ms");
            console.log(chalk_1.default.green(`1. Setup Amplify auto create functions & include API keys for env variables - done`));
            console.log(chalk_1.default.green(`2. Load all Products from Vend - Log Pagination:`));
            const vendProducts = await getAllVendProducts();
            console.log(chalk_1.default.gray(`3. Update Products based on Criteria - i.e. not on shopify - but is on Shopify - FX tags`));
            const updateRequests = filterUpdatesNeeded(vendProducts);
            console.log(updateRequests.length);
            const promiseArray = [[]];
            for (let i = 0; i < updateRequests.length; i += 50) {
                promiseArray.push(updateRequests.slice(i, i + 50));
            }
            let resultArray = [];
            for (let i = 0; i < promiseArray.length; i++) {
                resultArray = [...resultArray, ...(await Promise.allSettled(promiseArray[i].map(v => vendFetchProducts_1.postVendProduct(v))))];
                console.log(i, Date.now() - startTime + "ms");
                console.log(resultArray.filter(r => r.status === "rejected").length);
                if (i % 2 === 0)
                    await utils_1.delay(5000);
            }
            return {
                statusCode: 200,
                body: JSON.stringify(updateRequests),
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