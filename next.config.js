module.exports = {
  webpack(config, { isServer }) {
    config.resolve.extensions = ['.ts', '.js', '.jsx', '.tsx', '.svg', '.scss'];
    return config;
  },
};


module.exports.env = {
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  SHOPIFY_API_PASSWORD: process.env.SHOPIFY_API_PASSWORD,
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
  SHOPIFY_API_VERSION: process.env.SHOPIFY_API_VERSION,
  SHOPIFY_API_STORE: process.env.SHOPIFY_API_STORE,
  SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN,
  VEND_RETAILER_ID: process.env.VEND_RETAILER_ID,
  VEND_CPT_OUTLET_ID: process.env.VEND_CPT_OUTLET_ID,
  SHOPIFY_CPT_OUTLET_ID: process.env.SHOPIFY_CPT_OUTLET_ID,
  VEND_API: process.env.VEND_API,
  FIREBASE_APIKEY: process.env.FIREBASE_APIKEY,
  FIREBASE_AUTHDOMAIN: process.env.FIREBASE_AUTHDOMAIN,
  FIREBASE_PROJECTID: process.env.FIREBASE_PROJECTID,
  FIREBASE_STORAGEBUCKET: process.env.FIREBASE_STORAGEBUCKET,
  FIREBASE_MESSAGINGSENDERID: process.env.FIREBASE_MESSAGINGSENDERID,
  FIREBASE_APPID: process.env.FIREBASE_APPID,
  CUSTOM_BULK_REQUEST: process.env.CUSTOM_BULK_REQUEST
};

