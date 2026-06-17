document.addEventListener("DOMContentLoaded", initOrderConfirmation);

async function initOrderConfirmation() {
  const root = document.getElementById("orderConfirmationPage");
  if (!root) return;

  const response = await fetch("../components/order-confirmation/order-confirmation.json");
  const data = await response.json();
  const settings = data.settings || {};

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  const ordersKey = settings.ordersKey || "shoffeeko_orders";
  const orders = JSON.parse(localStorage.getItem(ordersKey)) || [];

  const order = orders.find(item => item.id === orderId);



  if (!order) {

        const formattedDate = new Date(order.createdAt).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric"
          }
        );

        const formattedTime = new Date(order.createdAt).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit"
          }
        );

    root.innerHTML = `
      <section class="order-confirmation-section sk-container">
        <div class="order-card">
          <h1>Order not found</h1>
          <p>Please return to the catalog and try again.</p>
          <a class="order-btn" href="catalog-page.html">Continue Shopping</a>
        </div>
      </section>
    `;
    return;
  }

  function formatPrice(value) {
    return `$${Number(value || 0).toFixed(2)} ${settings.currency || "USD"}`;
  }

  const customerName = `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim();

  root.innerHTML = `
    <section class="order-confirmation-section sk-container">

      <div class="order-card order-success">
        <div class="order-check">✓</div>

        <h1>${settings.title}</h1>
        <p>${settings.subtitle}</p>

        <div class="order-meta">
          <div class="order-info-box">
            <div>
              <span>${settings.orderNumberLabel}</span>
              <strong>${order.id}</strong>
            </div>

            <div>
              <span>${settings.orderDateLabel}</span>
              <strong>${new Date(order.createdAt).toLocaleString()}</strong>            
            </div>

            <div>
              <span>${settings.paymentMethodLabel}</span>
              <strong>${order.paymentLabel || order.paymentMethod || "Cash on Delivery"}</strong>
            </div>

            <div>
              <span>${settings.orderStatusLabel}</span>
              <strong class="status-badge">${order.orderStatus || "Pending"}</strong>
            </div>

            <div>
              <span>${settings.customerLabel}</span>
              <strong>${order.customer?.firstName} ${order.customer?.lastName}</strong>
            </div>
          </div>
        </div>

          
        </div>
      </div>

      <div class="order-layout">

        <div class="order-card">
          <h2>${settings.summaryTitle}</h2>

          <div class="order-items">
            ${order.items.map(item => `
              <div class="order-item">
                <img src="${item.image}" alt="${item.title}">

                <div>
                  <h3>${item.title}</h3>
                  <p>Qty: ${item.quantity}</p>
                </div>

                <strong>${formatPrice(Number(item.price) * Number(item.quantity || 1))}</strong>
              </div>
            `).join("")}
          </div>

          <div class="order-total">
            <span>${settings.subtotalLabel}</span>
            <strong>${formatPrice(order.subtotal)}</strong>
          </div>
        </div>

        <div class="order-card">
          <h2>Shipping Details</h2>

          <p>${order.customer.address}</p>
          <p>${order.customer.city}, ${order.customer.postalCode}</p>
          <p>${order.customer.country}</p>
          <p>${order.customer.email}</p>
          <p>${order.customer.phone}</p>

          <a class="order-btn" href="catalog-page.html">
            ${settings.continueShoppingText}
          </a>
        </div>

      </div>

    </section>
  `;
}