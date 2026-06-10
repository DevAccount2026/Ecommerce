document.addEventListener("DOMContentLoaded", initCatalogPage);

async function initCatalogPage() {
  const root = document.getElementById("catalogPage");
  if (!root) return;

  try {
    const jsonPath = root.dataset.json || "../components/catalog-page/catalog-page.json";
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`Unable to load ${jsonPath}`);

    const data = await response.json();
    renderCatalog(root, data);
  } catch (error) {
    console.error("Catalog load error:", error);
    root.innerHTML = `<p class="catalog-error">Catalog failed to load. Please check your JSON path.</p>`;
  }
}

function renderCatalog(root, data) {
  const settings = data.settings || {};
  const products = Array.isArray(data.products) ? data.products : [];

  root.style.setProperty("--catalog-bg", settings.colors?.background || "#050505");
  root.style.setProperty("--catalog-text", settings.colors?.text || "#e8e2d2");
  root.style.setProperty("--catalog-muted", settings.colors?.muted || "#cfc7b9");
  root.style.setProperty("--catalog-border", settings.colors?.border || "#ffffff");
  root.style.setProperty("--catalog-accent", settings.colors?.accent || "#7d1839");
  root.style.setProperty("--columns-desktop", settings.columnsDesktop || 3);
  root.style.setProperty("--columns-tablet", settings.columnsTablet || 2);
  root.style.setProperty("--columns-mobile", settings.columnsMobile || 1);

  root.innerHTML = `
    <div class="catalog-inner">
      ${settings.showHeader ? `
        <div class="catalog-heading">
          <h1>${escapeHTML(settings.title || "Catalog")}</h1>
          <p>${escapeHTML(settings.subtitle || "")}</p>
        </div>` : ""}

      <div class="catalog-grid">
        ${products.map(product => renderProductCard(product, settings)).join("")}
      </div>
    </div>
  `;

  root.querySelectorAll("[data-add-to-cart]").forEach(button => {
    button.addEventListener("click", event => {
      const productId = button.dataset.addToCart;
      const product = products.find(item => item.id === productId);

      if (product?.hasOptions) {
        window.location.href = getProductUrl(product);
      } else {
          
              addToCart(product);
            
      }
    });
  });
}

function renderProductCard(product, settings) {
  const buttonLabel = product.hasOptions
    ? (settings.chooseOptionsText || "Choose options")
    : (settings.buttonText || "Add to cart");

  const productUrl = getProductUrl(product);

  return `
    <article class="catalog-card reveal-card">

      <a class="catalog-card__media catalog-card__media--${settings.imageRatio || "wide"}" href="${productUrl}">
        <img src="${product.image || ""}" alt="${escapeHTML(product.title || "Product image")}" loading="lazy">
      </a>

      <h2 class="catalog-card__title">
        <a href="${productUrl}">${escapeHTML(product.title || "Untitled product")}</a>
      </h2>

      <p class="catalog-card__price">${formatPrice(product, settings.currency || "USD")}</p>

      <button class="catalog-card__button" data-add-to-cart="${escapeHTML(product.id || "")}">
        ${escapeHTML(buttonLabel)}
      </button>

    </article>
  `;
}

function getProductUrl(product) {
  if (product.url) return product.url;

  const id = encodeURIComponent(product.id || "");
  return `product.html?id=${id}`;
}

function formatPrice(product, currency) {
  const amount = Number(product.price || 0).toFixed(2);
  return `${escapeHTML(product.pricePrefix || "")}$${amount} ${escapeHTML(currency)}`;
}

/*function addToCart(productId) {
  const cartCount = document.getElementById("cartCount");

  if (cartCount) {
    cartCount.textContent = String(Number(cartCount.textContent || 0) + 1);
  }

  console.log(`Added to cart: ${productId}`);
}*/

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  }[char]));
}

