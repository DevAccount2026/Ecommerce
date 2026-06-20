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

            <button type="button" id="openEditProfileBtn" class="account-btn">
              Edit Profile
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

        <div class="account-stats-grid">
          <div class="account-stat-card">
            <span>Total Orders</span>
            <strong id="accountTotalOrders">0</strong>
          </div>

          <div class="account-stat-card">
            <span>Total Spent</span>
            <strong id="accountTotalSpent">₱0</strong>
          </div>

          <div class="account-stat-card">
            <span>Wishlist Items</span>
            <strong id="accountWishlistItems">0</strong>
          </div>

          <div class="account-stat-card">
            <span>Saved Addresses</span>
            <strong id="accountSavedAddresses">0</strong>
          </div>
        </div>

<div class="account-card account-loyalty">
          <div class="account-card-header">
            <h2>Loyalty Rewards</h2>
            <span id="loyaltyTierLabel">Bronze</span>
          </div>

          <div class="loyalty-grid">
            <div>
              <span>Loyalty Points</span>
              <strong id="loyaltyPoints">0 pts</strong>
            </div>

            <div>
              <span>Member Tier</span>
              <strong id="loyaltyTier">Bronze</strong>
            </div>

            <div>
              <span>Next Reward</span>
              <strong id="loyaltyNextReward">0 pts</strong>
            </div>
          </div>

          <div class="loyalty-progress">
            <div id="loyaltyProgressBar"></div>
          </div>

          
        </div>
        

        <div class="account-card account-notifications">
          <div class="account-card-header">
            <h2>Notifications</h2>
            <button type="button" id="markNotificationsReadBtn">Mark all as read</button>
          </div>

          <div id="customerNotificationsList"></div>
        </div>

        <div class="account-card account-recent-orders">
          <div class="account-card-header">
            <h2>Recent Orders</h2>
            <a href="order-history.html">View All</a>
          </div>

          <div id="recentOrdersList"></div>
        </div>

        
      </div>

    </section>
   
    <div class="account-modal" id="editProfileModal" aria-hidden="true">
        <div class="account-modal__box">
          <div class="account-modal__header">
            <h2>Edit Profile</h2>
            <button type="button" id="closeEditProfileBtn">×</button>
          </div>

          <form id="editProfileForm" class="account-edit-form">
            <label>
              First Name
              <input type="text" id="editFirstName" required />
            </label>

            <label>
              Last Name
              <input type="text" id="editLastName" required />
            </label>

            <label>
              Email
              <input type="email" id="editEmail" required />
            </label>

            <label>
              New Password
              <input type="password" id="editPassword" placeholder="Leave blank to keep current password" />
            </label>

            <div class="account-edit-actions">
              <button type="button" id="cancelEditProfileBtn">Cancel</button>
              <button type="submit">Save Changes</button>
            </div>


          </form>

        </div>
      </div>
  `;

  const CUSTOMERS_KEY = "shoffeeko_customers";
  const SESSION_KEY = "shoffeeko_current_customer";

  function getCurrentCustomer() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  }

  function getCustomers() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOMERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCustomers(customers) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  }

  function saveSession(customer) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(customer));
  }

 function bindEditProfile() {
  const openBtn = document.querySelector("#openEditProfileBtn");
  const closeBtn = document.querySelector("#closeEditProfileBtn");
  const cancelBtn = document.querySelector("#cancelEditProfileBtn");
  const modal = document.querySelector("#editProfileModal");
  const form = document.querySelector("#editProfileForm");

  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
    const customer = getCurrentCustomer();
    if (!customer) return;

    document.querySelector("#editFirstName").value = customer.firstName || "";
    document.querySelector("#editLastName").value = customer.lastName || "";
    document.querySelector("#editEmail").value = customer.email || "";
    document.querySelector("#editPassword").value = "";

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  });

  closeBtn?.addEventListener("click", closeEditProfileModal);
  cancelBtn?.addEventListener("click", closeEditProfileModal);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeEditProfileModal();
    }
  });

  form.addEventListener("submit", handleProfileUpdate);
}

function closeEditProfileModal() {
  const modal = document.querySelector("#editProfileModal");
  modal?.classList.remove("active");
  modal?.setAttribute("aria-hidden", "true");
}

function handleProfileUpdate(event) {
  event.preventDefault();

  const currentCustomer = getCurrentCustomer();
  if (!currentCustomer) return;

  const customers = getCustomers();

  const firstName = document.querySelector("#editFirstName").value.trim();
  const lastName = document.querySelector("#editLastName").value.trim();
  const email = document.querySelector("#editEmail").value.trim().toLowerCase();
  const password = document.querySelector("#editPassword").value.trim();

  const emailExists = customers.some(customer => {
    return customer.email === email && customer.id !== currentCustomer.id;
  });

  if (emailExists) {
    alert("This email is already used by another account.");
    return;
  }

  const updatedCustomer = {
    ...currentCustomer,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email,
    updatedAt: new Date().toISOString()
  };

  if (password) {
    updatedCustomer.password = password;
  }

  const updatedCustomers = customers.map(customer => {
    return customer.id === currentCustomer.id ? updatedCustomer : customer;
  });

  saveCustomers(updatedCustomers);
  saveSession(updatedCustomer);

  closeEditProfileModal();
  location.reload();
}
   
function getOrders() {
  try {
    return JSON.parse(localStorage.getItem("shoffeeko_orders")) || [];
  } catch {
    return [];
  }
}

function formatCurrency(amount) {
  return `₱${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

function renderLoyaltyRewards(customer) {
  const customerEmail = customer.email?.toLowerCase();

  const customerOrders = getOrders().filter(order => {
    const email =
      order.customerEmail ||
      order.email ||
      order.customer?.email;

    return email?.toLowerCase() === customerEmail;
  });

  const totalSpent = customerOrders.reduce((sum, order) => {
    return sum + Number(order.total || order.subtotal || 0);
  }, 0);

  const points = Math.floor(totalSpent / 100);

  let tier = "Bronze";
  let nextTier = "Silver";
  let nextGoal = 100;

  if (points >= 500) {
    tier = "Gold";
    nextTier = "VIP";
    nextGoal = 1000;
  } else if (points >= 100) {
    tier = "Silver";
    nextTier = "Gold";
    nextGoal = 500;
  }

  const remaining = Math.max(nextGoal - points, 0);
  const progress = Math.min((points / nextGoal) * 100, 100);

  document.querySelector("#loyaltyPoints").textContent = `${points} pts`;
  document.querySelector("#loyaltyTier").textContent = tier;
  document.querySelector("#loyaltyTierLabel").textContent = tier;
  document.querySelector("#loyaltyNextReward").textContent =
    remaining > 0
      ? `${remaining} pts until ${nextTier}`
      : "VIP reward unlocked";

  document.querySelector("#loyaltyProgressBar").style.width = `${progress}%`;
}

const NOTIFICATIONS_KEY = "shoffeeko_notifications";

function getNotifications() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

function seedCustomerNotifications(customer) {
  const notifications = getNotifications();
  const customerEmail = customer.email?.toLowerCase();

  const hasCustomerNotifications = notifications.some(item => {
    return item.customerEmail?.toLowerCase() === customerEmail;
  });

  if (hasCustomerNotifications) return;

  const customerOrders = getOrders().filter(order => {
    const email = order.customerEmail || order.email || order.customer?.email;
    return email?.toLowerCase() === customerEmail;
  });

  const newNotifications = customerOrders.slice(0, 3).map(order => ({
    id: `NOTIF-${Date.now()}-${order.id}`,
    customerEmail: customer.email,
    title: `Order ${order.orderStatus || order.status || "Created"}`,
    message: `Order ${order.id} is currently ${order.orderStatus || order.status || "Pending"}.`,
    createdAt: order.createdAt || new Date().toISOString(),
    read: false
  }));

  if (newNotifications.length) {
    saveNotifications([...newNotifications, ...notifications]);
  }
}

function renderCustomerNotifications(customer) {
  seedCustomerNotifications(customer);

  const list = document.querySelector("#customerNotificationsList");
  if (!list) return;

  const customerEmail = customer.email?.toLowerCase();

  const notifications = getNotifications()
    .filter(item => item.customerEmail?.toLowerCase() === customerEmail)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (!notifications.length) {
    list.innerHTML = `
      <div class="account-empty-state">
        <span>🔔</span>
        <h3>No notifications yet</h3>
        <p>
          Updates about your orders, shipping,
          payments and promotions will appear here.
        </p>
      </div>
    `;
    return;
  }

  list.innerHTML = notifications.map(item => `
    <div class="notification-row ${item.read ? "" : "unread"}">
      <span>${item.read ? "✓" : "🔔"}</span>

      <div>
        <strong>${item.title}</strong>
        <p>${item.message}</p>
      </div>
    </div>
  `).join("");
}

function bindNotifications(customer) {
  const btn = document.querySelector("#markNotificationsReadBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const customerEmail = customer.email?.toLowerCase();

    const updatedNotifications = getNotifications().map(item => {
      if (item.customerEmail?.toLowerCase() === customerEmail) {
        return {
          ...item,
          read: true
        };
      }

      return item;
    });

    saveNotifications(updatedNotifications);
    renderCustomerNotifications(customer);
  });
}
function renderRecentOrders(customer) {
  const list = document.querySelector("#recentOrdersList");
  if (!list) return;

  const orders = getOrders()
    .filter(order => {
      const email =
        order.customerEmail ||
        order.email ||
        order.customer?.email;

      return email?.toLowerCase() === customer.email?.toLowerCase();
    })
    .sort((a, b) => {
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    })
    .slice(0, 3);

  if (!orders.length) {
    list.innerHTML = `
      <p class="account-empty">No orders yet.</p>
    `;
    return;
  }

  list.innerHTML = orders.map(order => `
    <a href="order-tracking.html?id=${order.id}" class="recent-order-row">
      <span>
        <strong>${order.id}</strong>
        <small>${order.orderStatus || order.status || "Pending"}</small>
      </span>

      <strong>${formatCurrency(order.total || order.subtotal || 0)}</strong>
    </a>
  `).join("");
}

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem("shoffeeko_wishlist")) || [];
  } catch {
    return [];
  }
}

