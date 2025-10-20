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
      const dataHot = data.products.filter(p => p.hot === true);
      const dataPhone = data.products.filter(p => p.category === "điện thoại");
      const dataLaptop = data.products.filter(p => p.category === "laptop");
      renderProduct(dataHot, hotDiv);
      renderProduct(dataPhone, menDiv);
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
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return `${num.toLocaleString()} đ`;
}

// ==================== Render sản phẩm ====================
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

// ==================== Trang chi tiết sản phẩm ====================
const productDetailDiv = document.getElementById('detail-product');
if (productDetailDiv) {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  fetch('https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json')
    .then(response => response.json())
    .then(data => {
      const product = data.products.find(p => p.id == id);
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
        productDetailDiv.innerHTML = '<p>Không tìm thấy sản phẩm!</p>';
      }
    })
    .catch(error => {
      console.error('Lỗi khi tải chi tiết sản phẩm:', error);
      productDetailDiv.innerHTML = '<p>Không thể tải thông tin sản phẩm</p>';
    });
}

// ==================== Giỏ hàng cơ bản ====================
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

// ==================== Thêm vào giỏ hàng ====================
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "addCartBtn") {
    const id = e.target.getAttribute("productId");

    fetch('https://raw.githubusercontent.com/nguyenduong15032006-cell/db.json/main/db.json')
      .then(res => res.json())
      .then(data => {
        const product = data.products.find(p => p.id == id);
        if (!product) return alert("Không tìm thấy sản phẩm!");
        const cart = getCart();
        const item = cart.find(i => i.id == product.id);
        if (item) item.quantity++;
        else cart.push({ id: product.id, quantity: 1 });
        saveCart(cart);
        alert(`✅ Đã thêm "${product.name}" vào giỏ hàng!`);
      })
      .catch(error => {
        console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
        alert('❌ Có lỗi xảy ra khi thêm sản phẩm!');
      });
  }
});

// ==================== Load khi vào trang ====================
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
});
