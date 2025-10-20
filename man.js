// ==================== CẤU HÌNH API TƯƠNG THÍCH LOCAL / GITHUB ====================
const IS_REMOTE =
  location.hostname.endsWith("github.io") ||
  location.hostname.endsWith("vercel.app");

const LOCAL_API_BASE = "http://localhost:3000";
const LOCAL_PRODUCTS_URL = `${LOCAL_API_BASE}/products`;
const REMOTE_PRODUCTS_URL = "https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json";

// Choose correct URL for reads
const PRODUCTS_URL = IS_REMOTE ? REMOTE_PRODUCTS_URL : LOCAL_PRODUCTS_URL;

// Shared cache for product data across pages (listing, detail, cart)
window.PRODUCT_CACHE = window.PRODUCT_CACHE || { list: null, map: null, ts: 0 };

// Admin flag (from ?admin=1 or localStorage)
window.IS_ADMIN = new URLSearchParams(location.search).get('admin') === '1' || localStorage.getItem('isAdmin') === 'true';

// ==================== UTILITIES ====================
function formatCurrency(value) {
  const num = Number(value) || 0;
  return `${num.toLocaleString()} đ`;
}

function debounce(fn, delay = 200) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function safeGet(id) {
  return document.getElementById(id);
}

function isLocal() {
  return !IS_REMOTE;
}

// ==================== Product class ====================
class Product {
  constructor(id, name, price, image, category, hot, description) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.image = image;
    this.category = category;
    this.hot = hot;
    this.description = description;
  }

  render() {
    return `
      <div class="product${this.hot ? ' hot' : ''}" data-id="${this.id}">
        <img src="${this.image}" alt="${this.name}">
        <a href="detail.html?id=${this.id}">
          <h3>${this.name}</h3>
        </a>
        <p class="price">${formatCurrency(this.price)}</p>
        <button class="btn-add-inline" data-id="${this.id}">Thêm</button>
      </div>
    `;
  }

  renderDetail() {
    return `
      <div class="product-detail">
        <img src="${this.image}" alt="${this.name}">
        <div class="info">
          <h2>${this.name}</h2>
          <p>Giá: ${formatCurrency(this.price)}</p>
          <p class="desc">${this.description || ''}</p>
          <div class="detail-controls">
            <input type="number" id="qty-${this.id}" min="1" value="1" style="width:70px">
            <button id="addCartBtn" productId="${this.id}">Thêm vào giỏ hàng</button>
          </div>
        </div>
      </div>
    `;
  }
}

// ==================== FETCH HELPERS ====================
async function fetchProducts() {
  try {
    // if remote and we used raw github URL, that JSON might be array or object; treat both
    const res = await fetch(PRODUCTS_URL);
    if (!res.ok) throw new Error("Lỗi khi tải sản phẩm");
    const data = await res.json();
    // remote raw might return an object with "products" key or array of products
    const list = Array.isArray(data) ? data : data.products ? data.products : [];
    // hydrate cache
    window.PRODUCT_CACHE.list = list;
    window.PRODUCT_CACHE.map = new Map(list.map(p => [p.id, p]));
    window.PRODUCT_CACHE.ts = Date.now();
    return list;
  } catch (e) {
    console.error("fetchProducts error:", e);
    return [];
  }
}

async function fetchProductById(id) {
  if (!id) return null;
  // prefer cache
  if (window.PRODUCT_CACHE.map && window.PRODUCT_CACHE.map.has(Number(id))) {
    return window.PRODUCT_CACHE.map.get(Number(id));
  }
  try {
    if (isLocal()) {
      const res = await fetch(`${LOCAL_PRODUCTS_URL}/${id}`);
      if (!res.ok) throw new Error("Không tìm thấy sản phẩm");
      const p = await res.json();
      return p;
    } else {
      const list = await fetchProducts();
      return list.find(p => String(p.id) === String(id)) || null;
    }
  } catch (e) {
    console.error("fetchProductById error:", e);
    return null;
  }
}

