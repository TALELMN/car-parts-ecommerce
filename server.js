const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = 4000;
const DB_PATH = path.join(__dirname, 'database.json');

// ── JSON Database ──
function loadDB() {
  if (!fs.existsSync(DB_PATH)) return null;
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function defaultDB() {
  return {
    nextId: { categories: 24, products: 21, orders: 1, admins: 2 },
    admins: [{ id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10), name: 'Administrateur' }],
    settings: {
      shop_name: 'H.KAR - Pièces Auto Ferchichi',
      phone1: '+21658835092', phone2: '+216 56 084 023',
      address: 'Sidi Hssin / Face rond point Visite technique',
      facebook: 'https://facebook.com', whatsapp: '+21658835092',
      delivery_fee: '7', currency: 'DT'
    },
    categories: [
      // Brands (parent_id = null)
      { id: 1, name: 'Hyundai', slug: 'hyundai', parent_id: null },
      { id: 2, name: 'KIA', slug: 'kia', parent_id: null },
      { id: 3, name: 'Peugeot', slug: 'peugeot', parent_id: null },
      { id: 4, name: 'Volkswagen', slug: 'volkswagen', parent_id: null },
      // Volkswagen models
      { id: 5, name: 'Golf 4', slug: 'golf4', parent_id: 4 },
      { id: 6, name: 'Golf 5', slug: 'golf5', parent_id: 4 },
      { id: 7, name: 'Golf 6', slug: 'golf6', parent_id: 4 },
      { id: 8, name: 'Golf 7', slug: 'golf7', parent_id: 4 },
      { id: 9, name: 'Passat', slug: 'passat', parent_id: 4 },
      { id: 10, name: 'Polo', slug: 'polo', parent_id: 4 },
      // Peugeot models
      { id: 11, name: 'Peugeot 206', slug: 'peugeot-206', parent_id: 3 },
      { id: 12, name: 'Peugeot 207', slug: 'peugeot-207', parent_id: 3 },
      { id: 13, name: 'Peugeot 208', slug: 'peugeot-208', parent_id: 3 },
      { id: 14, name: 'Peugeot 301', slug: 'peugeot-301', parent_id: 3 },
      { id: 15, name: 'Peugeot 308', slug: 'peugeot-308', parent_id: 3 },
      // Hyundai models
      { id: 16, name: 'Tucson', slug: 'tucson', parent_id: 1 },
      { id: 17, name: 'Accent', slug: 'accent', parent_id: 1 },
      { id: 18, name: 'i10', slug: 'i10', parent_id: 1 },
      { id: 19, name: 'i20', slug: 'i20', parent_id: 1 },
      // KIA models
      { id: 20, name: 'Picanto', slug: 'picanto', parent_id: 2 },
      { id: 21, name: 'Rio', slug: 'rio', parent_id: 2 },
      { id: 22, name: 'Sportage', slug: 'sportage', parent_id: 2 },
      { id: 23, name: 'Cerato', slug: 'cerato', parent_id: 2 }
    ],
    products: [
      { id: 1, name: 'Poignée Porte Intérieur 4 Portes Golf4', slug: 'poignee-porte-interieur-golf4', description: '', price: 37, old_price: null, image: null, category_id: 5, stock: 10, featured: 1, active: 1, created_at: new Date().toISOString() },
      { id: 2, name: 'Pareboue Avant Golf5', slug: 'pareboue-avant-golf5', description: '', price: 40, old_price: null, image: null, category_id: 6, stock: 8, featured: 1, active: 1, created_at: new Date().toISOString() },
      { id: 3, name: 'Kit Antibrouillard Golf4', slug: 'kit-antibrouillard-golf4', description: '', price: 100, old_price: null, image: null, category_id: 5, stock: 5, featured: 1, active: 1, created_at: new Date().toISOString() },
      { id: 4, name: 'Soufflet Vitesse Passat B7', slug: 'soufflet-vitesse-passat-b7', description: '', price: 50, old_price: null, image: null, category_id: 9, stock: 12, featured: 1, active: 1, created_at: new Date().toISOString() },
      { id: 5, name: 'Rétroviseur Gauche Golf5', slug: 'retroviseur-gauche-golf5', description: '', price: 85, old_price: null, image: null, category_id: 6, stock: 6, featured: 1, active: 1, created_at: new Date().toISOString() },
      { id: 6, name: 'Phare Avant Droit Golf6', slug: 'phare-avant-droit-golf6', description: '', price: 250, old_price: null, image: null, category_id: 7, stock: 3, featured: 1, active: 1, created_at: new Date().toISOString() },
      { id: 7, name: 'Pare-choc Avant Peugeot 206', slug: 'pare-choc-avant-peugeot-206', description: '', price: 120, old_price: null, image: null, category_id: 11, stock: 7, featured: 1, active: 1, created_at: new Date().toISOString() },
      { id: 8, name: 'Feu Arrière Gauche 207', slug: 'feu-arriere-gauche-207', description: '', price: 95, old_price: null, image: null, category_id: 12, stock: 9, featured: 1, active: 1, created_at: new Date().toISOString() },
      { id: 9, name: 'Grille Calandre Peugeot 208', slug: 'grille-calandre-peugeot-208', description: '', price: 65, old_price: null, image: null, category_id: 13, stock: 4, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 10, name: 'Capot Peugeot 301', slug: 'capot-peugeot-301', description: '', price: 280, old_price: null, image: null, category_id: 14, stock: 2, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 11, name: 'Rétroviseur Droit Tucson', slug: 'retroviseur-droit-tucson', description: '', price: 150, old_price: null, image: null, category_id: 16, stock: 5, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 12, name: 'Phare Avant Accent', slug: 'phare-avant-accent', description: '', price: 180, old_price: null, image: null, category_id: 17, stock: 4, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 13, name: 'Pare-choc Arrière i10', slug: 'pare-choc-arriere-i10', description: '', price: 90, old_price: null, image: null, category_id: 18, stock: 6, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 14, name: 'Feu Arrière Picanto', slug: 'feu-arriere-picanto', description: '', price: 75, old_price: null, image: null, category_id: 20, stock: 8, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 15, name: 'Grille Avant Rio', slug: 'grille-avant-rio', description: '', price: 55, old_price: null, image: null, category_id: 21, stock: 10, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 16, name: 'Poignée Extérieure Sportage', slug: 'poignee-exterieure-sportage', description: '', price: 45, old_price: null, image: null, category_id: 22, stock: 7, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 17, name: 'Console Vitesse Golf5', slug: 'console-vitesse-golf5', description: '', price: 30, old_price: null, image: null, category_id: 6, stock: 15, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 18, name: '2 Caches Batman Golf6', slug: '2-caches-batman-golf6', description: '', price: 25, old_price: null, image: null, category_id: 7, stock: 20, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 19, name: 'Support Moteur Golf4', slug: 'support-moteur-golf4', description: '', price: 60, old_price: null, image: null, category_id: 5, stock: 4, featured: 0, active: 1, created_at: new Date().toISOString() },
      { id: 20, name: 'Radiateur Eau Polo', slug: 'radiateur-eau-polo', description: '', price: 200, old_price: null, image: null, category_id: 10, stock: 3, featured: 0, active: 1, created_at: new Date().toISOString() },
    ],
    orders: [],
    order_items: []
  };
}

