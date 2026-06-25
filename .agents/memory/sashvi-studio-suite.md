---
name: Sashvi Studio Suite
description: Key decisions and quirks for the sashvi-studio-suite-main admin panel project.
---

## Stack
- TanStack Start (React SSR) + Vite, port 5000
- Server entry: `src/server.ts` — routes `/api/*` to `handleApiRequest` in `src/lib/api.server.ts`
- Admin panel: `src/routes/admin.tsx` (single-file component ~1900 lines)
- In-memory data store in `api.server.ts` (no DB persistence yet)
- `imagekit` npm package (Node.js SDK, NOT `imagekit-javascript`) installed in sashvi-studio-suite-main/

## Credentials (env var names, not values)
- JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
- IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT
- VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
- EMAIL_FROM

## Key design decisions
- NAV has no "Banners" section (removed per user request)
- Product form: two modes (sarees vs jewellery) with different field sets. Tags = subcategory styles. Categories = main type [sarees/jewellery/combos]
- Saree fields: fabricType (ComboBox), sareeLength (default 5.5m), blousePiece (Yes/No), occasionWear, workType
- Jewellery fields: weight (grams), material (ComboBox), occasionWear, workType
- Color variants: dynamic list with color/stock/originalPrice/salePrice
- Multiple image upload: sequential POSTs to /api/admin/upload-image, first URL = primary image
- Reviews: Approve + Delete only (no Reject button shown to admin, and no notification sent to user on delete)
- Instagram feed: uses `linkedProducts: [{name, url}]` array (not single `linkedProduct` string)
- Coupons: include `category` field (All/Sarees/Jewellery/Combos) + edit via PUT
- Settings: storeName, contactNumber, email, address, freeDeliveryAbove (default 1000), deliveryCharge, gatewayFee — NO razorpayKey or imageKitUrl
- Inventory: inline stock editing (input field + save button, no window.prompt)
- Order detail: modal with subtotal/delivery/gatewayFee/total breakdown + status update + invoice download
- Invoice download: generates HTML file client-side (Blob URL)
- Dashboard stats: all computed live from orders/products/customers state

**Why imagekit (not imagekit-javascript):** imagekit-javascript is a browser SDK that may use browser APIs. The `imagekit` npm package is the official Node.js server-side SDK for private-key uploads.