// ==================== RENDER HELPERS ====================
function renderProduct(array = [], theDiv) {
  if (!theDiv) return;
  const html = array.map(d => {
    const p = new Product(d.id, d.name, d.price, d.image, d.category, d.hot, d.description);
    return p.render();
  }).join('');
  theDiv.innerHTML = html;
}

// ==================== PAGES: Home (hot, phone, laptop) ====================
const hotDiv = safeGet('hot');
const menDiv = safeGet('men');
const womenDiv = safeGet('women');

if (hotDiv || menDiv || womenDiv) {
  // load from local if local else remote
  (async () => {
    const data = await fetchProducts();
    if (!data || data.length === 0) {
      if (hotDiv) hotDiv.innerHTML = '<p>Không có dữ liệu</p>';
      if (menDiv) menDiv.innerHTML = '<p>Không có dữ liệu</p>';
      if (womenDiv) womenDiv.innerHTML = '<p>Không có dữ liệu</p>';
      return;
    }
    const dataHot = data.filter(p => p.hot === true);
    const dataPhone = data.filter(p => p.category === "điện thoại");
    const dataLaptop = data.filter(p => p.category === "laptop");
    if (hotDiv) renderProduct(dataHot, hotDiv);
    if (menDiv) renderProduct(dataPhone, menDiv);
    if (womenDiv) renderProduct(dataLaptop, womenDiv);
  })();
}

// ==================== PRODUCT LIST PAGE ====================
const productAll = safeGet('all-product');
const searchInput = safeGet('search-input');
const sortPrice = safeGet('sort-price');
let allProductsData = [];

if (productAll) {
  // admin toolbar if admin flag
  if (window.IS_ADMIN) injectAdminToolbar();

  // load products
  loadAllProducts();

  // search
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      const q = (e.target.value || '').toLowerCase();
      const filtered = allProductsData.filter(p => (p.name || '').toLowerCase().includes(q));
      renderProduct(filtered, productAll);
    }, 250));
  }

  // sort
  if (sortPrice) {
    sortPrice.addEventListener('change', (e) => {
      const v = e.target.value;
      const copy = [...allProductsData];
      if (v === 'asc') copy.sort((a, b) => a.price - b.price);
      else if (v === 'desc') copy.sort((a, b) => b.price - a.price);
      renderProduct(copy, productAll);
    });
  }
}

// loadAllProducts - public
async function loadAllProducts() {
  try {
    // if cache available and fresh (5 minutes) use it
    const freshMs = 5 * 60 * 1000;
    if (Array.isArray(window.PRODUCT_CACHE.list) && (Date.now() - (window.PRODUCT_CACHE.ts || 0) < freshMs)) {
      allProductsData = window.PRODUCT_CACHE.list;
    } else {
      const data = await fetchProducts();
      allProductsData = data || [];
    }
    if (productAll) renderProduct(allProductsData, productAll);
  } catch (e) {
    console.error("loadAllProducts error:", e);
    if (productAll) productAll.innerHTML = '<p>Không thể tải dữ liệu sản phẩm</p>';
  }
}

// expose globally
window.loadAllProducts = loadAllProducts;

// ==================== PRODUCT DETAIL PAGE ====================
const productDetailDiv = safeGet('detail-product');
if (productDetailDiv) {
  (async () => {
    const id = new URLSearchParams(location.search).get('id');
    const data = await fetchProductById(id);
    if (!data) {
      productDetailDiv.innerHTML = '<p>Không thể tải thông tin sản phẩm</p>';
      return;
    }
    const product = new Product(data.id, data.name, data.price, data.image, data.category, data.hot, data.description);
    productDetailDiv.innerHTML = product.renderDetail();
  })();
}

