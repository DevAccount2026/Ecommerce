const CUSTOMER_SESSION_KEY = "shoffeeko_current_customer";

function getCurrentCustomer() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_SESSION_KEY));
  } catch {
    return null;
  }
}

function protectCustomerPage() {
  const customer = getCurrentCustomer();

  if (!customer) {
    window.location.href = "cust_login.html";
  }
}

document.addEventListener("DOMContentLoaded", protectCustomerPage);