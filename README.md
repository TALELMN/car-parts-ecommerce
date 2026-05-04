# Car Parts E-commerce — H.KAR Shop

A full-stack auto parts e-commerce site with a complete French admin panel. Customers browse car brands → models → parts and order with cash-on-delivery. Admins manage everything from a single dashboard.

## Features

### Storefront (customer-facing)
- Hierarchical navigation: **Brand → Model → Parts**
- Dynamic nav driven by the database (no hard-coded brands)
- Product catalog with search, sort, pagination
- Stock-aware UI: low-stock warnings, "Rupture de stock" overlays, disabled buttons when out of stock
- Direct order form on each product page + persistent shopping cart
- Cash-on-delivery checkout with all 24 Tunisian regions
- Mobile responsive

### Admin panel (French)
- Login / sessions / password change
- Dashboard with stats: products, orders, new orders, revenue, out-of-stock count
- Product management (CRUD + image upload + featured/active toggles)
- Order management with status workflow: `nouvelle → confirmée → en cours → livrée / annulée`
- Cancelling an order automatically restores stock
- Category management with two types:
  - **Marques** (top-level brands that appear in the nav)
  - **Modèles** (children of a brand that hold the actual parts)
- Settings: shop info, phone numbers, delivery fee
- Search, filter, pagination on every list

### Stock logic
- Order rejected if requested quantity exceeds stock
- Stock decrements automatically on each order
- Stock restored when an order is cancelled in admin
- Cart auto-syncs with live stock on load (drops removed items, caps quantities)

## Stack

- **Backend:** Node.js + Express
- **Database:** JSON file (zero-setup, no native compilation)
- **Auth:** bcryptjs + express-session
- **Uploads:** Multer
- **Frontend:** Vanilla HTML / CSS / JS (no build step)

## Quick start

```bash
npm install
npm start
```

Then open:
- Storefront: http://localhost:4000
- Admin: http://localhost:4000/admin

Default admin credentials: `admin` / `admin123` (change in *Paramètres → Changer le mot de passe*).

## Project structure

```
hkar-shop/
├── server.js              # Express server + JSON DB + REST API
├── package.json
├── public/                # Storefront
│   ├── index.html         # Homepage
│   ├── brand.html         # Models grid for a brand
│   ├── products.html      # Catalog with filters
│   ├── product.html       # Product detail + direct order form
│   ├── cart.html          # Cart + checkout
│   ├── css/style.css
│   └── js/app.js          # Cart, dynamic nav, product cards
├── admin/                 # Admin panel (SPA-ish, single page)
│   ├── index.html         # Login + dashboard + all admin pages
│   ├── css/admin.css
│   └── js/admin.js
└── uploads/               # User-uploaded product images (gitignored)
```

## API overview

### Public
- `GET /api/products` — list with `?category=`, `?search=`, `?featured=1`, `?page=`, `?sort=`
- `GET /api/products/:id`
- `GET /api/categories`
- `GET /api/brands` — top-level categories with model counts
- `GET /api/brands/:slug/models` — models under a brand with product counts
- `GET /api/nav` — full brand→models tree for the navbar
- `POST /api/orders` — create an order (with stock validation)

### Admin (auth required)
- `POST /api/auth/login` / `POST /api/auth/logout`
- `GET /api/stats` — dashboard
- `GET/POST/PUT/DELETE /api/products/...`
- `GET/POST/PUT/DELETE /api/categories/...`
- `GET /api/orders`, `PUT /api/orders/:id/status`, `DELETE /api/orders/:id`
- `GET/PUT /api/settings`

## Notes

- The included sample seed has 4 brands, 19 models, and 20 products covering Volkswagen, Peugeot, Hyundai, KIA — meant to mimic a Tunisian auto parts shop.
- Currency, regions and labels are all in French / Tunisian Dinar (DT).
- Database (`database.json`) is gitignored so each clone starts with a fresh seeded DB on first run.

## License

MIT