function migrateDB(db) {
  let changed = false;
  // Ensure parent_id field exists on every category
  const brandSlugs = { volkswagen: null, peugeot: null, hyundai: null, kia: null };
  db.categories.forEach(c => {
    if (brandSlugs.hasOwnProperty(c.slug)) brandSlugs[c.slug] = c.id;
  });
  const slugToBrand = {
    golf4: 'volkswagen', golf5: 'volkswagen', golf6: 'volkswagen', golf7: 'volkswagen',
    passat: 'volkswagen', polo: 'volkswagen',
    'peugeot-206': 'peugeot', 'peugeot-207': 'peugeot', 'peugeot-208': 'peugeot',
    'peugeot-301': 'peugeot', 'peugeot-308': 'peugeot',
    tucson: 'hyundai', accent: 'hyundai', i10: 'hyundai', i20: 'hyundai',
    picanto: 'kia', rio: 'kia', sportage: 'kia', cerato: 'kia'
  };
  db.categories.forEach(c => {
    if (c.parent_id === undefined) {
      const brandSlug = slugToBrand[c.slug];
      c.parent_id = brandSlug ? brandSlugs[brandSlug] : null;
      changed = true;
    }
  });
  if (changed) saveDB(db);
  return db;
}

function initDB() {
  let db = loadDB();
  if (!db) {
    db = defaultDB();
    saveDB(db);
    return db;
  }
  return migrateDB(db);
}

