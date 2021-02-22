# API Integration for Kids Living

The aim of the custom app is to integrate Shopify & Vends API endpoints to allow for
seamless communication without any bugs.

The core problem is that the current solution provided from Vend, which is their internal
App is full of bugs and inconsistent and unexpected behaviour. The App is supposed to
somewhat replace the native Shopify/Vend App that exists and also allow for additional
functionality unique to Kids Living and their Business setup.

## Product Api

Fix the current Product API:

- Vend as primary source of truth

## Vend product.update Webhook 🤔⭐
1. Get data from Vend & Shopify for the entire product (all variants & necessary info)
    - Primary source of truth - vend: _handle_ - shopify: _product_id_ 
2. Check if Vend data has internal Inconsistencies (description, tags, type,
   unpublished)
3. Check for Shopify not having all variants / too many variants - For delete 
   variants Check also for assigned images to remove
4. Compare product data Vend vs Shopify - check errors on:
    - Descriptions
    - Tags
    - Price
    - Product Type
    - Sku
    - Variant id
    - Product id
    - Inventory CPT
    - Inventory JHB
    - option1
    - option2
    - option3
5. Active / Published -> use Metafield API to deactivate individual variants.