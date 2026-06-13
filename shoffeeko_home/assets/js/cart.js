const CART_KEY = "shoffeeko_cart";

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(product) {
  const cart = getCart();

  const existingItem = cart.find(item => item.id === product.id);

const qtyToAdd = Number(product.quantity || 1);

if (existingItem) {
  existingItem.quantity += qtyToAdd;
} else {
  cart.push({
    id: product.id,
    title: product.title,
    price: product.price,
    image: product.image,
    quantity: qtyToAdd
  });
}

  saveCart(cart);
  updateCartCount();
  openCartDrawer();

  console.log("Cart updated:", cart);
}

function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartCount = document.getElementById("cartCount");

  if (cartCount) {
    cartCount.textContent = totalItems > 0 ? String(totalItems) : "";
  }
}

function openCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  if (!drawer) return;

  renderCartDrawer();
  drawer.hidden = false;
}

function closeCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  if (drawer) {
    drawer.hidden = true;
  }
}

function renderCartDrawer() {
  const cart = getCart();
  const itemsBox = document.getElementById("cartDrawerItems");

  if (!itemsBox) return;

  const latestItem = cart[cart.length - 1];

  if (!latestItem) {
    itemsBox.innerHTML = `<p>Your cart is empty.</p>`;
    return;
  }

  itemsBox.innerHTML = `
    <div class="cart-drawer__item">
      <img src="${latestItem.image}" alt="${latestItem.title}">
      <div>
        <div class="cart-drawer__item-title">${latestItem.title}</div>
        <div>Quantity: ${latestItem.quantity}</div>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", updateCartCount);

document.addEventListener("shellReady", () => {
  updateCartCount();

  document.getElementById("cartDrawerClose")?.addEventListener("click", closeCartDrawer);

  document.getElementById("cartDrawerContinue")?.addEventListener("click", closeCartDrawer);

  document.getElementById("cartButton")?.addEventListener("click", event => {
    event.preventDefault();
    openCartDrawer();
  });
});