let db = initDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use(session({
  secret: 'hkar-secret-key-change-in-production',
  resave: false, saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) return next();
  res.status(401).json({ error: 'Non autorisé' });
}

function getCategory(id) {
  return db.categories.find(c => c.id === id);
}
function getCategoryName(id) {
  const cat = getCategory(id);
  return cat ? cat.name : null;
}
function getCategoryBySlug(slug) {
  return db.categories.find(c => c.slug === slug);
}
function getDescendantCategoryIds(catId) {
  // Returns the cat itself plus all child category ids
  const ids = [catId];
  db.categories.forEach(c => { if (c.parent_id === catId) ids.push(c.id); });
  return ids;
}

// ── Auth API ──
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.admins.find(a => a.username === username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }
  req.session.adminId = admin.id;
  req.session.adminName = admin.name;
  res.json({ success: true, name: admin.name });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({ authenticated: true, name: req.session.adminName });
  }
  res.json({ authenticated: false });
});

// ── Settings API ──
app.get('/api/settings', (req, res) => res.json(db.settings));
app.put('/api/settings', requireAuth, (req, res) => {
  Object.assign(db.settings, req.body);
  saveDB(db);
  res.json({ success: true });
});

// ── Categories API ──
app.get('/api/categories', (req, res) => {
  const cats = [...db.categories]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(c => ({ ...c, parent_name: c.parent_id ? getCategoryName(c.parent_id) : null }));
  res.json(cats);
});

// Brands = top-level categories (parent_id null)
app.get('/api/brands', (req, res) => {
  const brands = db.categories
    .filter(c => !c.parent_id)
    .sort((a, b) => a.name.localeCompare(b.name));
  // include count of models for each
  const withCount = brands.map(b => ({
    ...b,
    model_count: db.categories.filter(c => c.parent_id === b.id).length
  }));
  res.json(withCount);
});

// Models = children of a brand
app.get('/api/brands/:slug/models', (req, res) => {
  const brand = getCategoryBySlug(req.params.slug);
  if (!brand) return res.status(404).json({ error: 'Marque non trouvée' });
  const models = db.categories
    .filter(c => c.parent_id === brand.id)
    .sort((a, b) => a.name.localeCompare(b.name));
  // include product count per model
  const withCount = models.map(m => ({
    ...m,
    product_count: db.products.filter(p => p.category_id === m.id && p.active).length
  }));
  res.json({ brand, models: withCount });
});

// Nav tree: brands with their models in one call
app.get('/api/nav', (req, res) => {
  const brands = db.categories.filter(c => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name));
  const tree = brands.map(b => ({
    ...b,
    models: db.categories.filter(c => c.parent_id === b.id).sort((a, b) => a.name.localeCompare(b.name))
  }));
  res.json(tree);
});

app.get('/api/categories/:id', (req, res) => {
  const cat = getCategory(parseInt(req.params.id));
  if (!cat) return res.status(404).json({ error: 'Catégorie non trouvée' });
  res.json(cat);
});

app.post('/api/categories', requireAuth, upload.single('image'), (req, res) => {
  const id = db.nextId.categories++;
  const parent_id = req.body.parent_id ? parseInt(req.body.parent_id) : null;
  const cat = {
    id, name: req.body.name, slug: slugify(req.body.name),
    parent_id, image: req.file ? '/uploads/' + req.file.filename : null
  };
  db.categories.push(cat);
  saveDB(db);
  res.json({ id });
});

