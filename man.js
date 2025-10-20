// ==================== class sản phẩm ====================
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
      <div class="product${this.hot ? ' hot' : ''}">
        <img src="${this.image}" alt="${this.name}">
        <a href="detail.html?id=${this.id}">
          <h3>${this.name}</h3>
        </a>
        <p>${formatCurrency(this.price)}</p>
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
          <span>${this.description}</span>
          <button id="addCartBtn" productId="${this.id}">Thêm vào giỏ hàng</button>
        </div>
      </div>
    `;
  }
}

// ==================== Show trang chủ ====================
const hotDiv = document.getElementById('hot');
const menDiv = document.getElementById('men');
const womenDiv = document.getElementById('women');

if (hotDiv) {
  fetch('https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json')
    .then(response => response.json())
    .then(data => {
      console.log(data);
      const dataHot = data.filter(p => p.hot === true);
      const dataPhone = data.filter(p => p.category === "điện thoại");
      const dataLaptop = data.filter(p => p.category === "laptop");
      //Show sản phẩm nổi bật
      renderProduct(dataHot, hotDiv);
      //Show sản phẩm điện thoại
      renderProduct(dataPhone, menDiv);
      //Show sản phẩm laptop
      renderProduct(dataLaptop, womenDiv);
    })
    .catch(error => {
      console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
      hotDiv.innerHTML = '<p>Không thể tải dữ liệu sản phẩm</p>';
    });
}

// ==================== Show trang sản phẩm ====================
const productAll = document.getElementById('all-product');
const searchInput = document.getElementById('search-input');
const sortPrice = document.getElementById('sort-price');
let allProductsData = [];

// ==================== Perf utils ====================
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return `${num.toLocaleString()} đ`;
}

// Shared cache for product data across pages (listing, detail, cart)
window.PRODUCT_CACHE = window.PRODUCT_CACHE || { list: null, map: null, ts: 0 };

// ==================== Admin mode flag ====================
window.IS_ADMIN = new URLSearchParams(location.search).get('admin') === '1' || localStorage.getItem('isAdmin') === 'true';

if (productAll) {
  // Inject admin toolbar if admin (trang sản phẩm)
  if (window.IS_ADMIN) {
    injectAdminToolbar();
  }

  loadAllProducts();

  if (searchInput) {
    const onSearch = debounce((e) => {
      const keyword = (e.target.value || '').toLowerCase();
      const filteredProducts = allProductsData.filter(p => (p.name || '').toLowerCase().includes(keyword));
      renderProduct(filteredProducts, productAll);
    }, 200);
    searchInput.addEventListener('input', onSearch);
  }

  if (sortPrice) {
    sortPrice.addEventListener('change', (e) => {
      let sortedData = [...allProductsData]; // Tạo bản sao để không thay đổi mảng gốc
      if (e.target.value === "asc") {
        sortedData.sort((a, b) => a.price - b.price);
      } else if (e.target.value === 'desc') {
        sortedData.sort((a, b) => b.price - a.price);
      }
      renderProduct(sortedData, productAll);
    });
  }

  // (delegation on product page is handled globally below)
}

function renderProduct(array, theDiv) {
let html = "";
  array.forEach((data) => {
    const product = new Product(
      data.id,
      data.name,
      data.price,
      data.image,
      data.category,
      data.hot,
      data.description
    );
    html += product.render();
  });
  theDiv.innerHTML = html;
}

// ==================== Trang chi tiết ====================
const productDetailDiv = document.getElementById('detail-product');
if (productDetailDiv) {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

    fetch(`https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json/${id}`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      const product = new Product(
        data.id,
        data.name,
        data.price,
        data.image,
        data.category,
        data.hot,
        data.description
      );
      productDetailDiv.innerHTML = product.renderDetail();
    })
    .catch(error => {
      console.error('Lỗi khi tải chi tiết sản phẩm:', error);
      productDetailDiv.innerHTML = '<p>Không thể tải thông tin sản phẩm</p>';
    });
}

// ==================== Header & Footer ====================
if (!document.querySelector('.site-header')) {
const header = document.createElement('header');
header.innerHTML = `
  <!-- Header -->
  <header class="site-header">
    <div class="container header-top">
      <!-- Logo -->
      <div class="logo">
        <a href="#">
          <img src="img/logo2.png" alt="Logo" class="logo-img">
          <span>ShopOnline</span>
        </a>
      </div>

      <!-- Thanh tìm kiếm -->
      <div class="search-bar">
        <input type="text" id="search-input" placeholder="Tìm sản phẩm...">
        <button><i class="fas fa-search"></i></button>
      </div>

      <!-- Sắp xếp -->
      <div class="sort-bar">
        <select id="sort-price">
          <option value="">Sắp xếp theo giá</option>
          <option value="asc">Giá tăng dần</option>
          <option value="desc">Giá giảm dần</option>
        </select>
      </div>

      <!-- Icon -->
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

    <!-- Navbar -->
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

  <!-- Banner -->
  <section class="hero-banner">
    <div class="hero-text">
      <h2>Chào mừng đến với <span>Shop Online</span></h2>
      <p>Mua sắm tiện lợi – Giá tốt mỗi ngày!</p>
      <a href="#" class="btn"><i class="fas fa-shopping-bag"></i> Mua ngay</a>
    </div>
  </section>
