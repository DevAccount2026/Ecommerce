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
            <img src="${BASE_PATH}assets/images/icons/icon-account.svg" alt="Account">
            <img src="${BASE_PATH}assets/images/icons/icon-cart.svg" alt="Cart">
          </div>

        </div>
      </header>
    `;
  }

  if (footer) {
    footer.innerHTML = '';
  }

  setActiveNav();
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