app.put('/api/categories/:id', requireAuth, upload.single('image'), (req, res) => {
  const cat = getCategory(parseInt(req.params.id));
  if (!cat) return res.status(404).json({ error: 'Catégorie non trouvée' });
  cat.name = req.body.name;
  cat.slug = slugify(req.body.name);
  cat.parent_id = req.body.parent_id ? parseInt(req.body.parent_id) : null;
  if (req.file) cat.image = '/uploads/' + req.file.filename;
  saveDB(db);
  res.json({ success: true });
});

app.delete('/api/categories/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  // Reparent any children to null (turn them into brands) so they aren't orphaned
  db.categories.forEach(c => { if (c.parent_id === id) c.parent_id = null; });
  db.categories = db.categories.filter(c => c.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// ── Products API ──
app.get('/api/products', (req, res) => {
  const { category, search, featured, page = 1, limit = 20, sort } = req.query;
  let products = db.products.filter(p => p.active);

  if (category) {
    const cat = db.categories.find(c => c.slug === category || c.id === parseInt(category));
    if (cat) {
      const allowed = getDescendantCategoryIds(cat.id);
      products = products.filter(p => allowed.includes(p.category_id));
    }
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q));
  }
  if (featured === '1') products = products.filter(p => p.featured);

  if (sort === 'price_asc') products.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
  else if (sort === 'name') products.sort((a, b) => a.name.localeCompare(b.name));
  else products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = products.length;
  const lim = parseInt(limit);
  const pg = parseInt(page);
  const offset = (pg - 1) * lim;
  const paged = products.slice(offset, offset + lim).map(p => ({ ...p, category_name: getCategoryName(p.category_id) }));

  res.json({ products: paged, total, page: pg, pages: Math.ceil(total / lim) });
});

app.get('/api/products/all', requireAuth, (req, res) => {
  const { search, category, page = 1, limit = 20 } = req.query;
  let products = [...db.products];

  if (category) products = products.filter(p => p.category_id === parseInt(category));
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q));
  }
  products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = products.length;
  const lim = parseInt(limit);
  const pg = parseInt(page);
  const offset = (pg - 1) * lim;
  const paged = products.slice(offset, offset + lim).map(p => ({ ...p, category_name: getCategoryName(p.category_id) }));

  res.json({ products: paged, total, page: pg, pages: Math.ceil(total / lim) });
});

app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
  res.json({ ...product, category_name: getCategoryName(product.category_id) });
});

app.post('/api/products', requireAuth, upload.single('image'), (req, res) => {
  const id = db.nextId.products++;
  const { name, description, price, old_price, category_id, stock, featured, active } = req.body;
  const product = {
    id, name, slug: slugify(name), description: description || '',
    price: parseFloat(price), old_price: old_price ? parseFloat(old_price) : null,
    image: req.file ? '/uploads/' + req.file.filename : null,
    category_id: category_id ? parseInt(category_id) : null,
    stock: parseInt(stock) || 0, featured: featured === '1' ? 1 : 0,
    active: active !== '0' ? 1 : 0, created_at: new Date().toISOString()
  };
  db.products.push(product);
  saveDB(db);
  res.json({ id });
});

app.put('/api/products/:id', requireAuth, upload.single('image'), (req, res) => {
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
  const { name, description, price, old_price, category_id, stock, featured, active } = req.body;
  product.name = name;
  product.slug = slugify(name);
  product.description = description || '';
  product.price = parseFloat(price);
  product.old_price = old_price ? parseFloat(old_price) : null;
  product.category_id = category_id ? parseInt(category_id) : null;
  product.stock = parseInt(stock) || 0;
  product.featured = featured === '1' ? 1 : 0;
  product.active = active !== '0' ? 1 : 0;
  if (req.file) product.image = '/uploads/' + req.file.filename;
  saveDB(db);
  res.json({ success: true });
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
  db.products = db.products.filter(p => p.id !== parseInt(req.params.id));
  saveDB(db);
  res.json({ success: true });
});