// ==================== HEADER & FOOTER (chèn bằng JS nếu chưa có) ====================
if (!document.querySelector('.site-header')) {
  const header = document.createElement('header');
  header.innerHTML = `
  <header class="site-header">
    <div class="container header-top">
      <div class="logo">
        <a href="index.html">
          <img src="img/logo2.png" alt="Logo" class="logo-img" style="height:40px;">
          <span>ShopOnline</span>
        </a>
      </div>
      <div class="search-bar">
        <input type="text" id="search-input" placeholder="Tìm sản phẩm...">
        <button id="search-btn"><i class="fas fa-search"></i></button>
      </div>
      <div class="sort-bar">
        <select id="sort-price">
          <option value="">Sắp xếp theo giá</option>
          <option value="asc">Giá tăng dần</option>
          <option value="desc">Giá giảm dần</option>
        </select>
      </div>
      <div class="header-icons">
        <a href="#"><i class="fas fa-phone"></i> 0123 456 789</a>
        <a href="admin.html"><i class="fas fa-user"></i></a>
        <a href="#"><i class="fas fa-heart"></i></a>
        <a href="cart.html" class="cart">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count" id="cart-count">0</span>
        </a>
      </div>
    </div>
    <nav class="navbar">
      <ul>
        <li><a href="index.html"><i class="fas fa-home"></i> Trang chủ</a></li>
        <li><a href="product.html"><i class="fas fa-box"></i> Sản phẩm</a></li>
        <li><a href="#"><i class="fas fa-tags"></i> Khuyến mãi</a></li>
        <li><a href="#"><i class="fas fa-newspaper"></i> Tin tức</a></li>
        <li><a href="#"><i class="fas fa-envelope"></i> Liên hệ</a></li>
      </ul>
    </nav>
  </header>
  <section class="hero-banner">
    <div class="hero-text">
      <h2>Chào mừng đến với <span>Shop Online</span></h2>
      <p>Mua sắm tiện lợi – Giá tốt mỗi ngày!</p>
      <a href="product.html" class="btn"><i class="fas fa-shopping-bag"></i> Mua ngay</a>
    </div>
  </section>
  `;
  document.body.prepend(header);
}

if (!document.querySelector('.site-footer')) {
  const footer = document.createElement('footer');
  footer.innerHTML = `
  <footer class="site-footer">
    <div class="container footer-content">
      <div class="footer-column">
        <h3><i class="fas fa-store"></i> ShopOnline</h3>
        <p>Mang đến trải nghiệm mua sắm trực tuyến nhanh chóng, dễ dàng và an toàn.</p>
      </div>
      <div class="footer-column">
        <h3><i class="fas fa-headset"></i> Liên hệ</h3>
        <ul>
          <li><i class="fas fa-map-marker-alt"></i> 123 Đường ABC, Hà Nội</li>
          <li><i class="fas fa-phone"></i> 0123 456 789</li>
          <li><i class="fas fa-envelope"></i> support@shoponline.com</li>
        </ul>
      </div>
      <div class="footer-column">
        <h3><i class="fas fa-list"></i> Danh mục</h3>
        <ul>
          <li><a href="index.html"><i class="fas fa-home"></i> Trang chủ</a></li>
          <li><a href="product.html"><i class="fas fa-box"></i> Sản phẩm</a></li>
          <li><a href="#"><i class="fas fa-tags"></i> Khuyến mãi</a></li>
          <li><a href="#"><i class="fas fa-newspaper"></i> Tin tức</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h3><i class="fas fa-share-alt"></i> Theo dõi chúng tôi</h3>
        <div class="social-icons">
          <a href="#"><i class="fab fa-facebook"></i></a>
          <a href="#"><i class="fab fa-instagram"></i></a>
          <a href="#"><i class="fab fa-tiktok"></i></a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2025 ShopOnline. All rights reserved.</p>
    </div>
  </footer>
  `;
  document.body.appendChild(footer);
}

// ==================== GIỎ HÀNG ====================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount() {
  const badge = document.querySelector(".cart-count");
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  if (badge) badge.textContent = totalQty;
}

