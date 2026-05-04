// ── State ──
let categories = [];
let currentProductPage = 1;
let currentOrderPage = 1;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupNavigation();
});

// ── Auth ──
async function checkAuth() {
  const res = await fetch('/api/auth/check');
  const data = await res.json();
  if (data.authenticated) {
    showAdmin(data.name);
  }
}

async function doLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPass').value;
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.success) {
    showAdmin(data.name);
  } else {
    document.getElementById('loginError').textContent = data.error || 'Erreur de connexion';
  }
}

async function doLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  document.getElementById('adminLayout').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

function showAdmin(name) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  document.getElementById('adminName').textContent = name;
  loadDashboard();
  loadCategories();
}

// ── Navigation ──
function setupNavigation() {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');

  const titles = {
    dashboard: 'Tableau de bord',
    products: 'Gestion des produits',
    orders: 'Gestion des commandes',
    categories: 'Gestion des catégories',
    settings: 'Paramètres'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  if (page === 'dashboard') loadDashboard();
  if (page === 'products') loadAdminProducts();
  if (page === 'orders') loadAdminOrders();
  if (page === 'categories') loadAdminCategories();
  if (page === 'settings') loadSettings();

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Dashboard ──
async function loadDashboard() {
  const res = await fetch('/api/stats');
  const data = await res.json();

  document.getElementById('statProducts').textContent = data.totalProducts;
  document.getElementById('statOrders').textContent = data.totalOrders;
  document.getElementById('statNewOrders').textContent = data.newOrders;
  document.getElementById('statRevenue').textContent = data.totalRevenue.toFixed(2);
  const oosEl = document.getElementById('statOutOfStock');
  if (oosEl) oosEl.textContent = data.outOfStock || 0;

  const badge = document.getElementById('newOrdersBadge');
  if (data.newOrders > 0) {
    badge.textContent = data.newOrders;
    badge.classList.add('show');
  } else {
    badge.classList.remove('show');
  }

  // Recent orders
  const tbody = document.getElementById('recentOrdersTable');
  tbody.innerHTML = data.recentOrders.map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${escapeHtml(o.customer_name)}</td>
      <td><strong>${o.total.toFixed(2)} DT</strong></td>
      <td>${statusBadge(o.status)}</td>
      <td>${formatDate(o.created_at)}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--gray)">Aucune commande</td></tr>';

  // Orders by status chart
  const chart = document.getElementById('ordersByStatus');
  const maxCount = Math.max(...data.ordersByStatus.map(s => s.count), 1);
  const colors = { nouvelle: 'var(--info)', confirmée: 'var(--primary)', 'en cours': 'var(--warning)', livrée: 'var(--success)', annulée: 'var(--danger)' };
  chart.innerHTML = data.ordersByStatus.map(s => `
    <div class="status-bar">
      <span class="status-bar-label">${s.status}</span>
      <div class="status-bar-track">
        <div class="status-bar-fill" style="width:${(s.count / maxCount) * 100}%;background:${colors[s.status] || 'var(--gray)'}">
          ${s.count}
        </div>
      </div>
    </div>
  `).join('') || '<p style="color:var(--gray);text-align:center">Aucune donnée</p>';
}

// ── Categories ──
async function loadCategories() {
  const res = await fetch('/api/categories');
  categories = await res.json();
  populateCategorySelects();
}

function populateCategorySelects() {
  const selects = ['productCategory', 'productCatFilter'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const firstOpt = id === 'productCatFilter' ? '<option value="">Toutes les catégories</option>' : '<option value="">-- Aucune --</option>';
    el.innerHTML = firstOpt + categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  });
}

