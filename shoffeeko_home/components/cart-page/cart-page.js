document.addEventListener("DOMContentLoaded", initCartPage);

async function initCartPage() {
  const root = document.getElementById("cartPage");
  if (!root) return;

  const response = await fetch("../components/cart-page/cart-page.json");
  const data = await response.json();
  const settings = data.settings || {};

  root.innerHTML = `
    <section class="cart-page-section sk-container">
      <div class="cart-page__content"></div>
    </section>
  `;

  const content = root.querySelector(".cart-page__content");
  const cartKey = settings.cartKey || "shoffeeko_cart";

  function getCart() {
    return JSON.parse(localStorage.getItem(cartKey)) || [];
  }

  function saveCart(cart) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateHeaderCartCount(cart);
  }

  function updateHeaderCartCount(cart) {
    const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const cartCount = document.getElementById("cartCount");

    if (cartCount) {
      cartCount.textContent = count;
    }
  }

  function formatPrice(price) {
    return `$${Number(price || 0).toFixed(2)} ${settings.currency || "USD"}`;
  }

  function renderCart() {
    const cart = getCart();
    updateHeaderCartCount(cart);

    if (!cart.length) {
      content.innerHTML = `
        <div class="cart-empty">
          <h1>${settings.emptyTitle}</h1>
          <p>${settings.emptyText}</p>
          <a class="cart-btn cart-btn-light" href="catalog-page.html">
            ${settings.continueShoppingText}
          </a>
        </div>
      `;
      return;
    }

    const subtotal = cart.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 1);
    }, 0);

    content.innerHTML = `
      <h1 class="cart-title">${settings.title}</h1>

      <div class="cart-layout">
        <div class="cart-items">
          ${cart.map(item => `
            <article class="cart-item" data-id="${item.id}">
              <img src="${item.image}" alt="${item.title}">

              <div class="cart-item__info">
                <h2>${item.title}</h2>
                <p>${formatPrice(item.price)}</p>

                <div class="cart-qty">
                  <button type="button" data-action="decrease">−</button>
                  <span>${item.quantity}</span>
                  <button type="button" data-action="increase">+</button>
                </div>

                <button class="cart-remove" type="button" data-action="remove">
                  Remove
                </button>
              </div>

              <strong class="cart-line-price">
                ${formatPrice(Number(item.price) * Number(item.quantity))}
              </strong>
            </article>
          `).join("")}
        </div>

        <aside class="cart-summary">
          <h2>Order Summary</h2>

          <div class="cart-summary-row">
            <span>${settings.subtotalText}</span>
            <strong>${formatPrice(subtotal)}</strong>
          </div>

          <p class="cart-note">
            Shipping and discounts calculated at checkout.
          </p>

          <a class="cart-btn cart-btn-checkout" href="checkout.html">
            ${settings.checkoutText}
          </a>

          <a class="cart-continue" href="catalog-page.html">
            ${settings.continueShoppingText}
          </a>
        </aside>
      </div>
    `;
  }

  content.addEventListener("click", e => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;

    const itemEl = button.closest(".cart-item");
    if (!itemEl) return;

    const id = itemEl.dataset.id;
    const action = button.dataset.action;
    let cart = getCart();

    if (action === "increase") {
      cart = cart.map(item =>
        item.id === id
          ? { ...item, quantity: Number(item.quantity || 1) + 1 }
          : item
      );
    }

    if (action === "decrease") {
      cart = cart
        .map(item =>
          item.id === id
            ? { ...item, quantity: Math.max(1, Number(item.quantity || 1) - 1) }
            : item
        );
    }

    if (action === "remove") {
      cart = cart.filter(item => item.id !== id);
    }

    saveCart(cart);
    renderCart();
  });

  renderCart();
}