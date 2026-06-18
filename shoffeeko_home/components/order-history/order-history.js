document.addEventListener("DOMContentLoaded", initOrderHistory);

const ORDERS_KEY = "shoffeeko_orders";

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch (error) {
    console.error("Orders are broken:", error);
    return [];
  }
}

function formatDate(value) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatPrice(value) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function getPaymentLabel(order) {
  const labels = {
    cod: "Cash on Delivery",
    gcash: "GCash",
    bankTransfer: "Bank Transfer",
    stripe: "Stripe",
    paypal: "PayPal"
  };

  return (
    order.paymentLabel ||
    labels[order.paymentMethod] ||
    order.customer?.paymentMethod ||
    "Cash on Delivery"
  );
}

function getOrderStatus(order) {
  return order.orderStatus || order.status || "Pending";
}

function renderOrders() {
  const tbody = document.querySelector("#orderHistoryBody");
  const empty = document.querySelector("#emptyOrders");
  const searchInput = document.querySelector("#orderSearch");
  const statusFilter = document.querySelector("#statusFilter");

  if (!tbody) return;

  const searchValue = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  let orders = getOrders();

  orders = orders.filter(order => {
    const orderId = String(order.id || order.orderId || "").toLowerCase();
    const status = getOrderStatus(order);

    const matchesSearch = orderId.includes(searchValue);
    const matchesStatus = selectedStatus === "all" || status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (!orders.length) {
    tbody.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  tbody.innerHTML = orders.map(order => {
    const orderId = order.id || order.orderId;
    const status = getOrderStatus(order);
    const total = order.total || order.subtotal || 0;

    return `
      <tr>
        <td><strong>${orderId}</strong></td>
        <td>${formatDate(order.createdAt)}</td>
        <td>${getPaymentLabel(order)}</td>
        <td><span class="status-badge">${status}</span></td>
        <td>${formatPrice(total)}</td>
        <td>
          <a class="track-btn" href="./order-tracking.html?id=${encodeURIComponent(orderId)}">
            Track
          </a>
        </td>
      </tr>
    `;
  }).join("");
}

function initOrderHistory() {
  const searchInput = document.querySelector("#orderSearch");
  const statusFilter = document.querySelector("#statusFilter");

  searchInput?.addEventListener("input", renderOrders);
  statusFilter?.addEventListener("change", renderOrders);

  renderOrders();
}