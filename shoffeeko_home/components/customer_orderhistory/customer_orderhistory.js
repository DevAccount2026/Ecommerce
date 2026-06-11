document.addEventListener("DOMContentLoaded", initOrderHistory);

async function initOrderHistory() {
  const root = document.getElementById("customerOrderHistoryPage");
  if (!root) return;

  const response = await fetch("../components/customer-orderhistory/customer-orderhistory.json");
  const data = await response.json();
  const settings = data.settings || {};

  const sessionKey = settings.sessionStorageKey || "shoffeeko_current_customer";
  const ordersKey = settings.ordersKey || "shoffeeko_orders";

  const customer = JSON.parse(localStorage.getItem(sessionKey));

  if (!customer) {
    window.location.href = "cust_login.html";
    return;
  }

  const allOrders = JSON.parse(localStorage.getItem(ordersKey)) || [];

  const customerOrders = allOrders.filter(order =>
    order.customer?.email === customer.email
  );

  function formatPrice(value) {
    return `$${Number(value || 0).toFixed(2)} ${settings.currency || "USD"}`;
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  if (!customerOrders.length) {
    root.innerHTML = `
      <section class="orderhistory-section sk-container">
        <div class="orderhistory-empty">
          <h1>${settings.emptyTitle}</h1>
          <p>${settings.emptyText}</p>

          <div class="orderhistory-actions">
            <a href="catalog-page.html" class="orderhistory-btn">
              ${settings.continueShoppingText}
            </a>

            <a href="cust_account.html" class="orderhistory-btn orderhistory-btn-outline">
              ${settings.backToAccountText}
            </a>
          </div>
        </div>
      </section>
    `;
    return;
  }

  root.innerHTML = `
    <section class="orderhistory-section sk-container">

      <div class="orderhistory-header">
        <h1>${settings.title}</h1>

        <a href="cust_account.html" class="orderhistory-link">
          ${settings.backToAccountText}
        </a>
      </div>

      <div class="orderhistory-list">
        ${customerOrders.map(order => `
          <article class="orderhistory-card">

            <div class="orderhistory-card__top">
              <div>
                <span>Order Number</span>
                <strong>${order.id}</strong>
              </div>

              <div>
                <span>Date</span>
                <strong>${formatDate(order.createdAt)}</strong>
              </div>

              <div>
                <span>Total</span>
                <strong>${formatPrice(order.subtotal)}</strong>
              </div>
            </div>

            <div class="orderhistory-items">
              ${order.items.map(item => `
                <div class="orderhistory-item">
                  <img src="${item.image}" alt="${item.title}">

                  <div>
                    <h3>${item.title}</h3>
                    <p>Qty: ${item.quantity}</p>
                  </div>
                </div>
              `).join("")}
            </div>

          </article>
        `).join("")}
      </div>

    </section>
  `;
}