// ── Orders API ──
app.post('/api/orders', (req, res) => {
  const { customer_name, phone, region, address, items, notes } = req.body;
  if (!customer_name || !phone || !region || !address || !items || !items.length) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  // ── Stock validation ──
  for (const item of items) {
    const product = db.products.find(p => p.id === item.product_id);
    if (!product) {
      return res.status(400).json({ error: `Produit introuvable: ${item.product_name}` });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ error: `Rupture de stock: ${product.name}` });
    }
    if (item.quantity > product.stock) {
      return res.status(400).json({
        error: `Stock insuffisant pour ${product.name}. Disponible: ${product.stock}, demandé: ${item.quantity}`
      });
    }
  }

  let total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = parseFloat(db.settings.delivery_fee || '7');
  total += deliveryFee;

  const id = db.nextId.orders++;
  const order = { id, customer_name, phone, region, address, total, status: 'nouvelle', notes: notes || '', created_at: new Date().toISOString() };
  db.orders.push(order);

  items.forEach(item => {
    db.order_items.push({ order_id: id, product_id: item.product_id, product_name: item.product_name, quantity: item.quantity, price: item.price });
    // Decrement stock
    const product = db.products.find(p => p.id === item.product_id);
    if (product) product.stock = Math.max(0, product.stock - item.quantity);
  });
  saveDB(db);
  res.json({ id, total });
});

app.get('/api/orders', requireAuth, (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  let orders = [...db.orders];

  if (status && status !== 'all') orders = orders.filter(o => o.status === status);
  if (search) {
    const q = search.toLowerCase();
    orders = orders.filter(o => o.customer_name.toLowerCase().includes(q) || o.phone.includes(q) || o.id.toString() === q);
  }
  orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = orders.length;
  const lim = parseInt(limit);
  const pg = parseInt(page);
  const offset = (pg - 1) * lim;
  const paged = orders.slice(offset, offset + lim);

  res.json({ orders: paged, total, page: pg, pages: Math.ceil(total / lim) });
});

app.get('/api/orders/:id', requireAuth, (req, res) => {
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
  const items = db.order_items.filter(i => i.order_id === order.id);
  res.json({ ...order, items });
});

app.put('/api/orders/:id/status', requireAuth, (req, res) => {
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
  const oldStatus = order.status;
  const newStatus = req.body.status;
  order.status = newStatus;

  // If cancelling an order, restore the stock
  if (newStatus === 'annulée' && oldStatus !== 'annulée') {
    const items = db.order_items.filter(i => i.order_id === order.id);
    items.forEach(item => {
      const p = db.products.find(p => p.id === item.product_id);
      if (p) p.stock += item.quantity;
    });
  }
  saveDB(db);
  res.json({ success: true });
});

app.delete('/api/orders/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  db.orders = db.orders.filter(o => o.id !== id);
  db.order_items = db.order_items.filter(i => i.order_id !== id);
  saveDB(db);
  res.json({ success: true });
});

// ── Dashboard Stats ──
app.get('/api/stats', requireAuth, (req, res) => {
  const totalProducts = db.products.length;
  const totalOrders = db.orders.length;
  const newOrders = db.orders.filter(o => o.status === 'nouvelle').length;
  const totalRevenue = db.orders.filter(o => o.status === 'livrée').reduce((s, o) => s + o.total, 0);
  const totalCategories = db.categories.length;
  const recentOrders = [...db.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const statusCounts = {};
  db.orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
  const outOfStock = db.products.filter(p => p.active && p.stock === 0).length;

  res.json({ totalProducts, totalOrders, newOrders, totalRevenue, totalCategories, recentOrders, ordersByStatus, outOfStock });
});

// ── Admin password change ──
app.put('/api/auth/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = db.admins.find(a => a.id === req.session.adminId);
  if (!bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
  }
  admin.password = bcrypt.hashSync(newPassword, 10);
  saveDB(db);
  res.json({ success: true });
});

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ======================================`);
  console.log(`   H.KAR Shop - Serveur demarre`);
  console.log(`  `);
  console.log(`   Boutique:  http://localhost:${PORT}`);
  console.log(`   Admin:     http://localhost:${PORT}/admin`);
  console.log(`  `);
  console.log(`   Login: admin / admin123`);
  console.log(`  ======================================\n`);
});