async function loadAdminCategories() {
  await loadCategories();
  populateCategoryParentSelect();
  const filter = document.getElementById('categoryTypeFilter')?.value || 'all';
  let list = categories;
  if (filter === 'brands') list = categories.filter(c => !c.parent_id);
  else if (filter === 'models') list = categories.filter(c => c.parent_id);

  const tbody = document.getElementById('categoriesTable');
  tbody.innerHTML = list.map(c => {
    const isBrand = !c.parent_id;
    const typeBadge = isBrand
      ? '<span class="badge badge-active"><i class="fas fa-flag"></i> Marque</span>'
      : '<span class="badge badge-inactive" style="background:#e3f2fd;color:#1976d2"><i class="fas fa-car-side"></i> Modèle</span>';
    const parent = c.parent_name ? escapeHtml(c.parent_name) : '<em style="color:var(--gray)">-</em>';
    return `
      <tr>
        <td>${c.id}</td>
        <td>${typeBadge}</td>
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>${parent}</td>
        <td><code>${c.slug}</code></td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-icon-edit" onclick="editCategory(${c.id})" title="Modifier"><i class="fas fa-pen"></i></button>
            <button class="btn-icon btn-icon-delete" onclick="confirmDelete('category', ${c.id}, '${escapeHtml(c.name)}')" title="Supprimer"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--gray);padding:40px">Aucune catégorie</td></tr>';
}

function populateCategoryParentSelect() {
  const sel = document.getElementById('categoryParent');
  if (!sel) return;
  const brands = categories.filter(c => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name));
  sel.innerHTML = '<option value="">-- Choisir une marque --</option>' +
    brands.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('');
}

function toggleCategoryParent() {
  const type = document.querySelector('input[name="categoryType"]:checked').value;
  const grp = document.getElementById('parentBrandGroup');
  const sel = document.getElementById('categoryParent');
  if (type === 'model') {
    grp.style.display = 'block';
    sel.required = true;
  } else {
    grp.style.display = 'none';
    sel.required = false;
    sel.value = '';
  }
}

function openCategoryModal(cat) {
  populateCategoryParentSelect();
  document.getElementById('categoryId').value = cat ? cat.id : '';
  document.getElementById('categoryName').value = cat ? cat.name : '';

  const isModel = cat && cat.parent_id;
  document.querySelector(`input[name="categoryType"][value="${isModel ? 'model' : 'brand'}"]`).checked = true;
  toggleCategoryParent();
  if (isModel) document.getElementById('categoryParent').value = cat.parent_id;

  document.getElementById('categoryModalTitle').textContent = cat ? 'Modifier la catégorie' : 'Nouvelle catégorie';
  openModal('categoryModal');
}

function editCategory(id) {
  const cat = categories.find(c => c.id === id);
  if (cat) openCategoryModal(cat);
}

async function saveCategory(e) {
  e.preventDefault();
  const id = document.getElementById('categoryId').value;
  const name = document.getElementById('categoryName').value;
  const type = document.querySelector('input[name="categoryType"]:checked').value;
  const parentId = type === 'model' ? document.getElementById('categoryParent').value : '';

  if (type === 'model' && !parentId) {
    toast('Veuillez choisir une marque parente', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  if (parentId) formData.append('parent_id', parentId);

  const url = id ? `/api/categories/${id}` : '/api/categories';
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, { method, body: formData });
  const data = await res.json();

  if (data.success || data.id) {
    toast(id ? 'Catégorie modifiée' : (type === 'brand' ? 'Marque ajoutée — elle apparaîtra dans le menu' : 'Modèle ajouté'), 'success');
    closeModal('categoryModal');
    loadAdminCategories();
  } else {
    toast('Erreur: ' + (data.error || 'Veuillez réessayer'), 'error');
  }
}

// ── Products ──
async function loadAdminProducts() {
  const search = document.getElementById('productSearch')?.value || '';
  const category = document.getElementById('productCatFilter')?.value || '';

  let url = `/api/products/all?page=${currentProductPage}&limit=15`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (category) url += `&category=${category}`;

  const res = await fetch(url);
  const data = await res.json();

  const tbody = document.getElementById('productsTable');
  tbody.innerHTML = data.products.map(p => {
    let stockCell;
    if (p.stock <= 0) stockCell = '<span class="badge badge-inactive"><i class="fas fa-times-circle"></i> Rupture</span>';
    else if (p.stock <= 3) stockCell = `<span class="badge" style="background:#fff8e1;color:#f57c00"><i class="fas fa-exclamation-triangle"></i> ${p.stock} (faible)</span>`;
    else stockCell = `<strong>${p.stock}</strong>`;
    return `
      <tr>
        <td><img class="table-img" src="${p.image || '/images/placeholder.svg'}" alt="${escapeHtml(p.name)}"></td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${p.category_name || '-'}</td>
        <td><strong>${p.price.toFixed(2)} DT</strong></td>
        <td>${stockCell}</td>
        <td>${p.active ? '<span class="badge badge-active">Actif</span>' : '<span class="badge badge-inactive">Inactif</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-icon-edit" onclick="editProduct(${p.id})" title="Modifier"><i class="fas fa-pen"></i></button>
            <button class="btn-icon btn-icon-delete" onclick="confirmDelete('product', ${p.id}, '${escapeHtml(p.name)}')" title="Supprimer"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--gray);padding:40px">Aucun produit trouvé</td></tr>';

  renderPagination('productsPagination', data.page, data.pages, p => { currentProductPage = p; loadAdminProducts(); });
}

function openProductModal(product) {
  document.getElementById('productId').value = '';
  document.getElementById('productName').value = '';
  document.getElementById('productCategory').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productOldPrice').value = '';
  document.getElementById('productStock').value = '0';
  document.getElementById('productFeatured').checked = false;
  document.getElementById('productActive').checked = true;
  document.getElementById('productDescription').value = '';
  document.getElementById('productImage').value = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('fileLabel').innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Cliquez pour choisir une image</span>';
  document.getElementById('productModalTitle').textContent = 'Nouveau produit';
  openModal('productModal');
}

async function editProduct(id) {
  const res = await fetch(`/api/products/${id}`);
  const p = await res.json();
  document.getElementById('productId').value = p.id;
  document.getElementById('productName').value = p.name;
  document.getElementById('productCategory').value = p.category_id || '';
  document.getElementById('productPrice').value = p.price;
  document.getElementById('productOldPrice').value = p.old_price || '';
  document.getElementById('productStock').value = p.stock;
  document.getElementById('productFeatured').checked = !!p.featured;
  document.getElementById('productActive').checked = !!p.active;
  document.getElementById('productDescription').value = p.description || '';
  document.getElementById('productImage').value = '';

  if (p.image) {
    document.getElementById('imagePreview').src = p.image;
    document.getElementById('imagePreview').style.display = 'block';
  } else {
    document.getElementById('imagePreview').style.display = 'none';
  }

  document.getElementById('productModalTitle').textContent = 'Modifier le produit';
  openModal('productModal');
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const formData = new FormData();
  formData.append('name', document.getElementById('productName').value);
  formData.append('category_id', document.getElementById('productCategory').value);
  formData.append('price', document.getElementById('productPrice').value);
  formData.append('old_price', document.getElementById('productOldPrice').value);
  formData.append('stock', document.getElementById('productStock').value);
  formData.append('featured', document.getElementById('productFeatured').checked ? '1' : '0');
  formData.append('active', document.getElementById('productActive').checked ? '1' : '0');
  formData.append('description', document.getElementById('productDescription').value);

  const imageFile = document.getElementById('productImage').files[0];
  if (imageFile) formData.append('image', imageFile);

  const url = id ? `/api/products/${id}` : '/api/products';
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, { method, body: formData });
  const data = await res.json();

  if (data.success || data.id) {
    toast(id ? 'Produit modifié avec succès' : 'Produit ajouté avec succès', 'success');
    closeModal('productModal');
    loadAdminProducts();
    loadDashboard();
  } else {
    toast('Erreur: ' + (data.error || 'Veuillez réessayer'), 'error');
  }
}

function previewImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('imagePreview').src = e.target.result;
      document.getElementById('imagePreview').style.display = 'block';
      document.getElementById('fileLabel').innerHTML = `<i class="fas fa-check-circle"></i><span>${input.files[0].name}</span>`;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// ── Orders ──
async function loadAdminOrders() {
  const search = document.getElementById('orderSearch')?.value || '';
  const status = document.getElementById('orderStatusFilter')?.value || 'all';

  let url = `/api/orders?page=${currentOrderPage}&limit=15`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status !== 'all') url += `&status=${status}`;

  const res = await fetch(url);
  const data = await res.json();

  const tbody = document.getElementById('ordersTable');
  tbody.innerHTML = data.orders.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${escapeHtml(o.customer_name)}</td>
      <td><a href="tel:${o.phone}">${o.phone}</a></td>
      <td>${escapeHtml(o.region)}</td>
      <td><strong>${o.total.toFixed(2)} DT</strong></td>
      <td>
        <select class="order-status-select" onchange="updateOrderStatus(${o.id}, this.value)">
          <option value="nouvelle" ${o.status === 'nouvelle' ? 'selected' : ''}>Nouvelle</option>
          <option value="confirmée" ${o.status === 'confirmée' ? 'selected' : ''}>Confirmée</option>
          <option value="en cours" ${o.status === 'en cours' ? 'selected' : ''}>En cours</option>
          <option value="livrée" ${o.status === 'livrée' ? 'selected' : ''}>Livrée</option>
          <option value="annulée" ${o.status === 'annulée' ? 'selected' : ''}>Annulée</option>
        </select>
      </td>
      <td>${formatDate(o.created_at)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-icon-view" onclick="viewOrder(${o.id})" title="Voir"><i class="fas fa-eye"></i></button>
          <button class="btn-icon btn-icon-delete" onclick="confirmDelete('order', ${o.id}, '#${o.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--gray);padding:40px">Aucune commande trouvée</td></tr>';

  renderPagination('ordersPagination', data.page, data.pages, p => { currentOrderPage = p; loadAdminOrders(); });
}

async function viewOrder(id) {
  const res = await fetch(`/api/orders/${id}`);
  const o = await res.json();

  document.getElementById('orderModalTitle').textContent = `Commande #${o.id}`;
  document.getElementById('orderDetail').innerHTML = `
    <div class="order-info-grid">
      <div class="order-info-item">
        <label>Client</label>
        <span>${escapeHtml(o.customer_name)}</span>
      </div>
      <div class="order-info-item">
        <label>Téléphone</label>
        <span><a href="tel:${o.phone}">${o.phone}</a></span>
      </div>
      <div class="order-info-item">
        <label>Région</label>
        <span>${escapeHtml(o.region)}</span>
      </div>
      <div class="order-info-item">
        <label>Adresse</label>
        <span>${escapeHtml(o.address)}</span>
      </div>
      <div class="order-info-item">
        <label>Total</label>
        <span><strong style="color:var(--primary);font-size:1.2rem">${o.total.toFixed(2)} DT</strong></span>
      </div>
      <div class="order-info-item">
        <label>Statut</label>
        <span>${statusBadge(o.status)}</span>
      </div>
      <div class="order-info-item">
        <label>Date</label>
        <span>${formatDate(o.created_at)}</span>
      </div>
      ${o.notes ? `<div class="order-info-item"><label>Notes</label><span>${escapeHtml(o.notes)}</span></div>` : ''}
    </div>
    <h4 class="order-items-title"><i class="fas fa-box" style="color:var(--primary)"></i> Articles commandés</h4>
    <table class="table">
      <thead><tr><th>Produit</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead>
      <tbody>
        ${o.items.map(item => `
          <tr>
            <td>${escapeHtml(item.product_name)}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)} DT</td>
            <td><strong>${(item.price * item.quantity).toFixed(2)} DT</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  openModal('orderModal');
}

