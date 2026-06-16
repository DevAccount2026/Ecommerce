document.addEventListener("DOMContentLoaded", initCheckoutPage);

async function initCheckoutPage() {
  const root = document.getElementById("checkoutPage");
  if (!root) return;

  const response = await fetch("../components/checkout-page/checkout-page.json");
  const data = await response.json();
  const settings = data.settings || {};

  const cartKey = settings.cartKey || "shoffeeko_cart";
  const ordersKey = settings.ordersKey || "shoffeeko_orders";
  const customerKey = "shoffeeko_current_customer";
  const addressesKey = "shoffeeko_addresses";

  const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
  const customer = JSON.parse(localStorage.getItem(customerKey));
  const allAddresses = JSON.parse(localStorage.getItem(addressesKey)) || [];

  const customerAddresses = customer
    ? allAddresses.filter(addr => addr.customerEmail === customer.email)
    : [];

  const defaultAddress =
    customerAddresses.find(addr => addr.isDefault) ||
    customerAddresses[0] ||
    null;

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

  function safeValue(value) {
    return value || "";
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
              <input
                type="email"
                name="email"
                value="${safeValue(customer?.email)}"
                ${customer ? "readonly" : ""}
                required
              >
            </label>

            <label>
              Phone
              <input type="tel" name="phone" value="${safeValue(defaultAddress?.phone)}" required>
            </label>
          </div>

          <div class="checkout-card">
            <h2>${settings.shippingTitle}</h2>

            ${
              customerAddresses.length
                ? `
                  <label>
                    Saved Addresses
                    <select id="savedAddressSelect">
                      ${customerAddresses.map(addr => `
                        <option value="${addr.id}" ${addr.id === defaultAddress?.id ? "selected" : ""}>
                          ${addr.address}, ${addr.city} ${addr.isDefault ? "(Default)" : ""}
                        </option>
                      `).join("")}
                    </select>
                  </label>
                `
                : `
                  <p class="checkout-note">
                    No saved address found. You can enter a shipping address manually.
                  </p>
                `
            }

            <div class="checkout-row">
              <label>
                First Name
                <input type="text" name="firstName" value="${safeValue(defaultAddress?.firstName || customer?.firstName)}" required>
              </label>

              <label>
                Last Name
                <input type="text" name="lastName" value="${safeValue(defaultAddress?.lastName || customer?.lastName)}" required>
              </label>
            </div>

            <label>
              Address
              <input type="text" name="address" value="${safeValue(defaultAddress?.address)}" required>
            </label>

            <div class="checkout-row">
              <label>
                City
                <input type="text" name="city" value="${safeValue(defaultAddress?.city)}" required>
              </label>

              <label>
                Postal Code
                <input type="text" name="postalCode" value="${safeValue(defaultAddress?.postalCode)}" required>
              </label>
            </div>

            <label>
              Country
              <input type="text" name="country" value="${safeValue(defaultAddress?.country || "Philippines")}" required>
            </label>
          </div>
         
           <div class="checkout-card">
              <h2>Payment Method</h2>

            <label class="payment-option">
              <div class="payment-option__left">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked
                >
                <span>Cash on Delivery</span>   -    <small>Pay when your order arrives.</small>
               
              </div>

             

            </label>  
             
           <label class="payment-option payment-option--disabled">
              <div class="payment-option__left">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="GCash"
                  disabled
                >
                <span>GCash (Coming Soon)</span>
              </div>
            </label>

            <label class="payment-option payment-option--disabled">
              <div class="payment-option__left">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Bank Transfer"
                  disabled
                >
                <span>Bank Transfer (Coming Soon)</span>
              </div>
            </label>

            <label class="payment-option payment-option--disabled">
              <div class="payment-option__left">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Maya"
                  disabled
                >
                <span>Maya (Coming Soon)</span>
              </div>
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
  const savedAddressSelect = document.getElementById("savedAddressSelect");

  function fillAddressForm(address) {
    if (!address) return;

    form.elements.email.value = address.customerEmail || customer?.email || "";
    form.elements.phone.value = address.phone || "";
    form.elements.firstName.value = address.firstName || "";
    form.elements.lastName.value = address.lastName || "";
    form.elements.address.value = address.address || "";
    form.elements.city.value = address.city || "";
    form.elements.postalCode.value = address.postalCode || "";
    form.elements.country.value = address.country || "Philippines";
  }

  savedAddressSelect?.addEventListener("change", e => {
    const selectedAddress = customerAddresses.find(
      addr => addr.id === e.target.value
    );

    fillAddressForm(selectedAddress);
  });

  form.addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(form);

    const order = {
      id: "SK-" + Date.now(),
      createdAt: new Date().toISOString(),
      customerEmail: customer?.email || formData.get("email"),
      customer: Object.fromEntries(formData.entries()),
      selectedAddressId: savedAddressSelect?.value || null,
      
      subtotal,
      paymentStatus: "Pending",
      orderStatus: "Pending",

      items: cart.map(item => ({
        id: item.id,
        sku: item.sku,
        title: item.title || item.name,
        category: item.category || "Uncategorized",
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        image: item.image
      }))

      
    };

    const orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    orders.push(order);

    localStorage.setItem(ordersKey, JSON.stringify(orders));
    localStorage.removeItem(cartKey);

    window.location.href = `order-confirmation.html?id=${order.id}`;
  });
}