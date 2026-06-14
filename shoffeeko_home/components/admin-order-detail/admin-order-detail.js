const ORDERS_KEY = "shoffeeko_orders";

let currentOrder = null;

async function fetchOrders() {
  const root = document.querySelector("#adminOrderDetailPage");
  const apiUrl = root?.dataset.api;

  if (!root || !apiUrl) return [];

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch orders");

    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error("Order Detail API Error:", error);
    return [];
  }
}

function getOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function getSavedOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch (error) {
    console.error("Saved orders are broken:", error);
    localStorage.removeItem(ORDERS_KEY);
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
    month: "long",
    day: "numeric"
  });
}

function renderOrderDetail(order) {
  const root = document.querySelector("#adminOrderDetailPage");

  if (!order) {
    currentOrder = order;
    root.innerHTML = `
      <div class="admin-panel" style="padding:24px;">
        Order not found.
      </div>
    `;
    return;
  }

  currentOrder = order;

  document.querySelector("#detailOrderId").textContent = order.id;
  document.querySelector("#detailCustomerName").textContent = order.customer || "Guest Customer";
  document.querySelector("#detailCustomerEmail").textContent = order.email || "No email";
  document.querySelector("#detailOrderDate").textContent = formatDate(order.date);
  document.querySelector("#detailPaymentStatus").textContent = order.payment || "Pending";
  document.querySelector("#detailOrderStatus").textContent = order.status || "Pending";
  document.querySelector("#detailOrderTotal").textContent = formatCurrency(order.total || 0);

  const items = Array.isArray(order.items) ? order.items : [];

  document.querySelector("#detailOrderItems").innerHTML = items.length
    ? items.map(item => `
        <div class="admin-order-item">
          <div>
            <strong>${item.title || item.name || "Product"}</strong>
            <p>Qty: ${item.quantity || 1}</p>
          </div>

          <strong>
            ${formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 1))}
          </strong>
        </div>
      `).join("")
    : `<p>No items found for this order.</p>`;
}

async function initAdminOrderDetailPage() {
  const root = document.querySelector("#adminOrderDetailPage");
  if (!root) return;

  const htmlResponse = await fetch("../components/admin-order-detail/admin-order-detail.html");
  root.innerHTML = await htmlResponse.text();

  const orderId = getOrderIdFromUrl();

  const savedOrders = getSavedOrders();

  const orders = savedOrders.length
    ? savedOrders
    : await fetchOrders();

  const order = orders.find(item => item.id === orderId);

  renderOrderDetail(order);

  document.querySelector("#orderStatusSelect").value = order?.status || "Pending";

    document
    .querySelector("#saveOrderStatusBtn")
    ?.addEventListener("click", saveOrderStatus);
    }

    function saveOrderStatus() {
    if (!currentOrder) return;

    const selectedStatus = document.querySelector("#orderStatusSelect")?.value;
    if (!selectedStatus) return;

    const orders = getSavedOrders();

    const updatedOrders = orders.map(order =>
        order.id === currentOrder.id
        ? { ...order, status: selectedStatus }
        : order
    );

  localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));

  currentOrder.status = selectedStatus;
  document.querySelector("#detailOrderStatus").textContent = selectedStatus;

  alert("Order status updated.");
}

document.addEventListener("DOMContentLoaded", initAdminOrderDetailPage);