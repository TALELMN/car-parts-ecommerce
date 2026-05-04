// Cart helpers
function getCart() {
  return JSON.parse(localStorage.getItem('hkar_cart') || '[]');
}

async function addToCart(id, name, price, image, stock) {
  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  const currentQty = existing ? existing.quantity : 0;

  // Re-fetch stock to be safe (admin may have changed it)
  let availableStock = stock;
  if (availableStock === undefined || availableStock === null) {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) availableStock = (await res.json()).stock;
    } catch (e) {}
  }

  if (availableStock !== undefined && availableStock !== null) {
    if (availableStock <= 0) {
      showToast('Rupture de stock', true);
      return false;
    }
    if (currentQty + 1 > availableStock) {
      showToast(`Stock insuffisant. Maximum: ${availableStock}`, true);
      return false;
    }
  }

  if (existing) existing.quantity++;
  else cart.push({ id, name, price, image, quantity: 1, stock: availableStock });
  localStorage.setItem('hkar_cart', JSON.stringify(cart));
  updateCartCount();
  return true;
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = count);
}

// Product card template (stock-aware)
function productCard(p) {
  const imgSrc = p.image || '/images/placeholder.svg';
  const hasImage = !!p.image;
  const outOfStock = p.stock <= 0;
  const lowStock = p.stock > 0 && p.stock <= 3;

  return `
    <div class="product-card ${outOfStock ? 'product-out-of-stock' : ''}">
      ${outOfStock ? '<div class="stock-overlay">RUPTURE DE STOCK</div>' : ''}
      ${lowStock ? `<div class="stock-badge">Plus que ${p.stock}!</div>` : ''}
      <a href="/product.html?id=${p.id}" class="product-card-img">
        ${hasImage
          ? `<img src="${imgSrc}" alt="${p.name}" loading="lazy">`
          : `<div class="placeholder-img"><i class="fas fa-car-side"></i></div>`}
      </a>
      <div class="product-card-body">
        <a href="/product.html?id=${p.id}">
          <h3 class="product-card-name">${p.name}</h3>
        </a>
        <p class="product-card-price">${p.price.toFixed(2)} DT</p>
        ${outOfStock
          ? `<button class="product-card-btn btn-disabled" disabled><i class="fas fa-ban"></i> Indisponible</button>`
          : `<button class="product-card-btn" onclick="event.preventDefault(); addToCart(${p.id}, '${p.name.replace(/'/g,"\\'")}', ${p.price}, '${p.image || ''}', ${p.stock}).then(ok => { if (ok) showToast('Produit ajouté au panier !'); })">
              <i class="fas fa-cart-plus"></i> Ajouter au Panier
            </button>`}
      </div>
    </div>
  `;
}

// Dynamic Navigation
async function renderNav() {
  const navEl = document.getElementById('mainNav');
  const mobileEl = document.getElementById('mobileMenu');
  if (!navEl) return;

  let tree = [];
  try {
    const res = await fetch('/api/nav');
    tree = await res.json();
  } catch (e) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const activeCat = params.get('category');
  const path = window.location.pathname;
  const isHome = path === '/' || path === '/index.html';
  const isAllProducts = path === '/products.html' && !activeCat;

  let html = `<a href="/" class="nav-link ${isHome ? 'active' : ''}">ACCUEIL</a>`;

  tree.forEach(brand => {
    const isActive = activeCat === brand.slug || params.get('slug') === brand.slug;
    if (brand.models.length > 0) {
      html += `
        <div class="nav-dropdown">
          <a href="/brand.html?slug=${brand.slug}" class="nav-link ${isActive ? 'active' : ''}">
            ${brand.name.toUpperCase()} <i class="fas fa-chevron-down"></i>
          </a>
          <div class="dropdown-content">
            <a href="/brand.html?slug=${brand.slug}" class="dropdown-all">
              <i class="fas fa-th-large"></i> Tous les modèles
            </a>
            ${brand.models.map(m => `<a href="/products.html?category=${m.slug}">${m.name}</a>`).join('')}
          </div>
        </div>
      `;
    } else {
      html += `<a href="/brand.html?slug=${brand.slug}" class="nav-link ${isActive ? 'active' : ''}">${brand.name.toUpperCase()}</a>`;
    }
  });

  html += `<a href="/products.html" class="nav-link ${isAllProducts ? 'active' : ''}">TOUTES LES PIÈCES</a>`;
  navEl.innerHTML = html;

  // Mobile menu
  if (mobileEl) {
    let mhtml = `<button class="mobile-close" onclick="toggleMobileMenu()"><i class="fas fa-times"></i></button>`;
    mhtml += `<a href="/">Accueil</a>`;
    tree.forEach(brand => {
      mhtml += `<a href="/brand.html?slug=${brand.slug}"><strong>${brand.name}</strong></a>`;
      brand.models.forEach(m => {
        mhtml += `<a href="/products.html?category=${m.slug}" style="padding-left:32px;font-size:0.9rem;">→ ${m.name}</a>`;
      });
    });
    mhtml += `<a href="/products.html">Toutes les pièces</a>`;
    mhtml += `<a href="/cart.html"><i class="fas fa-shopping-cart"></i> Panier</a>`;
    mobileEl.innerHTML = mhtml;
  }
}

// Search
function toggleSearch() {
  document.getElementById('searchBar').classList.toggle('active');
  const input = document.getElementById('searchInput');
  if (input) input.focus();
}

function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (q) window.location.href = '/products.html?search=' + encodeURIComponent(q);
}

// Mobile menu
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('active');
}

// Toast notification
function showToast(msg, isError) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : ' success');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