async function updateOrderStatus(id, status) {
  const res = await fetch(`/api/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (data.success) {
    toast(`Commande #${id} : ${status}`, 'success');
    loadDashboard();
  }
}

// ── Settings ──
async function loadSettings() {
  const res = await fetch('/api/settings');
  const s = await res.json();
  document.getElementById('set_shop_name').value = s.shop_name || '';
  document.getElementById('set_phone1').value = s.phone1 || '';
  document.getElementById('set_phone2').value = s.phone2 || '';
  document.getElementById('set_address').value = s.address || '';
  document.getElementById('set_facebook').value = s.facebook || '';
  document.getElementById('set_whatsapp').value = s.whatsapp || '';
  document.getElementById('set_delivery_fee').value = s.delivery_fee || '7';
}

async function saveSettings(e) {
  e.preventDefault();
  const settings = {
    shop_name: document.getElementById('set_shop_name').value,
    phone1: document.getElementById('set_phone1').value,
    phone2: document.getElementById('set_phone2').value,
    address: document.getElementById('set_address').value,
    facebook: document.getElementById('set_facebook').value,
    whatsapp: document.getElementById('set_whatsapp').value,
    delivery_fee: document.getElementById('set_delivery_fee').value,
  };
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  const data = await res.json();
  if (data.success) toast('Paramètres enregistrés', 'success');
  else toast('Erreur lors de la sauvegarde', 'error');
}

