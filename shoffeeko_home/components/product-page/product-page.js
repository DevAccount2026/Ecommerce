document.addEventListener('DOMContentLoaded', initProductPage);

async function initProductPage() {
  const root = document.getElementById('productPage');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  const response = await fetch("../components/product-page/product-page.json");
  const data = await response.json();

  const savedProducts = JSON.parse(localStorage.getItem("adminProducts"));

  const products = Array.isArray(savedProducts) && savedProducts.length > 0
    ? savedProducts.map(product => ({
        ...product,
        title: product.title || product.name,
        name: product.name || product.title,
        price: Number(product.price || 0),
        image: product.image || product.imageUrl || "",
        vendor: product.vendor || "SHOFFEEKO",
        collection: product.collection || product.category,
        hasOptions: product.hasOptions || false
      }))
    : data.products || [];

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

        <button
          class="product-wishlist-heart"
          data-wishlist="${product.id}"
          type="button">
          ♥ Add to Wishlist
        </button>

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
            <img src="${item.image}" alt="${item.title || item.name}">
            <h3>${item.title || item.name}</h3>
            <p>${item.pricePrefix || ''}$${Number(item.price).toFixed(2)} USD</p>
          </a>
        `).join('')}
      </div>
    </section>
  `;

   // Add event listeners for add to cart and buy buttons
    const addButton = root.querySelector(".product-add");

      addButton?.addEventListener("click", () => {
        if (typeof addToCart !== "function") {
          console.error("addToCart function not found. Make sure cart.js is loaded.");
          return;
        }

        const quantity = Number(
          root.querySelector(".quantity-box span")?.textContent || 1
        );

        addToCart({
          id: product.id,
          title: product.title || product.name,
          price: product.price,
          image: product.image,
          quantity
        });
      });

  // Add event listener for qantity buttons
  
    const qtyBox = root.querySelector(".quantity-box");
    const qtyValue = qtyBox?.querySelector("span");

    qtyBox?.addEventListener("click", e => {
      const button = e.target.closest("button");
      if (!button || !qtyValue) return;

      let quantity = Number(qtyValue.textContent || 1);

      if (button.textContent.trim() === "+") {
        quantity++;
      }

      if (button.textContent.trim() === "−" || button.textContent.trim() === "-") {
        quantity = Math.max(1, quantity - 1);
      }

      qtyValue.textContent = quantity;
    });

  // Add event listeners  wishlist buttons

      const wishlistButton = root.querySelector("[data-wishlist]");

      function getWishlist() {
        return JSON.parse(localStorage.getItem("shoffeeko_wishlist")) || [];
      }

      function saveWishlist(wishlist) {
        localStorage.setItem("shoffeeko_wishlist", JSON.stringify(wishlist));
      }

      function getCustomer() {
        return JSON.parse(localStorage.getItem("shoffeeko_current_customer"));
      }

      function updateWishlistButton() {
        const customer = getCustomer();
        if (!customer || !wishlistButton) return;

        const wishlist = getWishlist();

        const exists = wishlist.find(item =>
          item.customerEmail === customer.email &&
          item.productId === product.id
        );

        if (exists) {
          wishlistButton.classList.add("active");
          wishlistButton.textContent = "♥ Saved to Wishlist";
        } else {
          wishlistButton.classList.remove("active");
          wishlistButton.textContent = "♥ Add to Wishlist";
        }
      }

      wishlistButton?.addEventListener("click", () => {
        const customer = getCustomer();

        if (!customer) {
          window.location.href = "cust_login.html";
          return;
        }

        let wishlist = getWishlist();

        const exists = wishlist.find(item =>
          item.customerEmail === customer.email &&
          item.productId === product.id
        );

        if (exists) {
          wishlist = wishlist.filter(item =>
            !(item.customerEmail === customer.email &&
              item.productId === product.id)
          );
        } else {
          wishlist.push({
            customerEmail: customer.email,
            productId: product.id
          });
        }

        saveWishlist(wishlist);
        updateWishlistButton();
      });

      updateWishlistButton();
}