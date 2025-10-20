// ==================== CẤU HÌNH API LOCAL / GITHUB ====================
const IS_REMOTE = location.hostname.endsWith("github.io") || location.hostname.endsWith("vercel.app");

const PRODUCTS_URL = IS_REMOTE
  ? "https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json"
  : "http://localhost:3000/products"; // khi chạy JSON Server local

// ==================== HELPER: TẢI DANH SÁCH SẢN PHẨM ====================
function fetchProducts() {
  return fetch(PRODUCTS_URL)
    .then((res) => {
      if (!res.ok) throw new Error("Không thể tải danh sách sản phẩm");
      return res.json();
    })
    .then((data) => (data.products ? data.products : data))
    .catch((err) => {
      console.error("Lỗi tải sản phẩm:", err);
      return [];
    });
}

// ==================== HELPER: LẤY 1 SẢN PHẨM THEO ID ====================
function fetchProductById(id) {
  return fetchProducts().then((products) =>
    products.find((p) => String(p.id) === String(id))
  );
}

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
      <div class="product${this.hot ? " hot" : ""}">
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

// ==================== Hiển thị TRANG CHỦ ====================
const hotDiv = document.getElementById("hot");
const menDiv = document.getElementById("men");
const womenDiv = document.getElementById("women");

if (hotDiv) {
  fetchProducts().then((data) => {
    const dataHot = data.filter((p) => p.hot === true);
    const dataPhone = data.filter((p) => p.category === "điện thoại");
    const dataLaptop = data.filter((p) => p.category === "laptop");
    renderProduct(dataHot, hotDiv);
    renderProduct(dataPhone, menDiv);
    renderProduct(dataLaptop, womenDiv);
  });
}

// ==================== Hiển thị TẤT CẢ SẢN PHẨM ====================
const productAll = document.getElementById("all-product");
if (productAll) {
  fetchProducts().then((data) => renderProduct(data, productAll));
}

// ==================== Hiển thị CHI TIẾT SẢN PHẨM ====================
const productDetailDiv = document.getElementById("detail-product");
if (productDetailDiv) {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  fetchProductById(id).then((product) => {
    if (product) {
      const p = new Product(
        product.id,
        product.name,
        product.price,
        product.image,
        product.category,
        product.hot,
        product.description
      );
      productDetailDiv.innerHTML = p.renderDetail();
    } else {
      productDetailDiv.innerHTML = "<p>Không tìm thấy sản phẩm!</p>";
    }
  });
}

// ==================== UTILITIES ====================
function formatCurrency(value) {
  const num = Number(value) || 0;
  return `${num.toLocaleString()} đ`;
}

function renderProduct(array, theDiv) {
  if (!theDiv) return;
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

// ==================== XỬ LÝ "THÊM VÀO GIỎ HÀNG" ====================
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "addCartBtn") {
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

// ==================== KHI TRANG LOAD ====================
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
});