async function changePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    toast('Les mots de passe ne correspondent pas', 'error');
    return;
  }

  const res = await fetch('/api/auth/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await res.json();
  if (data.success) {
    toast('Mot de passe changé avec succès', 'success');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  } else {
    toast(data.error || 'Erreur', 'error');
  }
}

// ── Delete ──
function confirmDelete(type, id, name) {
  const messages = {
    product: `Voulez-vous vraiment supprimer le produit "${name}" ?`,
    category: `Voulez-vous vraiment supprimer la catégorie "${name}" ?`,
    order: `Voulez-vous vraiment supprimer la commande ${name} ?`
  };
  document.getElementById('confirmMessage').textContent = messages[type];
  document.getElementById('confirmBtn').onclick = () => doDelete(type, id);
  openModal('confirmModal');
}

async function doDelete(type, id) {
  const urls = { product: `/api/products/${id}`, category: `/api/categories/${id}`, order: `/api/orders/${id}` };
  const res = await fetch(urls[type], { method: 'DELETE' });
  const data = await res.json();
  closeModal('confirmModal');
  if (data.success) {
    toast('Supprimé avec succès', 'success');
    if (type === 'product') loadAdminProducts();
    if (type === 'category') loadAdminCategories();
    if (type === 'order') loadAdminOrders();
    loadDashboard();
  } else {
    toast('Erreur lors de la suppression', 'error');
  }
}

// ── Helpers ──
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function statusBadge(status) {
  const cls = status.replace(/\s+/g, '-');
  return `<span class="badge badge-${cls}">${status}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderPagination(containerId, current, total, callback) {
  const container = document.getElementById(containerId);
  if (!container || total <= 1) { if (container) container.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= total; i++) {
    html += `<button class="${i === current ? 'active' : ''}" onclick="(${callback})(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `admin-toast ${type}`;
  el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

let debounceTimers = {};
function debounce(fn, delay) {
  return function (...args) {
    clearTimeout(debounceTimers[fn.name]);
    debounceTimers[fn.name] = setTimeout(() => fn(...args), delay);
  };
}
