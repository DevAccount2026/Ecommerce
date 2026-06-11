document.addEventListener("DOMContentLoaded", initCheckoutPage);

async function initCheckoutPage() {
  const root = document.getElementById("checkoutPage");
  if (!root) return;

  const response = await fetch("../components/checkout-page/checkout-page.json");
  const data = await response.json();
  const settings = data.settings || {};

  const cartKey = settings.cartKey || "shoffeeko_cart";
  const ordersKey = settings.ordersKey || "shoffeeko_orders";

  const cart = JSON.parse(localStorage.getItem(cartKey)) || [];

  if (!cart.length) {
    root.innerHTML = `
      <section class="checkout-empty sk-container">
        <h1>Your cart is empty</h1>
        <a href="catalog-page.html">Continue Shopping</a>
      </section>
    `;
    return;
  }

  const subtotal = cart.reduce((sum, item) => {
    return sum + parsePrice(item.price) * Number(item.quantity || 1);
  }, 0);

  

  function parsePrice(price) {
  if (typeof price === "number") return price;

  return Number(
    String(price)
      .replace("From", "")
      .replace("USD", "")
      .replace("$", "")
      .trim()
    ) || 0;
  }

  function formatPrice(value) {
    return `$${Number(value || 0).toFixed(2)} ${settings.currency || "USD"}`;
  }

  
  root.innerHTML = `
    <section class="checkout-section sk-container">

      <h1>${settings.title}</h1>

      <div class="checkout-layout">

        <form class="checkout-form" id="checkoutForm">

          <div class="checkout-card">
            <h2>${settings.contactTitle}</h2>

            <label>
              Email
              <input type="email" name="email" required>
            </label>

            <label>
              Phone
              <input type="tel" name="phone" required>
            </label>
          </div>

          <div class="checkout-card">
            <h2>${settings.shippingTitle}</h2>

            <div class="checkout-row">
              <label>
                First Name
                <input type="text" name="firstName" required>
              </label>

              <label>
                Last Name
                <input type="text" name="lastName" required>
              </label>
            </div>

            <label>
              Address
              <input type="text" name="address" required>
            </label>

            <div class="checkout-row">
              <label>
                City
                <input type="text" name="city" required>
              </label>

              <label>
                Postal Code
                <input type="text" name="postalCode" required>
              </label>
            </div>

            <label>
              Country
              <input type="text" name="country" value="Philippines" required>
            </label>
          </div>

          <button class="checkout-submit" type="submit">
            ${settings.placeOrderText}
          </button>

          <a class="checkout-return" href="cart.html">
            ${settings.returnToCartText}
          </a>

        </form>

        <aside class="checkout-summary">
          <h2>${settings.summaryTitle}</h2>

          <div class="checkout-items">
            ${cart.map(item => `
              <div class="checkout-item">
                <img src="${item.image}" alt="${item.title}">
                <div>
                  <h3>${item.title}</h3>
                  <p>Qty: ${item.quantity}</p>
                </div>
                <strong>${formatPrice(parsePrice(item.price) * Number(item.quantity || 1))}</strong>
              </div>
            `).join("")}
          </div>

          <div class="checkout-total">
            <span>Subtotal</span>
            <strong>${formatPrice(subtotal)}</strong>
          </div>

          <p class="checkout-note">
            Payment integration will be added later. This version saves the order locally.
          </p>
        </aside>

      </div>
    </section>
  `;

  const form = document.getElementById("checkoutForm");

  form.addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(form);

    const order = {
      id: "SK-" + Date.now(),
      createdAt: new Date().toISOString(),
      customer: Object.fromEntries(formData.entries()),
      items: cart,
      subtotal
    };

    const orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    orders.push(order);

    localStorage.setItem(ordersKey, JSON.stringify(orders));
    localStorage.removeItem(cartKey);

    window.location.href = `order-confirmation.html?id=${order.id}`;
  });
}