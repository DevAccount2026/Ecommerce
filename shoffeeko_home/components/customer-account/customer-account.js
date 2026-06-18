document.addEventListener("DOMContentLoaded", initCustomerAccount);

async function initCustomerAccount() {
  const root = document.getElementById("customerAccountPage");
  if (!root) return;

  const response = await fetch("../components/customer-account/customer-account.json");
  const data = await response.json();
  const settings = data.settings || {};

  const sessionKey = settings.sessionStorageKey || "shoffeeko_current_customer";
  const customer = JSON.parse(localStorage.getItem(sessionKey));

  if (!customer) {
    window.location.href = "cust_login.html";
    return;
  }

  root.innerHTML = `
    <section class="customer-account-section sk-container">

      <h1>${settings.title}</h1>

      <div class="account-layout">

        <div class="account-card account-welcome">
          <h2>${settings.welcomeText}, ${customer.firstName}!</h2>
          <p>You are now logged in to your ShoffeeKo account.</p>

          <div class="account-actions">
            <a href="order-history.html" class="account-btn">
              ${settings.orderHistoryText}
            </a>
            <a href="order-tracking.html" class="account-btn">
              Track Order
            </a>
            <a href="cust_wishlist.html" class="account-btn">
              My Wishlist
            </a>

            <a href="cust_addresses.html" class="account-btn">
              Saved Addresses
            </a>

            <button type="button" class="account-btn account-btn-outline" id="logoutBtn">
              ${settings.logoutText}
            </button>
          </div>
          
        </div>

        <div class="account-card">
          <h2>${settings.accountDetailsTitle}</h2>

          <div class="account-detail-row">
            <span>Name</span>
            <strong>${customer.firstName} ${customer.lastName}</strong>
          </div>

          <div class="account-detail-row">
            <span>Email</span>
            <strong>${customer.email}</strong>
          </div>

          <div class="account-detail-row">
            <span>Customer ID</span>
            <strong>${customer.id}</strong>
          </div>
        </div>

      </div>

    </section>
  `;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem(sessionKey);
    window.location.href = "cust_login.html";
  });
}