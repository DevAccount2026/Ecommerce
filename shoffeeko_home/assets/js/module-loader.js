const SKModules = {};

const isInsidePages = window.location.pathname.includes('/pages/');
const BASE_PATH = isInsidePages ? '../' : '';

async function loadHTML(el, name) {
  const response = await fetch(`${BASE_PATH}components/${name}/${name}.html`);
  el.innerHTML = await response.text();
}

async function loadCSS(name) {
  if (document.querySelector(`link[data-module-css="${name}"]`)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${BASE_PATH}components/${name}/${name}.css`;
  link.dataset.moduleCss = name;

  document.head.appendChild(link);
}

async function loadJS(name) {
  if (document.querySelector(`script[data-module-js="${name}"]`)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.src = `${BASE_PATH}components/${name}/${name}.js`;
    script.dataset.moduleJs = name;
    script.onload = resolve;
    script.onerror = reject;

    document.body.appendChild(script);
  });
}

async function loadJSON(name, config) {
  const file = config || name;
  const response = await fetch(`${BASE_PATH}components/${name}/${file}.json`);

  return response.json();
}

async function renderShell() {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');

  if (header) {
    header.innerHTML = `
      <div class="announcement-bar">
        Welcome to our SHOFFEEKO store
      </div>

      <header class="sk-header">
        <div class="sk-container sk-header__inner">

          <a class="sk-logo" href="${BASE_PATH}index.html">
            <img src="${BASE_PATH}assets/images/logo.jpg" alt="">
          </a>

          <nav class="sk-nav">
            <a href="${BASE_PATH}index.html">Home</a>
            <a href="${BASE_PATH}pages/catalog-page.html">Catalog</a>
            <a href="#blogs">Blogs</a>
            <a href="#discount">Discount</a>
            <a href="#contact">Contact</a>
          </nav>

          <div class="sk-icons">
            <img src="${BASE_PATH}assets/images/icons/icon-search.svg" alt="Search">

            <div class="customer-account-menu">
              <button type="button" id="accountMenuButton" class="customer-account-link">
                <img src="${BASE_PATH}assets/images/icons/icon-account.svg" alt="Account">
                <span id="customerHeaderName">Login</span>
                <span id="customerMenuArrow">▾</span>
              </button>

              <div class="customer-dropdown" id="customerDropdown">
                <a href="${BASE_PATH}pages/cust_account.html">My Account</a>
                <a href="${BASE_PATH}pages/order-history.html">Order History</a>
                <a href="${BASE_PATH}pages/cust_addresses.html">Saved Addresses</a>
                <a href="${BASE_PATH}pages/customer_wishlist.html">Wishlist</a>
                <button type="button" id="customerLogoutBtn">Logout</button>
              </div>
            </div>

              <a href="${BASE_PATH}pages/cart.html" class="sk-cart-link" id="cartButton" aria-label="Cart">
                <img src="${BASE_PATH}assets/images/icons/icon-cart.svg" alt="Cart">
                <span id="cartCount" class="cart-count-badge">0</span>
              </a>

          </div>

        </div>

        <div id="cartDrawer" class="cart-drawer" hidden>
          <div class="cart-drawer__box">
            <button type="button" class="cart-drawer__close" id="cartDrawerClose">×</button>
            <p class="cart-drawer__status">✓ Item added to your cart</p>
            <div id="cartDrawerItems"></div>
            <a href="${BASE_PATH}pages/cart.html" class="cart-drawer__btn">View cart</a>
            <a href="${BASE_PATH}pages/checkout.html" class="cart-drawer__btn cart-drawer__btn--checkout">Check out</a>
            <button class="cart-drawer__continue" id="cartDrawerContinue">Continue shopping</button>
          </div>
        </div>

        
      </header>
    `;
  }
  if (footer) {
    footer.innerHTML = '';
  }

  function updateAccountLink() {
  let customer = null;

  try {
    customer = JSON.parse(
      localStorage.getItem("shoffeeko_current_customer")
    );
  } catch {
    customer = null;
  }

  const nameEl = document.getElementById("customerHeaderName");
  const dropdown = document.getElementById("customerDropdown");
  const menuButton = document.getElementById("accountMenuButton");
  const logoutBtn = document.getElementById("customerLogoutBtn");

  if (!nameEl || !menuButton) return;

  if (customer) {
    const firstName =
      customer.firstName ||
      customer.name?.split(" ")[0] ||
      "Account";

    nameEl.textContent = firstName;

    menuButton.addEventListener("click", event => {
      event.stopPropagation();
      dropdown?.classList.toggle("active");
    });

    logoutBtn?.addEventListener("click", () => {
      localStorage.removeItem("shoffeeko_current_customer");
      window.location.href = `${BASE_PATH}pages/cust_login.html`;
    });

    document.addEventListener("click", () => {
      dropdown?.classList.remove("active");
    });
    } else {
      nameEl.textContent = "Login";

      menuButton.addEventListener("click", () => {
        window.location.href = `${BASE_PATH}pages/cust_login.html`;
      });

      if (dropdown) {
        dropdown.remove();
      }
    }
  }

  updateAccountLink();
  setActiveNav();
  document.dispatchEvent(new Event("shellReady"));
}

function setActiveNav() {
  const page = document.querySelector('main')?.dataset.page;

  document.querySelectorAll('.sk-nav a').forEach(link => {
    link.classList.remove('active');
  });

  if (page === 'home') {
    document.querySelector('.sk-nav a[href$="index.html"]')?.classList.add('active');
  }

  if (page === 'catalog') {
    document.querySelector('.sk-nav a[href$="catalog-page.html"]')?.classList.add('active');
  }
}



async function initModules() {
  await renderShell();


  await loadGlobalJS("assets/js/customer-helpers.js", "customer-helpers");

  const nodes = [...document.querySelectorAll('[data-module]')];

  for (const node of nodes) {
    const name = node.dataset.module;

    try {
      await loadCSS(name);
      await loadHTML(node, name);
      await loadJS(name);

      const data = await loadJSON(name, node.dataset.config);

      SKModules[name]?.init?.(node, data);
    } catch (error) {
      node.innerHTML = `<div class="module-missing">Module error: ${name}</div>`;
      console.error(error);
    }
  }

  observeReveals();
}


async function loadGlobalJS(path, key) {
        if (document.querySelector(`script[data-global-js="${key}"]`)) {
          return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
          const script = document.createElement("script");

          script.src = `${BASE_PATH}${path}`;
          script.dataset.globalJs = key;
          script.onload = resolve;
          script.onerror = reject;

          document.body.appendChild(script);
        });
      }


function observeReveals() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    },
    {
      threshold: 0.18
    }
  );

  document.querySelectorAll('.reveal').forEach(item => {
    observer.observe(item);
  });
}

document.addEventListener('DOMContentLoaded', initModules);