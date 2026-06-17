let allOrders = [];

const ORDER_DETAIL_KEY = "shoffeeko_orders";

async function fetchOrders() {
  const root = document.querySelector("#adminOrdersPage");
  const apiUrl = root?.dataset.api;

  if (!root || !apiUrl) return [];

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch orders");

    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error("Orders API Error:", error);
    return [];
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(amount);
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getStatusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}
function getPaymentMethodBadge(order) {
  const method = order.paymentMethod || order.customer?.paymentMethod || "cod";

  const badgeMap = {
    cod: "💵 Cash on Delivery",
    gcash: "📱 GCash",
    bankTransfer: "🏦 Bank Transfer",
    stripe: "💳 Stripe",
    paypal: "🅿️ PayPal"
  };

  const manualMethods = ["gcash", "bankTransfer"];
  const automaticMethods = ["stripe", "paypal"];

  let verificationText = "No Verification";
  let verificationClass = "verification-badge--none";

  if (manualMethods.includes(method)) {
    verificationText = "Requires Proof";
    verificationClass = "verification-badge--manual";
  }

  if (automaticMethods.includes(method)) {
    verificationText = "Auto";
    verificationClass = "verification-badge--auto";
  }

  const methodClass = method === "bankTransfer" ? "bank" : method;

  return `
    <div class="payment-method-table-wrap">
      <span class="payment-method-badge payment-method--${methodClass}">
        ${badgeMap[method] || order.paymentLabel || method}
      </span>
      <span class="verification-badge ${verificationClass}">
        ${verificationText}
      </span>
    </div>
  `;
}

function renderOrders(orders) {
  const tbody = document.querySelector("#ordersTableBody");
  const count = document.querySelector("#ordersCount");

  if (!tbody) return;

  if (count) {
    count.textContent = `${orders.length} order${orders.length === 1 ? "" : "s"}`;
  }

  if (!orders.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">No orders found.</td>
      </tr>
    `;
    return;
  }

 tbody.innerHTML = orders.map(order => {
  const orderId = order.id || order.orderNumber || "No ID";
  const orderDate = order.date || order.createdAt || new Date().toISOString();

const customer =
  order.customerName ||
  order.customer?.name ||
  `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() ||
  (typeof order.customer === "string" ? order.customer : "") ||
  "Guest Customer";

  const email =
    order.email ||
    order.customerEmail ||
    order.customer?.email ||
    "No email";

  const itemsCount = Array.isArray(order.items)
  ? order.items.reduce((sum, item) => {
      return sum + Number(item.quantity || 1);
    }, 0)
  : Number(order.items || 0);

  const total =
    order.total ||
    order.subtotal ||
    order.totalAmount ||
    order.grandTotal ||
    0;

  const payment =
    order.payment ||
    order.paymentStatus ||
    "Pending";

  const status =
    order.status ||
    order.orderStatus ||
    "Pending";

  return `
    <tr>
      <td class="admin-order-id">${orderId}</td>
      <td>${formatDate(orderDate)}</td>
      <td>${customer}</td>
      <td>${email}</td>
      <td>${itemsCount}</td>
      <td>${formatCurrency(total)}</td>
      <td>
        ${getPaymentMethodBadge(order)}
      </td>
      <td>
        <span class="admin-status admin-status--${getStatusClass(status)}">
          ${status}
        </span>
      </td>
      <td>
        <div class="admin-action-group">
          <button class="admin-table-btn" data-action="view" data-id="${orderId}">View</button>
          <button class="admin-table-btn admin-edit" data-action="edit" data-id="${orderId}">Edit</button>
        </div>
      </td>
    </tr>
    `;
  }).join("");
}

function applyOrderFilters() {
  const searchInput = document.querySelector("#orderSearchInput");
  const topSearch = document.querySelector("#adminOrderTopSearch");
  const statusFilter = document.querySelector("#orderStatusFilter");

  const searchTerm = (
    searchInput?.value ||
    topSearch?.value ||
    ""
  ).toLowerCase();

  const selectedStatus = statusFilter?.value || "all";

  const filtered = allOrders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm) ||
      order.customer.toLowerCase().includes(searchTerm) ||
      order.email.toLowerCase().includes(searchTerm);

    const matchesStatus =
      selectedStatus === "all" || order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  renderOrders(filtered);
}

function handleOrderActions(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const orderId = button.dataset.id;

 if (action === "view") {
  window.location.href = `admin-order-detail.html?id=${orderId}`;
 }

  if (action === "edit") {
    alert(`Editing order ${orderId}`);
  }
}

function getSavedOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDER_DETAIL_KEY)) || [];
  } catch (error) {
    console.error("Saved orders are broken:", error);
    localStorage.removeItem(ORDER_DETAIL_KEY);
    return [];
  }
}

async function initAdminOrdersPage() {
  const root = document.querySelector("#adminOrdersPage");
  if (!root) return;

  const htmlResponse = await fetch("../components/admin-orders/admin-orders.html");
  root.innerHTML = await htmlResponse.text();

  const savedOrders = getSavedOrders();

  allOrders = savedOrders.length
    ? savedOrders
    : await fetchOrders();

  renderOrders(allOrders);

  document.querySelector("#orderSearchInput")?.addEventListener("input", applyOrderFilters);
  document.querySelector("#adminOrderTopSearch")?.addEventListener("input", applyOrderFilters);
  document.querySelector("#orderStatusFilter")?.addEventListener("change", applyOrderFilters);
  document.querySelector("#ordersTableBody")?.addEventListener("click", handleOrderActions);
}

document.addEventListener("DOMContentLoaded", initAdminOrdersPage);