document.addEventListener("DOMContentLoaded", initOrderTrackingPage);

const ORDERS_KEY = "shoffeeko_orders";

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch (error) {
    console.error("Orders are broken:", error);
    return [];
  }
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

function formatPrice(value) {
  return `$${Number(value || 0).toFixed(2)} USD`;
}

function getPaymentMethodLabel(order) {
  const labels = {
    cod: "Cash on Delivery",
    gcash: "GCash",
    bankTransfer: "Bank Transfer",
    stripe: "Stripe",
    paypal: "PayPal"
  };

  return order.paymentLabel || labels[order.paymentMethod] || "Not selected";
}

function getProofStatus(order) {
  if (["gcash", "bankTransfer"].includes(order.paymentMethod)) {
    return order.paymentProof ? "Proof Uploaded" : "Waiting for Proof";
  }

  if (["stripe", "paypal"].includes(order.paymentMethod)) {
    return "Automatic Payment";
  }

  return "Not Required";
}

function renderTimeline(order) {
  const timeline = Array.isArray(order.timeline) ? order.timeline : [];

  if (!timeline.length) {
    return `
      <div class="tracking-timeline-item">
        <strong>${formatDate(order.createdAt || order.date)}</strong>
        <p>Order Created</p>
      </div>
    `;
  }

  return timeline.map(item => `
    <div class="tracking-timeline-item">
      <strong>${formatDate(item.date)}</strong>
      <p>${item.message}</p>
    </div>
  `).join("");
}

function initOrderTrackingPage() {
  const root = document.querySelector("#orderTrackingPage");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  const orders = getOrders();
  const order = orders.find(item => String(item.id) === String(orderId));

  if (!order) {
    root.innerHTML = `
      <section class="tracking-section sk-container">
        <div class="tracking-card">
          <h1>Order not found</h1>
          <p>Please check your order link and try again.</p>
          <a href="catalog-page.html" class="tracking-btn">Continue Shopping</a>
        </div>
      </section>
    `;
    return;
  }

  root.innerHTML = `
    <section class="tracking-section sk-container">
      <div class="tracking-header tracking-card">
        <p class="tracking-eyebrow">Order Tracking</p>
        <h1>${order.id}</h1>
        <p>Track your order status and payment progress.</p>
      </div>

      <div class="tracking-grid">
        <div class="tracking-card">
          <h2>Order Status</h2>

          <div class="tracking-info-row">
            <span>Payment Method</span>
            <strong>${getPaymentMethodLabel(order)}</strong>
          </div>

          <div class="tracking-info-row">
            <span>Payment Status</span>
            <strong>${order.paymentStatus || "Pending"}</strong>
          </div>

          <div class="tracking-info-row">
            <span>Proof Status</span>
            <strong>${getProofStatus(order)}</strong>
          </div>

          <div class="tracking-info-row">
            <span>Order Status</span>
            <strong>${order.orderStatus || order.status || "Pending"}</strong>
          </div>

          <div class="tracking-info-row">
            <span>Order Date</span>
            <strong>${formatDate(order.createdAt || order.date)}</strong>
          </div>
        </div>

        <div class="tracking-card">
          <h2>Timeline</h2>
          <div class="tracking-timeline">
            ${renderTimeline(order)}
          </div>
        </div>
      </div>

      <div class="tracking-card">
        <h2>Items Purchased</h2>

        <div class="tracking-items">
          ${(order.items || []).map(item => `
            <div class="tracking-item">
              <img src="${item.image}" alt="${item.title}">
              <div>
                <h3>${item.title}</h3>
                <p>Qty: ${item.quantity}</p>
              </div>
              <strong>${formatPrice(Number(item.price) * Number(item.quantity || 1))}</strong>
            </div>
          `).join("")}
        </div>

        <div class="tracking-total">
          <span>Subtotal</span>
          <strong>${formatPrice(order.subtotal)}</strong>
        </div>
      </div>

      <a href="catalog-page.html" class="tracking-btn">Continue Shopping</a>
    </section>
  `;
}