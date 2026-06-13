const ADMIN_PRODUCTS_KEY = "adminProducts";

function getAdminProducts() {
  return JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY)) || null;
}

function saveAdminProducts(products) {
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
}

function clearAdminProducts() {
  localStorage.removeItem(ADMIN_PRODUCTS_KEY);
}