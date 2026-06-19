document.addEventListener("DOMContentLoaded", initAdminInventoryPage);

const PRODUCTS_KEY = "adminProducts";
const INVENTORY_LOG_KEY = "shoffeeko_inventory_logs";
const LOW_STOCK_LIMIT = 10;


function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("productId");
}

let inventoryProducts = [];
let inventoryLogs = [];
let selectedProductId = null;

async function initAdminInventoryPage() {
  const root = document.querySelector("#adminInventoryPage");
  if (!root) return;

  const response = await fetch("../components/admin-inventory/admin-inventory.html");
  root.innerHTML = await response.text();

  inventoryProducts = getProducts();
  inventoryLogs = getInventoryLogs();
  selectedProductId = getProductIdFromUrl();

  if (selectedProductId) {
    const searchInput = document.querySelector("#inventorySearchInput");
    const historySearchInput = document.querySelector("#inventoryHistorySearchInput");

    if (searchInput) searchInput.value = selectedProductId;
    if (historySearchInput) historySearchInput.value = selectedProductId;
  }

  renderInventoryStats();
  renderStockTable();
  renderInventoryHistory();
  bindInventoryEvents();
}

function getProducts() {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
  } catch (error) {
    console.error("Products are broken:", error);
    return [];
  }
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getInventoryLogs() {
  try {
    return JSON.parse(localStorage.getItem(INVENTORY_LOG_KEY)) || [];
  } catch (error) {
    console.error("Inventory logs are broken:", error);
    return [];
  }
}

function saveInventoryLogs(logs) {
  localStorage.setItem(INVENTORY_LOG_KEY, JSON.stringify(logs));
}

function addInventoryLog(log) {
  inventoryLogs.unshift({
    id: "INV-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString(),
    ...log
  });

  saveInventoryLogs(inventoryLogs);
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getStockStatus(stockValue) {
  const stock = Number(stockValue || 0);

  if (stock <= 0) return "Out of Stock";
  if (stock <= LOW_STOCK_LIMIT) return "Low Stock";
  return "In Stock";
}

function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function renderInventoryStats() {
  const grid = document.querySelector("#inventoryStatsGrid");
  if (!grid) return;

  const totalProducts = inventoryProducts.length;

  const inStock = inventoryProducts.filter(product => {
    return Number(product.stock || 0) > LOW_STOCK_LIMIT;
  }).length;

  const lowStock = inventoryProducts.filter(product => {
    const stock = Number(product.stock || 0);
    return stock > 0 && stock <= LOW_STOCK_LIMIT;
  }).length;

  const outOfStock = inventoryProducts.filter(product => {
    return Number(product.stock || 0) <= 0;
  }).length;

  const cards = [
    { label: "Total Products", value: totalProducts, note: "Tracked items" },
    { label: "In Stock", value: inStock, note: "Above low stock limit" },
    { label: "Low Stock", value: lowStock, note: `Stock ${LOW_STOCK_LIMIT} or below` },
    { label: "Out of Stock", value: outOfStock, note: "Needs restock" }
  ];

  grid.innerHTML = cards.map(card => `
    <article class="admin-stat-card">
      <div class="admin-stat-card__label">${card.label}</div>
      <div class="admin-stat-card__value">${card.value}</div>
      <div class="admin-stat-card__note">${card.note}</div>
    </article>
  `).join("");
}

function renderStockTable() {
  const tableBody = document.querySelector("#inventoryStockTable");
  const searchInput = document.querySelector("#inventorySearchInput");
  const stockFilter = document.querySelector("#inventoryStockFilter");

  if (!tableBody) return;

  const searchTerm = String(searchInput?.value || "").toLowerCase();
  const filterValue = stockFilter?.value || "all";

  let filteredProducts = [...inventoryProducts];

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(product => {
      const text = [
        product.name,
        product.title,
        product.sku,
        product.id,
        product.category,
        product.productCategory
      ].join(" ").toLowerCase();

      return text.includes(searchTerm);
    });
  }

  if (filterValue !== "all") {
    filteredProducts = filteredProducts.filter(product => {
      const status = getStockStatus(product.stock);
      return getStatusClass(status) === filterValue;
    });
  }

  if (!filteredProducts.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">No inventory products found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredProducts.map(product => {
    const stock = Number(product.stock || 0);
    const status = getStockStatus(stock);

    return `
      <tr>
        <td>${product.name || product.title || "Unnamed Product"}</td>
        <td class="admin-order-id">${product.sku || product.id || "No SKU"}</td>
        <td>${product.category || product.productCategory || "Uncategorized"}</td>
        <td>${stock}</td>
        <td>
          <span class="admin-status admin-status--${getStatusClass(status)}">
            ${status}
          </span>
        </td>
        <td>
          <button class="admin-table-btn" data-restock-id="${product.id}">
            Restock
          </button>
          <button class="admin-table-btn" data-adjust-id="${product.id}">
            Adjust
          </button>
        </td>
      </tr>
    `;
  }).join("");

  bindStockActionButtons();
}

