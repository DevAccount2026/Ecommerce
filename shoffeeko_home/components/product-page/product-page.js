document.addEventListener('DOMContentLoaded', initProductPage);

async function initProductPage() {
  const root = document.getElementById('productPage');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  const response = await fetch('../components/product-page/product-page.json');
  const data = await response.json();

  const products = data.products || [];
  const product = products.find(p => p.id === productId);

  if (!product) {
    root.innerHTML = '<p>Product not found.</p>';
    return;
  }

  const relatedIds = product.relatedProducts || [];

  const related = relatedIds.length
    ? products.filter(p => relatedIds.includes(p.id))
    : products
        .filter(p =>
          p.id !== product.id &&
          p.collection === product.collection
        )
        .slice(0, 3);

  root.innerHTML = `
    <section class="product-detail sk-container">

      <div class="product-detail__image">
        <img src="${product.image}" alt="${product.title}">
      </div>

      <div class="product-detail__info">
        <p class="product-vendor">${product.vendor || 'SHOFFEEKO'}</p>

        <h1>${product.title}</h1>

        <p class="product-price">
          ${product.pricePrefix || ''}$${Number(product.price).toFixed(2)} USD
        </p>

        ${product.options && product.options.length ? `
          <div class="product-options">
            <p>Grind size</p>
            ${product.options.map(option => `
              <button type="button">${option}</button>
            `).join('')}
          </div>
        ` : ''}

        <div class="quantity-box">
          <p>Quantity</p>

          <div class="quantity-controls">
            <button type="button">−</button>
            <span>1</span>
            <button type="button">+</button>
          </div>
        </div>

        <button class="product-add" type="button">Add to cart</button>
        <button class="product-buy" type="button">Buy it now</button>

        <p class="product-description">
          ${product.description || 'Premium ShoffeeKo coffee blend crafted for everyday moments.'}
        </p>
      </div>

    </section>

    <section class="related-section sk-container">
      <h2>You may also like</h2>

      <div class="related-grid">
        ${related.map(item => `
          <a class="related-item" href="product.html?id=${item.id}">
            <img src="${item.image}" alt="${item.title}">
            <h3>${item.title}</h3>
            <p>${item.pricePrefix || ''}$${Number(item.price).toFixed(2)} USD</p>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}