`;
document.body.prepend(header);
}

if (!document.querySelector('.site-footer')) {
const footer = document.createElement('footer');
footer.innerHTML = `
  <!-- Footer -->
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
          <li><a href="#"><i class="fas fa-home"></i> Trang chủ</a></li>
          <li><a href="#"><i class="fas fa-box"></i> Sản phẩm</a></li>
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

// ==================== Giỏ hàng ====================
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

// ==================== Bắt sự kiện thêm vào giỏ ====================
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "addCartBtn") {
    const id = e.target.getAttribute("productId");
    fetch(`https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json/${id}`)
      .then(res => res.json())
      .then(data => {
        const cart = getCart();
        const item = cart.find(i => i.id === data.id);
        if (item) item.quantity++;
        else cart.push({ id: data.id, quantity: 1 });
        saveCart(cart);
        alert(`✅ Đã thêm "${data.name}" vào giỏ hàng!`);
      })
      .catch(error => {
        console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
        alert('❌ Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!');
      });
  }
});

// ==================== Render giỏ hàng ====================
async function renderCart() {
  const cartContainer = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");
  if (!cartContainer || !cartSummary) return;

  const cart = getCart();
  if (cart.length === 0) {
    cartContainer.innerHTML = `<p>🛒 Giỏ hàng trống. <a href="product.html">Mua sắm ngay</a></p>`;
    cartSummary.innerHTML = "";
    updateCartCount();
    return;
  }

  try {
    // Use cache if available
    let productsList = window.PRODUCT_CACHE.list;
    if (!Array.isArray(productsList)) {
      const res = await fetch('https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json');
      productsList = await res.json();
      // hydrate cache
      window.PRODUCT_CACHE.list = productsList;
      window.PRODUCT_CACHE.map = new Map(productsList.map(p => [p.id, p]));
      window.PRODUCT_CACHE.ts = Date.now();
    }

  let total = 0;
  let html = "";

  cart.forEach((cartItem, index) => {
    const product = (window.PRODUCT_CACHE.map && window.PRODUCT_CACHE.map.get(cartItem.id)) || (Array.isArray(window.PRODUCT_CACHE.list) ? window.PRODUCT_CACHE.list.find(p => p.id === cartItem.id) : null);
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
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu giỏ hàng:', error);
    cartContainer.innerHTML = '<p>❌ Không thể tải dữ liệu giỏ hàng</p>';
  }
}

// ==================== Tăng / giảm / xóa ====================
function updateQuantity(index, change) {
  const cart = getCart();
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

document.addEventListener("click", (e) => {
  const inc = e.target.closest(".increase");
  const dec = e.target.closest(".decrease");
  const del = e.target.closest(".remove-item");

  if (inc) updateQuantity(+inc.dataset.index, 1);
  if (dec) updateQuantity(+dec.dataset.index, -1);
  if (del && confirm("Bạn có chắc muốn xóa sản phẩm này?"))
    removeFromCart(+del.dataset.index);
});

// ==================== Load khi vào trang ====================
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateCartCount();
  // Bất kỳ trang nào nếu là admin thì luôn có modal để thêm/sửa
  if (window.IS_ADMIN) {
    injectProductModal();
  }

  // Nếu đang ở trang admin (có bảng admin), bật quyền admin và khởi tạo bảng
  const adminTbody = document.getElementById('admin-tbody');
  if (adminTbody) {
    try { localStorage.setItem('isAdmin', 'true'); } catch (e) {}
    window.IS_ADMIN = true;
    injectProductModal();
    if (typeof window.loadAdminTable === 'function') {
      // đã có sẵn
      window.loadAdminTable();
    } else if (typeof loadAdminTable === 'function') {
      loadAdminTable();
    }
  }
});


// ==================== ADMIN UI & CRUD ====================
function injectAdminToolbar() {
  const toolbar = document.createElement('div');
  toolbar.id = 'admin-toolbar';
  toolbar.innerHTML = `
    <button id="btn-add-product" class="btn btn-add">+ Thêm sản phẩm</button>
  `;
  const main = document.querySelector('main');
  if (main) main.prepend(toolbar);
}

function injectProductModal() {
  if (document.getElementById('product-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'product-modal';
  modal.innerHTML = `
    <div class="modal-dialog">
      <button id="product-modal-close" class="btn-close">×</button>
      <h3>Thêm / Sửa sản phẩm</h3>
      <form id="product-form">
        <input type="hidden" id="pf-id">
        <div>
          <label for="pf-name">Tên</label>
          <input id="pf-name" type="text" required>
        </div>
        <div>
          <label for="pf-price">Giá</label>
          <input id="pf-price" type="number" min="0" required>
        </div>
        <div>
          <label for="pf-image">Ảnh (đường dẫn)</label>
          <input id="pf-image" type="text" required>
        </div>
        <div>
          <label for="pf-category">Danh mục</label>
          <input id="pf-category" type="text" required placeholder="điện thoại / laptop">
        </div>
        <div class="form-check">
          <input id="pf-hot" type="checkbox">
          <label for="pf-hot">Nổi bật</label>
        </div>
        <div>
          <label for="pf-desc">Mô tả</label>
          <textarea id="pf-desc" rows="3"></textarea>
        </div>
        <button type="submit" class="btn btn-add">Lưu</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // submit handler
  const form = modal.querySelector('#product-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProductFromForm();
  });

  // click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProductModal();
  });
}

function openProductModal(id) {
  const modal = document.getElementById('product-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  // reset
  fillProductForm();

  if (!id) return; // add new

  // edit: load data
  fetch(`https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json/${id}`)
    .then(res => res.json())
    .then(p => {
      fillProductForm(p);
    })
    .catch(() => alert('Không tải được sản phẩm.'));
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.style.display = 'none';
}

function fillProductForm(p = null) {
  const get = (id) => document.getElementById(id);
  get('pf-id').value = p?.id ?? '';
  get('pf-name').value = p?.name ?? '';
  get('pf-price').value = p?.price ?? '';
  get('pf-image').value = p?.image ?? '';
  get('pf-category').value = p?.category ?? '';
  get('pf-hot').checked = !!p?.hot;
  get('pf-desc').value = p?.description ?? '';
}

async function saveProductFromForm() {
  const get = (id) => document.getElementById(id);
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
    alert('Vui lòng nhập đầy đủ và hợp lệ.');
    return;
  }

  try {
    if (id) {
      await fetch(`https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id), ...payload })
      });
      alert('Đã cập nhật sản phẩm.');
    } else {
      await fetch('https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert('Đã thêm sản phẩm.');
    }
    closeProductModal();
    // invalidate cache and reload
    window.PRODUCT_CACHE = { list: null, map: null, ts: 0 };
    // Cập nhật grid sản phẩm nếu đang ở trang sản phẩm
    if (typeof loadAllProducts === 'function') {
      await loadAllProducts();
    }
    // Cập nhật bảng admin nếu có
    if (typeof window.loadAdminTable === 'function') {
      await window.loadAdminTable();
    }
  } catch (e) {
    alert('Có lỗi khi lưu sản phẩm.');
  }
}