function renderInventoryHistory() {
  const tableBody = document.querySelector("#inventoryHistoryTable");
  const searchInput = document.querySelector("#inventoryHistorySearchInput");
  const typeFilter = document.querySelector("#inventoryTypeFilter");

  if (!tableBody) return;

  const searchTerm = String(searchInput?.value || "").toLowerCase();
  const filterValue = typeFilter?.value || "all";

  let filteredLogs = [...inventoryLogs];

  if (filterValue !== "all") {
    filteredLogs = filteredLogs.filter(log => log.type === filterValue);
  }

  if (searchTerm) {
    filteredLogs = filteredLogs.filter(log => {
      const text = [
        log.productName,
        log.sku,
        log.productId,
        log.type,
        log.reason
      ].join(" ").toLowerCase();

      return text.includes(searchTerm);
    });
  }

  if (!filteredLogs.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">No inventory movements found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredLogs.map(log => `
    <tr>
      <td>${formatDate(log.createdAt)}</td>
      <td>${log.productName || "Unnamed Product"}</td>
      <td class="admin-order-id">${log.sku || log.productId || "No SKU"}</td>
      <td>${log.type || "Movement"}</td>
      <td>${Number(log.quantity || 0)}</td>
      <td>${Number(log.previousStock || 0)}</td>
      <td>${Number(log.newStock || 0)}</td>
      <td>${log.reason || "No reason"}</td>
    </tr>
  `).join("");
}

function bindInventoryEvents() {
  document.querySelector("#inventorySearchInput")?.addEventListener("input", renderStockTable);
  document.querySelector("#inventoryStockFilter")?.addEventListener("change", renderStockTable);

  document.querySelector("#inventoryHistorySearchInput")?.addEventListener("input", renderInventoryHistory);
  document.querySelector("#inventoryTypeFilter")?.addEventListener("change", renderInventoryHistory);
}

function bindStockActionButtons() {
  document.querySelectorAll("[data-restock-id]").forEach(button => {
    button.addEventListener("click", () => {
      restockProduct(button.dataset.restockId);
    });
  });

  document.querySelectorAll("[data-adjust-id]").forEach(button => {
    button.addEventListener("click", () => {
      adjustProductStock(button.dataset.adjustId);
    });
  });
}

function restockProduct(productId) {
  const product = inventoryProducts.find(item => String(item.id) === String(productId));

  if (!product) {
    alert("Product not found.");
    return;
  }

  const currentStock = Number(product.stock || 0);
  const amount = Number(prompt(`Add stock for ${product.name || product.title}:`, "10"));

  if (!amount || amount <= 0) return;

  product.stock = currentStock + amount;

  if (product.stock > 0 && product.status === "Inactive") {
    product.status = "Active";
  }

  saveProducts(inventoryProducts);

  addInventoryLog({
    productId: product.id,
    sku: product.sku || product.id,
    productName: product.name || product.title || "Unnamed Product",
    type: "Restock",
    quantity: amount,
    previousStock: currentStock,
    newStock: product.stock,
    reason: "Admin inventory page restock"
  });

  renderInventoryStats();
  renderStockTable();
  renderInventoryHistory();
}

function adjustProductStock(productId) {
  const product = inventoryProducts.find(item => String(item.id) === String(productId));

  if (!product) {
    alert("Product not found.");
    return;
  }

  const currentStock = Number(product.stock || 0);
  const newStockInput = prompt(
    `Set new stock for ${product.name || product.title}:`,
    currentStock
  );

  if (newStockInput === null) return;

  const newStock = Number(newStockInput);

  if (Number.isNaN(newStock) || newStock < 0) {
    alert("Please enter a valid stock number.");
    return;
  }

  product.stock = newStock;

  if (product.stock <= 0) {
    product.status = "Inactive";
  } else if (product.status === "Inactive") {
    product.status = "Active";
  }

  saveProducts(inventoryProducts);

  addInventoryLog({
    productId: product.id,
    sku: product.sku || product.id,
    productName: product.name || product.title || "Unnamed Product",
    type: "Adjustment",
    quantity: newStock - currentStock,
    previousStock: currentStock,
    newStock: product.stock,
    reason: "Manual stock adjustment"
  });

  renderInventoryStats();
  renderStockTable();
  renderInventoryHistory();
}