const ORDERS_KEY = "shoffeeko_orders";
const ADDRESSES_KEY = "shoffeeko_addresses";

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

function getSavedAddresses() {
  try {
    return JSON.parse(localStorage.getItem(ADDRESSES_KEY)) || [];
  } catch (error) {
    console.error("Saved addresses are broken:", error);
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(amount);
}

function formatDate(dateValue) {
  if (!dateValue) return "No date";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getCustomerName(order) {
  if (!order) return "Guest Customer";

  if (typeof order.customer === "object" && order.customer !== null) {
    return `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Guest Customer";
  }

  return order.customer || "Guest Customer";
}

function renderOrderDetail(order) {
  const root = document.querySelector("#adminOrderDetailPage");

  if (!order) {
    currentOrder = null;
    root.innerHTML = `
      <div class="admin-panel" style="padding:24px;">
        Order not found.
      </div>
    `;
    return;
  }

  currentOrder = order;

  document.querySelector("#detailOrderId").textContent = order.id;
  document.querySelector("#detailCustomerName").textContent = getCustomerName(order);

  document.querySelector("#detailCustomerEmail").textContent =
    order.customerEmail ||
    order.email ||
    order.customer?.email ||
    "No email";

  document.querySelector("#detailOrderDate").textContent =
    formatDate(order.createdAt || order.date);

  document.querySelector("#detailPaymentStatus").textContent =
    order.paymentStatus || order.payment || "Pending";

  document.querySelector("#detailOrderStatus").textContent =
    order.orderStatus || order.status || "Pending";

  document.querySelector("#detailOrderTotal").textContent =
    formatCurrency(order.total || order.subtotal || 0);

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

function renderPaymentStatus(order) {
  const paymentText = document.querySelector("#detailPaymentStatus");
  const paymentSelect = document.querySelector("#paymentStatusSelect");

  if (!paymentText || !paymentSelect || !order) return;

  const paymentStatus = order.paymentStatus || order.payment || "Pending";

  paymentText.textContent = paymentStatus;
  paymentSelect.value = paymentStatus;
}

function renderShippingAddress(order) {
  if (!order) return;

  const addresses = getSavedAddresses();

  const address = addresses.find(item =>
    String(item.id) === String(order.selectedAddressId)
  );

  const customerName = getCustomerName(order);

  document.querySelector("#shippingCustomerName").textContent =
    customerName || "Guest Customer";

  if (!address) {
    document.querySelector("#shippingAddressLine1").textContent =
      "No address available";
    return;
  }

  const fullName = `${address.firstName || ""} ${address.lastName || ""}`.trim();

  document.querySelector("#shippingCustomerName").textContent =
    fullName || customerName || "Guest Customer";

  document.querySelector("#shippingAddressLine1").textContent =
    address.address || "";

  document.querySelector("#shippingAddressLine2").textContent =
    address.phone || "";

  document.querySelector("#shippingCity").textContent =
    address.city || "";

  document.querySelector("#shippingProvince").textContent = "";

  document.querySelector("#shippingZip").textContent =
    address.postalCode || "";

  document.querySelector("#shippingCountry").textContent =
    address.country || "";
}

function createTimelineItem(message) {
  return {
    date: new Date().toISOString(),
    message
  };
}

function updateOrderInStorage(orderId, updater) {
  const orders = getSavedOrders();

  const updatedOrders = orders.map(order => {
    if (String(order.id) !== String(orderId)) return order;

    return updater(order);
  });

  saveOrders(updatedOrders);
  return updatedOrders.find(order => String(order.id) === String(orderId));
}

function renderOrderTimeline(order) {
  const timelineRoot = document.querySelector("#orderTimeline");
  if (!timelineRoot || !order) return;

  const timeline = Array.isArray(order.timeline) ? order.timeline : [];

  if (!timeline.length) {
    timelineRoot.innerHTML = `
      <div class="timeline-item">
        <strong>${formatDate(order.createdAt || order.date)}</strong>
        <p>Order Created</p>
      </div>
    `;
    return;
  }

  timelineRoot.innerHTML = timeline.map(item => `
    <div class="timeline-item">
      <strong>${formatDate(item.date)}</strong>
      <p>${item.message}</p>
    </div>
  `).join("");
}

function savePaymentStatus() {
  if (!currentOrder) return;

  const selectedPayment = document.querySelector("#paymentStatusSelect")?.value;
  if (!selectedPayment) return;

  const timelineItem = createTimelineItem(`Payment status updated to ${selectedPayment}`);

  const updatedOrder = updateOrderInStorage(currentOrder.id, order => {
    const timeline = Array.isArray(order.timeline) ? order.timeline : [];

    return {
      ...order,
      paymentStatus: selectedPayment,
      timeline: [...timeline, timelineItem]
    };
  });

  currentOrder = updatedOrder || {
    ...currentOrder,
    paymentStatus: selectedPayment,
    timeline: [...(currentOrder.timeline || []), timelineItem]
  };

  document.querySelector("#detailPaymentStatus").textContent = selectedPayment;
  renderPaymentStatus(currentOrder);
  renderOrderTimeline(currentOrder);

  alert("Payment status updated.");
}

function saveOrderStatus() {
  if (!currentOrder) return;

  const selectedStatus = document.querySelector("#orderStatusSelect")?.value;
  if (!selectedStatus) return;

  const timelineItem = createTimelineItem(`Order status updated to ${selectedStatus}`);

  const updatedOrder = updateOrderInStorage(currentOrder.id, order => {
    const timeline = Array.isArray(order.timeline) ? order.timeline : [];

    return {
      ...order,
      status: selectedStatus,
      orderStatus: selectedStatus,
      timeline: [...timeline, timelineItem]
    };
  });

  currentOrder = updatedOrder || {
    ...currentOrder,
    status: selectedStatus,
    orderStatus: selectedStatus,
    timeline: [...(currentOrder.timeline || []), timelineItem]
  };

  document.querySelector("#detailOrderStatus").textContent = selectedStatus;
  renderOrderTimeline(currentOrder);

  alert("Order status updated.");
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

  const order = orders.find(item => String(item.id) === String(orderId));

  renderOrderDetail(order);
  renderPaymentStatus(order);
  renderShippingAddress(order);
  renderOrderTimeline(order);

  const orderStatusSelect = document.querySelector("#orderStatusSelect");
  if (orderStatusSelect) {
    orderStatusSelect.value = order?.orderStatus || order?.status || "Pending";
  }

  document
    .querySelector("#saveOrderStatusBtn")
    ?.addEventListener("click", saveOrderStatus);

  document
    .querySelector("#savePaymentStatusBtn")
    ?.addEventListener("click", savePaymentStatus);
}

document.addEventListener("DOMContentLoaded", initAdminOrderDetailPage);