// Add to cart (delegation)
document.addEventListener('click', (e) => {
  // from detail page button (id="addCartBtn")
  if (e.target && e.target.id === "addCartBtn") {
    const id = e.target.getAttribute("productId");
    const qtyInput = document.querySelector(`#qty-${id}`);
    const qty = qtyInput ? Math.max(1, Number(qtyInput.value) || 1) : 1;
    addToCartById(id, qty);
    return;
  }

  // inline add button in product card (class="btn-add-inline")
  const inline = e.target.closest('.btn-add-inline');
  if (inline) {
    const id = inline.dataset.id;
    addToCartById(id, 1);
    return;
  }
});

// helper to add
async function addToCartById(id, qty = 1) {
  try {
    const product = await fetchProductById(id);
    if (!product) return alert("Không tìm thấy sản phẩm!");
    const cart = getCart();
    const idx = cart.findIndex(i => String(i.id) === String(product.id));
    if (idx >= 0) cart[idx].quantity = (Number(cart[idx].quantity) || 0) + qty;
    else cart.push({ id: product.id, quantity: qty });
    saveCart(cart);
    alert(`✅ Đã thêm "${product.name}" (${qty}) vào giỏ hàng!`);
  } catch (e) {
    console.error("addToCartById error:", e);
    alert('❌ Có lỗi khi thêm vào giỏ hàng');
  }
}