async function deleteProduct(id) {
  if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
  try {
    await fetch(`https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json/${id}`, { method: 'DELETE' });
    // invalidate cache after delete
    window.PRODUCT_CACHE = { list: null, map: null, ts: 0 };
    if (typeof loadAllProducts === 'function') {
      await loadAllProducts();
    }
    if (typeof window.loadAdminTable === 'function') {
      await window.loadAdminTable();
    }
    alert('Đã xóa sản phẩm.');
  } catch (e) {
    alert('Xóa sản phẩm thất bại.');
  }
}

async function loadAllProducts() {
  try {
    // Use and refresh cache
    if (!Array.isArray(window.PRODUCT_CACHE.list)) {
      const response = await fetch('https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json');
      const data = await response.json();
      window.PRODUCT_CACHE.list = data;
      window.PRODUCT_CACHE.map = new Map(data.map(p => [p.id, p]));
      window.PRODUCT_CACHE.ts = Date.now();
    }
    allProductsData = window.PRODUCT_CACHE.list || [];
    renderProduct(allProductsData, productAll);
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
    if (productAll) productAll.innerHTML = '<p>Không thể tải dữ liệu sản phẩm</p>';
  }
}

// ==================== ADMIN PAGE TABLE ====================
window.loadAdminTable = async function loadAdminTable() {
  const tbody = document.getElementById('admin-tbody');
  const count = document.getElementById('admin-count');
  if (!tbody) return;
  try {
    const res = await fetch('https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json');
    const data = await res.json();
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
          <td><img class="thumb" src="${safeImg}" alt="${p.name ?? ''}"></td>
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
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Lỗi tải dữ liệu</td></tr>';
  }
}

// Delegation for admin table actions
document.addEventListener('click', async (e) => {
  const addBtn = e.target.closest('#btn-add-product');
  const editBtn = e.target.closest('.btn-edit');
  const deleteBtn = e.target.closest('.btn-delete');

  if (addBtn && typeof openProductModal === 'function') {
    openProductModal();
  }
  if (editBtn && typeof openProductModal === 'function') {
    const id = editBtn.getAttribute('data-id');
    openProductModal(id);
  }
  if (deleteBtn && typeof deleteProduct === 'function') {
    const id = deleteBtn.getAttribute('data-id');
    await deleteProduct(id);
    if (typeof window.loadAdminTable === 'function') {
      await window.loadAdminTable();
    }
  }
});