function getAddresses() {
  try {
    return JSON.parse(localStorage.getItem("shoffeeko_addresses")) || [];
  } catch {
    return [];
  }
}

function renderAccountStats(customer) {
  const customerEmail = customer.email?.toLowerCase();

  const customerOrders = getOrders().filter(order => {
    const email =
      order.customerEmail ||
      order.email ||
      order.customer?.email;

    return email?.toLowerCase() === customerEmail;
  });

  const totalSpent = customerOrders.reduce((sum, order) => {
    return sum + Number(order.total || order.subtotal || 0);
  }, 0);

  const wishlistItems = getWishlist().filter(item => {
    return !item.customerEmail ||
      item.customerEmail?.toLowerCase() === customerEmail;
  });

  const savedAddresses = getAddresses().filter(address => {
    return address.customerEmail?.toLowerCase() === customerEmail;
  });

  document.querySelector("#accountTotalOrders").textContent = customerOrders.length;
  document.querySelector("#accountTotalSpent").textContent = formatCurrency(totalSpent);
  document.querySelector("#accountWishlistItems").textContent = wishlistItems.length;
  document.querySelector("#accountSavedAddresses").textContent = savedAddresses.length;
}
    bindEditProfile();
    renderRecentOrders(customer);
    renderAccountStats(customer);
    bindNotifications(customer);
    renderCustomerNotifications(customer);
    renderLoyaltyRewards(customer);

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem(sessionKey);
    window.location.href = "cust_login.html";
  });
}