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
  VEND_RETAILER_ID: process.env.VEND_RETAILER_ID,
};