// ==================== RENDER GIỎ HÀNG TRANG cart.html ====================
async function renderCart() {
  const cartContainer = safeGet("cart-items");
  const cartSummary = safeGet("cart-summary");
  if (!cartContainer || !cartSummary) return;

  const cart = getCart();
  if (!cart || cart.length === 0) {
    cartContainer.innerHTML = `<p>🛒 Giỏ hàng trống. <a href="product.html">Mua sắm ngay</a></p>`;
    cartSummary.innerHTML = "";
    updateCartCount();
    return;
  }

  try {
    // ensure product list exists in cache
    if (!Array.isArray(window.PRODUCT_CACHE.list) || window.PRODUCT_CACHE.list.length === 0) {
      await fetchProducts();
    }

    let total = 0;
    let html = '';
    cart.forEach((cartItem, index) => {
      const product = (window.PRODUCT_CACHE.map && window.PRODUCT_CACHE.map.get(cartItem.id)) || (Array.isArray(window.PRODUCT_CACHE.list) ? window.PRODUCT_CACHE.list.find(p => String(p.id) === String(cartItem.id)) : null);
      if (!product) return;
      const subtotal = (Number(product.price) || 0) * (Number(cartItem.quantity) || 0);
      total += subtotal;
      html += `
        <div class="cart-item">
          <img src="${product.image}" alt="${product.name}" class="cart-img">
          <div class="cart-info">
            <h3>${product.name}</h3>
            <p>Giá: ${formatCurrency(product.price)}</p>
            <div class="quantity-controls">
              <button class="decrease" data-index="${index}">-</button>
              <span>${cartItem.quantity}</span>
              <button class="increase" data-index="${index}">+</button>
            </div>
            <p>Thành tiền: ${formatCurrency(subtotal)}</p>
          </div>
          <button class="remove-item" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    });

    cartContainer.innerHTML = html;
    cartSummary.innerHTML = `
      <h2>Tổng cộng: ${formatCurrency(total)}</h2>
      <button class="checkout-btn">Thanh toán</button>
    `;
    updateCartCount();
  } catch (e) {
    console.error("renderCart error:", e);
    cartContainer.innerHTML = '<p>❌ Không thể tải dữ liệu giỏ hàng</p>';
  }
}

// quantity adjust and remove (delegation)
document.addEventListener('click', (e) => {
  const inc = e.target.closest(".increase");
  const dec = e.target.closest(".decrease");
  const del = e.target.closest(".remove-item");

  if (inc) updateQuantity(+inc.dataset.index, 1);
  if (dec) updateQuantity(+dec.dataset.index, -1);
  if (del && confirm("Bạn có chắc muốn xóa sản phẩm này?")) removeFromCart(+del.dataset.index);
});

function updateQuantity(index, change) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].quantity += change;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

// ==================== PAGE LOAD HANDLING ====================
document.addEventListener('DOMContentLoaded', () => {
  // update header cart count
  updateCartCount();

  // If cart page present, render it
  if (document.getElementById('cart-items')) {
    renderCart();
  }

  // If product page present, ensure admin tools
  const adminTbody = document.getElementById('admin-tbody');
  if (adminTbody) {
    try { localStorage.setItem('isAdmin', 'true'); } catch (e) {}
    window.IS_ADMIN = true;
    injectProductModal();
    if (typeof window.loadAdminTable === 'function') {
      window.loadAdminTable();
    } else {
      loadAdminTable();
    }
  }

  // If product detail present, nothing more (rendered earlier)
});

// ==================== ADMIN UI & CRUD (works only on local json-server) ====================
function injectAdminToolbar() {
  const toolbar = document.createElement('div');
  toolbar.id = 'admin-toolbar';
  toolbar.innerHTML = `<button id="btn-add-product" class="btn btn-add">+ Thêm sản phẩm</button>`;
  const main = document.querySelector('main') || document.body;
  main.prepend(toolbar);
}

function injectProductModal() {
  if (document.getElementById('product-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'product-modal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="modal-dialog">
      <button id="product-modal-close" class="btn-close">×</button>
      <h3>Thêm / Sửa sản phẩm</h3>
      <form id="product-form">
        <input type="hidden" id="pf-id">
        <div><label for="pf-name">Tên</label><input id="pf-name" type="text" required></div>
        <div><label for="pf-price">Giá</label><input id="pf-price" type="number" min="0" required></div>
        <div><label for="pf-image">Ảnh (đường dẫn)</label><input id="pf-image" type="text" required></div>
        <div><label for="pf-category">Danh mục</label><input id="pf-category" type="text" required placeholder="điện thoại / laptop"></div>
        <div class="form-check"><input id="pf-hot" type="checkbox"><label for="pf-hot">Nổi bật</label></div>
        <div><label for="pf-desc">Mô tả</label><textarea id="pf-desc" rows="3"></textarea></div>
        <button type="submit" class="btn btn-add">Lưu</button>
      </form>
    </div>
  `;
  // basic modal styles (inline minimal so it shows even without external CSS)
  modal.style.position = 'fixed';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.display = 'none';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.querySelector('.modal-dialog').style = 'background:#fff;padding:20px;border-radius:8px;max-width:600px;width:90%;margin:auto;';
  document.body.appendChild(modal);

  const form = modal.querySelector('#product-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProductFromForm();
  });

  document.getElementById('product-modal-close').addEventListener('click', closeProductModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProductModal();
  });
}

function openProductModal(id) {
  injectProductModal();
  const modal = document.getElementById('product-modal');
  if (!modal) return;
  fillProductForm();
  modal.style.display = 'flex';
  if (!id) return;
  // load product
  fetchProductById(id).then(p => {
    if (p) fillProductForm(p);
    else alert('Không tải được sản phẩm để sửa.');
  });
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.style.display = 'none';
}

function fillProductForm(p = null) {
  const get = id => document.getElementById(id);
  get('pf-id').value = p?.id ?? '';
  get('pf-name').value = p?.name ?? '';
  get('pf-price').value = p?.price ?? '';
  get('pf-image').value = p?.image ?? '';
  get('pf-category').value = p?.category ?? '';
  get('pf-hot').checked = !!p?.hot;
  get('pf-desc').value = p?.description ?? '';
}

async function saveProductFromForm() {
  const get = id => document.getElementById(id);
  const id = get('pf-id').value;
  const payload = {
    name: get('pf-name').value.trim(),
    price: Number(get('pf-price').value),
    image: get('pf-image').value.trim(),
    category: get('pf-category').value.trim(),
    hot: get('pf-hot').checked,
    description: get('pf-desc').value.trim(),
  };
  if (!payload.name || !payload.image || !payload.category || isNaN(payload.price)) {
    return alert('Vui lòng nhập đầy đủ và hợp lệ.');
  }

  try {
    if (!isLocal()) {
      // remote (github) cannot write to raw - inform user
      alert('Chức năng thêm/sửa/xóa chỉ hoạt động khi chạy local với json-server.');
      closeProductModal();
      return;
    }

    if (id) {
      // PUT local
      await fetch(`${LOCAL_PRODUCTS_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id), ...payload })
      });
      alert('Đã cập nhật sản phẩm.');
    } else {
      // POST local
      await fetch(LOCAL_PRODUCTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert('Đã thêm sản phẩm.');
    }

    closeProductModal();
    // invalidate cache
    window.PRODUCT_CACHE = { list: null, map: null, ts: 0 };
    await loadAllProducts();
    if (typeof window.loadAdminTable === 'function') {
      await window.loadAdminTable();
    }
  } catch (e) {
    console.error("saveProductFromForm error:", e);
    alert('Có lỗi khi lưu sản phẩm.');
  }
}

async function deleteProduct(id) {
  if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
  try {
    if (!isLocal()) {
      alert('Chức năng xóa chỉ hoạt động khi chạy local với json-server.');
      return;
    }
    await fetch(`${LOCAL_PRODUCTS_URL}/${id}`, { method: 'DELETE' });
    // invalidate cache and reload
    window.PRODUCT_CACHE = { list: null, map: null, ts: 0 };
    if (typeof loadAllProducts === 'function') await loadAllProducts();
    if (typeof window.loadAdminTable === 'function') await window.loadAdminTable();
    alert('Đã xóa sản phẩm.');
  } catch (e) {
    console.error("deleteProduct error:", e);
    alert('Xóa sản phẩm thất bại.');
  }
}

// ==================== ADMIN PAGE TABLE ====================
window.loadAdminTable = async function loadAdminTable() {
  const tbody = safeGet('admin-tbody');
  const count = safeGet('admin-count');
  if (!tbody) return;
  try {
    // If local, prefer local API; otherwise remote raw
    const url = isLocal() ? LOCAL_PRODUCTS_URL : REMOTE_PRODUCTS_URL;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Không tải được dữ liệu admin');
    let data = await res.json();
    if (!Array.isArray(data)) data = Array.isArray(data.products) ? data.products : [];
    if (count) count.textContent = `Tổng: ${data.length} sản phẩm`;
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Không có dữ liệu</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(p => {
      const safeImg = (p.image || '').replace(/"/g, '&quot;');
      return `
        <tr>
          <td>${p.id ?? ''}</td>
          <td>${p.name ?? ''}</td>
          <td><img class="thumb" src="${safeImg}" alt="${p.name ?? ''}" style="height:48px"></td>
          <td>${(Number(p.price) || 0).toLocaleString()} đ</td>
          <td>${p.category ?? ''}</td>
          <td>${p.hot ? '✅' : '❌'}</td>
          <td class="table-actions">
            <button class="btn-edit" data-id="${p.id}">Sửa</button>
            <button class="btn-delete" data-id="${p.id}">Xóa</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    console.error("loadAdminTable error:", e);
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Lỗi tải dữ liệu</td></tr>';
  }
};

// delegation for admin actions
document.addEventListener('click', async (e) => {
  const addBtn = e.target.closest('#btn-add-product');
  const editBtn = e.target.closest('.btn-edit');
  const deleteBtn = e.target.closest('.btn-delete');

  if (addBtn) openProductModal();
  if (editBtn) {
    const id = editBtn.getAttribute('data-id');
    openProductModal(id);
  }
  if (deleteBtn) {
    const id = deleteBtn.getAttribute('data-id');
    await deleteProduct(id);
    if (typeof window.loadAdminTable === 'function') {
      await window.loadAdminTable();
    }
  }
});

// ==================== END OF FILE ====================
