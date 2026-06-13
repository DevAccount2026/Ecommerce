document.addEventListener("DOMContentLoaded", initWishlistPage);

async function initWishlistPage() {
  const root = document.getElementById("customerWishlistPage");
  if (!root) return;

  const response = await fetch("../components/customer-wishlist/customer-wishlist.json");
  const data = await response.json();
  const settings = data.settings || {};

  const sessionKey = settings.sessionStorageKey || "shoffeeko_current_customer";
  const wishlistKey = settings.wishlistKey || "shoffeeko_wishlist";

  const customer = JSON.parse(localStorage.getItem(sessionKey));

  if (!customer) {
    window.location.href = "cust_login.html";
    return;
  }

  const productResponse = await fetch(settings.productDataPath);
  const productData = await productResponse.json();
  const products = productData.products || [];

  function getWishlist() {
    return JSON.parse(localStorage.getItem(wishlistKey)) || [];
  }

  function saveWishlist(wishlist) {
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
  }

  function formatPrice(product) {
    return `${product.pricePrefix || ""}$${Number(product.price || 0).toFixed(2)} ${settings.currency || "USD"}`;
  }

  function renderWishlist() {
    const wishlist = getWishlist();

    const customerWishlist = wishlist.filter(item =>
      item.customerEmail === customer.email
    );

    const wishlistProducts = customerWishlist
      .map(item => products.find(product => product.id === item.productId))
      .filter(Boolean);

    if (!wishlistProducts.length) {
      root.innerHTML = `
        <section class="wishlist-section sk-container">
          <div class="wishlist-empty">
            <h1>${settings.emptyTitle}</h1>
            <p>${settings.emptyText}</p>

            <div class="wishlist-actions">
              <a href="catalog-page.html" class="wishlist-btn">
                ${settings.continueShoppingText}
              </a>

              <a href="cust_account.html" class="wishlist-btn wishlist-btn-outline">
                ${settings.backToAccountText}
              </a>
            </div>
          </div>
        </section>
      `;
      return;
    }

    root.innerHTML = `
      <section class="wishlist-section sk-container">
        <div class="wishlist-header">
          <h1>${settings.title}</h1>
          <a href="cust_account.html">${settings.backToAccountText}</a>
        </div>

        <div class="wishlist-grid">
          ${wishlistProducts.map(product => `
            <article class="wishlist-card" data-id="${product.id}">
              <img src="${product.image}" alt="${product.title}">

              <div class="wishlist-card__body">
                <h2>${product.title}</h2>
                <p>${formatPrice(product)}</p>

                <div class="wishlist-card__actions">
                  <a href="product.html?id=${product.id}" class="wishlist-btn">
                    View Product
                  </a>

                  <button type="button" class="wishlist-remove" data-remove="${product.id}">
                    Remove
                  </button>
                </div>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  root.addEventListener("click", e => {
    const removeBtn = e.target.closest("[data-remove]");
    if (!removeBtn) return;

    const productId = removeBtn.dataset.remove;

    const wishlist = getWishlist().filter(item =>
      !(item.customerEmail === customer.email && item.productId === productId)
    );

    saveWishlist(wishlist);
    renderWishlist();
  });

  renderWishlist();
}