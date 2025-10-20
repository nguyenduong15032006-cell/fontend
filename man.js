// ==================== CẤU HÌNH API TƯƠNG THÍCH LOCAL / GITHUB ====================

// Kiểm tra nếu đang chạy online (GitHub Pages hoặc Vercel)
const IS_REMOTE =
  location.hostname.endsWith("github.io") ||
  location.hostname.endsWith("vercel.app");

// Link dữ liệu JSON (raw file trên GitHub public)
const BASE_URL = IS_REMOTE
  ? "https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json"
  : "http://localhost:3000/products";

// ==================== FETCH DỮ LIỆU ====================

// Lấy danh sách sản phẩm
async function fetchProducts() {
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error("Không thể tải danh sách sản phẩm");
    const data = await res.json();
    return data.products ? data.products : data;
  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
    return [];
  }
}

// Lấy sản phẩm theo ID
async function fetchProductById(id) {
  try {
    if (IS_REMOTE) {
      const list = await fetchProducts();
      return list.find((p) => String(p.id) === String(id));
    } else {
      const res = await fetch(`http://localhost:3000/products/${id}`);
      if (!res.ok) throw new Error("Không tìm thấy sản phẩm");
      return await res.json();
    }
  } catch (err) {
    console.error("Lỗi tải sản phẩm theo ID:", err);
    return null;
  }
}

// ==================== CLASS SẢN PHẨM ====================
class Product {
  constructor(id, name, price, image, category, hot, description) {
    Object.assign(this, { id, name, price, image, category, hot, description });
  }

  render() {
    return `
      <div class="product${this.hot ? " hot" : ""}">
        <img src="${this.image}" alt="${this.name}">
        <a href="detail.html?id=${this.id}">
          <h3>${this.name}</h3>
        </a>
        <p>${formatCurrency(this.price)}</p>
      </div>`;
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
      </div>`;
  }
}

// ==================== UTILITIES ====================
function formatCurrency(value) {
  const num = Number(value) || 0;
  return `${num.toLocaleString()} đ`;
}

// ==================== RENDER SẢN PHẨM ====================
function renderProduct(array, theDiv) {
  if (!theDiv) return;
  theDiv.innerHTML = array
    .map(
      (d) =>
        new Product(
          d.id,
          d.name,
          d.price,
          d.image,
          d.category,
          d.hot,
          d.description
        ).render()
    )
    .join("");
}

// ==================== TRANG CHỦ ====================
const hotDiv = document.getElementById("hot");
const menDiv = document.getElementById("men");
const womenDiv = document.getElementById("women");

if (hotDiv) {
  fetchProducts().then((data) => {
    const dataHot = data.filter((p) => p.hot);
    const dataPhone = data.filter((p) => p.category === "điện thoại");
    const dataLaptop = data.filter((p) => p.category === "laptop");
    renderProduct(dataHot, hotDiv);
    renderProduct(dataPhone, menDiv);
    renderProduct(dataLaptop, womenDiv);
  });
}

// ==================== TRANG CHI TIẾT SẢN PHẨM ====================
const productDetailDiv = document.getElementById("detail-product");
if (productDetailDiv) {
  const id = new URLSearchParams(location.search).get("id");
  fetchProductById(id).then((p) => {
    if (p) productDetailDiv.innerHTML = new Product(...Object.values(p)).renderDetail();
    else productDetailDiv.innerHTML = "<p>Không tìm thấy sản phẩm!</p>";
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

      <!-- Thanh tìm kiếm -->A
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
  if (!badge) return;
  const total = getCart().reduce((sum, i) => sum + (i.quantity || 1), 0);
  badge.textContent = total;
}

document.addEventListener("click", (e) => {
  if (e.target?.id === "addCartBtn") {
    const id = e.target.getAttribute("productId");
    fetchProductById(id).then((product) => {
      if (!product) return alert("Không tìm thấy sản phẩm!");
      const cart = getCart();
      const item = cart.find((i) => i.id == product.id);
      if (item) item.quantity++;
      else cart.push({ id: product.id, quantity: 1 });
      saveCart(cart);
      alert(`✅ Đã thêm "${product.name}" vào giỏ hàng!`);
    });
  }
});

// ==================== RENDER GIỎ HÀNG ====================
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
    const products = await fetchProducts();
    let total = 0;
    cartContainer.innerHTML = cart
      .map((item, i) => {
        const p = products.find((x) => x.id == item.id);
        if (!p) return "";
        const subtotal = p.price * item.quantity;
        total += subtotal;
        return `
        <div class="cart-item">
          <img src="${p.image}" alt="${p.name}" class="cart-img">
          <div class="cart-info">
            <h3>${p.name}</h3>
            <p>Giá: ${formatCurrency(p.price)}</p>
            <div class="quantity-controls">
              <button class="decrease" data-index="${i}">-</button>
              <span>${item.quantity}</span>
              <button class="increase" data-index="${i}">+</button>
            </div>
            <p>Thành tiền: ${formatCurrency(subtotal)}</p>
          </div>
          <button class="remove-item" data-index="${i}">
            <i class="fas fa-trash"></i>
          </button>
        </div>`;
      })
      .join("");
    cartSummary.innerHTML = `<h2>Tổng cộng: ${formatCurrency(total)}</h2><button class="checkout-btn">Thanh toán</button>`;
    updateCartCount();
  } catch {
    cartContainer.innerHTML = "<p>❌ Không thể tải dữ liệu giỏ hàng</p>";
  }
}

function updateQuantity(index, delta) {
  const cart = getCart();
  cart[index].quantity += delta;
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
  if (e.target.closest(".increase")) updateQuantity(+e.target.dataset.index, 1);
  if (e.target.closest(".decrease")) updateQuantity(+e.target.dataset.index, -1);
  if (e.target.closest(".remove-item")) {
    const i = +e.target.dataset.index;
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) removeFromCart(i);
  }
});

// ==================== ADMIN ====================
window.loadAdminTable = async function () {
  const tbody = document.getElementById("admin-tbody");
  const count = document.getElementById("admin-count");
  if (!tbody) return;
  try {
    const data = await fetchProducts();
    if (count) count.textContent = `Tổng: ${data.length} sản phẩm`;
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="7">Không có dữ liệu</td></tr>';
      return;
    }
    tbody.innerHTML = data
      .map(
        (p) => `
      <tr>
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td><img class="thumb" src="${p.image}" alt="${p.name}"></td>
        <td>${formatCurrency(p.price)}</td>
        <td>${p.category}</td>
        <td>${p.hot ? "✅" : "❌"}</td>
        <td>
          <button class="btn-edit" data-id="${p.id}">Sửa</button>
          <button class="btn-delete" data-id="${p.id}">Xóa</button>
        </td>
      </tr>`
      )
      .join("");
  } catch {
    tbody.innerHTML = '<tr><td colspan="7">Lỗi tải dữ liệu</td></tr>';
  }
};

// ==================== KHI TRANG LOAD ====================
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  if (document.getElementById("cart-items")) renderCart();
  const adminTbody = document.getElementById("admin-tbody");
  if (adminTbody) loadAdminTable();
});
