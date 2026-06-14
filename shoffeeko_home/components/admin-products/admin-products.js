let allProducts = [];

let currentProduct = null;

let isAddingProduct = false;

async function fetchProducts() {
  const root = document.querySelector("#adminProductsPage");
  const apiUrl = root?.dataset.api;

  if (!root || !apiUrl) return [];

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch products");

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error("Products API Error:", error);
    return [];
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

function getStatusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function renderProducts(products) {
  const tbody = document.querySelector("#productsTableBody");
  const count = document.querySelector("#productsCount");

  if (!tbody) return;

  if (count) {
    count.textContent = `${products.length} product${products.length === 1 ? "" : "s"}`;
  }

  if (!products.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">No products found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(product => `
    <tr>
      <td>
        <div class="admin-product-cell">
          <img class="admin-product-thumb" src="${product.image}" alt="${product.name}">
          <strong>${product.name}</strong>
        </div>
      </td>
      <td class="admin-order-id">${product.id}</td>
      <td>${product.category}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>${product.stock}</td>
      <td>
        <span class="admin-status admin-status--${getStatusClass(getAutoStatus(product.stock))}">
          ${getAutoStatus(product.stock)}
         </span>
      </td>
      <td>
        <div class="admin-action-group">
          <button class="admin-table-btn" data-action="view" data-id="${product.id}">View</button>
          <button class="admin-table-btn admin-edit" data-action="edit" data-id="${product.id}">Edit</button>
          <button class="admin-table-btn admin-delete" data-action="delete" data-id="${product.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function getAutoStatus(stock) {
  const quantity = Number(stock);

  if (quantity <= 0) return "Out of Stock";
  if (quantity <= 10) return "Low Stock";
  return "Active";
}

function renderCategoryFilter(products) {
  const categoryFilter = document.querySelector("#productCategoryFilter");
  if (!categoryFilter) return;

  const categories = [
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ];

  categoryFilter.innerHTML = `
    <option value="all">All Categories</option>
    ${categories.map(category => `
      <option value="${category}">${category}</option>
    `).join("")}
  `;
}

function applyProductFilters() {
  const searchInput = document.querySelector("#productSearchInput");
  const topSearch = document.querySelector("#adminProductTopSearch");
  const categoryFilter = document.querySelector("#productCategoryFilter");

  const searchTerm = (
    searchInput?.value ||
    topSearch?.value ||
    ""
  ).toLowerCase();

  const selectedCategory = categoryFilter?.value || "all";

  const filtered = allProducts.filter(product => {
    const matchesSearch =
      product.id.toLowerCase().includes(searchTerm) ||
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  renderProducts(filtered);
}

function handleProductActions(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const productId = button.dataset.id;

  if (action === "view") {
  window.location.href = `admin-product-detail.html?id=${productId}`;
  }

  if (action === "edit") {
  window.location.href =
    `admin-product-detail.html?id=${productId}&edit=true`;
  }

  if (action === "delete") {
  const confirmDelete = confirm(`Delete product ${productId}?`);

  if (confirmDelete) {
    allProducts = allProducts.filter(product => product.id !== productId);

    localStorage.setItem(
      "adminProducts",
      JSON.stringify(allProducts)
    );
    
    renderCategoryFilter(allProducts);
    
    applyProductFilters();

    alert("Product deleted locally.");
   }
  }
  
}

async function initAdminProductsPage() {
  const root = document.querySelector("#adminProductsPage");
  if (!root) return;

  const htmlResponse = await fetch("../components/admin-products/admin-products.html");
  root.innerHTML = await htmlResponse.text();

  allProducts =
  JSON.parse(localStorage.getItem("adminProducts")) ||
  await fetchProducts();

  renderProducts(allProducts);

  renderCategoryFilter(allProducts);

  document.querySelector("#productSearchInput")?.addEventListener("input", applyProductFilters);
  document.querySelector("#adminProductTopSearch")?.addEventListener("input", applyProductFilters);
  document.querySelector("#productCategoryFilter")?.addEventListener("change", applyProductFilters);
  document.querySelector("#productsTableBody")?.addEventListener("click", handleProductActions);

  document.querySelector("#addProductBtn")?.addEventListener("click", () => {
  window.location.href = "admin-product-detail.html?add=true";
  });
}

document.addEventListener("DOMContentLoaded", initAdminProductsPage);