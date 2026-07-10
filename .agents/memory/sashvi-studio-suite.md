---
name: Sashvi Studio Suite
description: Key decisions and quirks for the sashvi-studio-suite-main project (e-commerce frontend + backend).
---

## Stack
- Frontend: TanStack Start (React SSR) + Vite, port 5000
- Backend: Express at `sashvi-studio-suite-main/backend/`, port 3000
- Server entry: `src/server.ts` — routes `/api/*` to `handleApiRequest` in `src/lib/api.server.ts`

## API connectivity
- Frontend calls backend via Vite proxy: `/backend-api/*` → `http://localhost:3000/*`
- `src/lib/backend.ts` has `API_BASE_URL = "/backend-api"` (relative, goes through proxy)
- Direct `localhost:3000` from the browser does NOT work in Replit — always use the proxy path
- Auth token storage key: `sashvi_auth_access_token` (AUTH_STORAGE_KEY in backend.ts)

## Credentials (env var names only)
- JWT_SECRET, ADMIN_PASSWORD, IMAGEKIT_PRIVATE_KEY
- VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_KEY

## Auth / Cart / Wishlist contexts
- `src/lib/auth-context.tsx` — AuthProvider + useAuth (checks localStorage for token)
- `src/lib/cart-context.tsx` — CartProvider + useCart (reads/writes localStorage "cart" key)
- `src/lib/wishlist-context.tsx` — WishlistProvider + useWishlist (reads/writes "wishlist" key)
- All three providers wrap the app in `src/routes/__root.tsx` inside QueryClientProvider

## Backend trust proxy
- `app.set('trust proxy', 1)` is required in backend/src/index.ts
- **Why:** Replit proxies through an intermediary, so X-Forwarded-For headers are always present. Without trust proxy, express-rate-limit throws ValidationError.

## Key design decisions
- Cart/wishlist pages show auth guard (login prompt) when user is not signed in
- Clicking cart/wishlist header icons redirects to /my-account when not logged in
- CategoryShell children prop is optional — always renders product grid (no dual category-grid / product-grid mode)
- Sarees/jewellery pages show ALL products when no tag is selected (not a category thumbnail grid)
- FAQ on homepage is an accordion (one open at a time, answers hidden by default)
- "Back to Storefront" link appears on every non-home page via Layout component
- ProductCard uses CartContext + WishlistContext (no raw localStorage manipulation)
