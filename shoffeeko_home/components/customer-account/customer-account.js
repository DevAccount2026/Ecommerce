document.addEventListener("DOMContentLoaded", initCustomerAccount);

const ORDERS_KEY = "shoffeeko_orders";
const WISHLIST_KEY = "shoffeeko_wishlist";

async function initCustomerAccount() {
  const root = document.getElementById("customerAccountPage");
  if (!root) return;
 
  
  const response = await fetch("../components/customer-account/customer-account.json");
  const data = await response.json();
  const settings = data.settings || {};

  const sessionKey = settings.sessionStorageKey || "shoffeeko_current_customer";
  const customer = JSON.parse(localStorage.getItem(sessionKey));

  function bindCommunicationPreferences(customer) {
  const marketingOptIn = document.querySelector("#marketingOptIn");
  if (!marketingOptIn) return;

  marketingOptIn.checked = Boolean(customer.marketingOptIn);

  marketingOptIn.addEventListener("change", () => {
    const updatedCustomer = {
      ...customer,
      marketingOptIn: marketingOptIn.checked,
      updatedAt: new Date().toISOString()
    };

    const updatedCustomers = getCustomers().map(item => {
      return item.id === customer.id ? updatedCustomer : item;
    });

    saveCustomers(updatedCustomers);
    saveSession(updatedCustomer);
    renderCustomerDashboardMetrics(customer);

    alert(
      marketingOptIn.checked
        ? "You are now subscribed to promos and updates."
        : "You have unsubscribed from promos and updates."
      );
    });
  }


function bindChangePassword() {
  const openBtn = document.querySelector("#openChangePasswordBtn");
  const closeBtn = document.querySelector("#closeChangePasswordBtn");
  const cancelBtn = document.querySelector("#cancelChangePasswordBtn");
  const modal = document.querySelector("#changePasswordModal");
  const form = document.querySelector("#changePasswordForm");

  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
    form.reset();
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  });

  closeBtn?.addEventListener("click", closeChangePasswordModal);
  cancelBtn?.addEventListener("click", closeChangePasswordModal);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeChangePasswordModal();
    }
  });

  form.addEventListener("submit", handleChangePassword);
}

function closeChangePasswordModal() {
  const modal = document.querySelector("#changePasswordModal");
  modal?.classList.remove("active");
  modal?.setAttribute("aria-hidden", "true");
}

function handleChangePassword(event) {
  event.preventDefault();

  const currentCustomer = getCurrentCustomer();
  if (!currentCustomer) return;

  const currentPassword = document.querySelector("#currentPassword").value.trim();
  const newPassword = document.querySelector("#newPassword").value.trim();
  const confirmNewPassword = document.querySelector("#confirmNewPassword").value.trim();

  if (currentPassword !== currentCustomer.password) {
    alert("Current password is incorrect.");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    alert("New passwords do not match.");
    return;
  }

  if (newPassword.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  const updatedCustomer = {
    ...currentCustomer,
    password: newPassword,
    updatedAt: new Date().toISOString()
  };

  const updatedCustomers = getCustomers().map(customer => {
    return customer.id === currentCustomer.id ? updatedCustomer : customer;
  });

  saveCustomers(updatedCustomers);
  saveSession(updatedCustomer);

  closeChangePasswordModal();
  alert("Password updated successfully.");
}


  if (!customer) {
    window.location.href = "cust_login.html";
    return;
  }

  root.innerHTML = `
    <section class="customer-account-section sk-container">

      <h1>${settings.title}</h1>

      <div class="account-tabs">
        
          <button class="account-tab active" data-tab="overview">Overview</button>      
          <button class="account-tab" data-tab="orders">Orders</button>
          <button class="account-tab" data-tab="rewards">Rewards</button>
          <button class="account-tab" data-tab="notifications">Notifications</button>
          <button class="account-tab" data-tab="settings">Settings</button>

      </div>

      <div class="account-layout">

       <div class="account-tab-panel active" data-panel="overview">
         
       <div class="customer-metrics-grid" id="customerDashboardMetrics"></div>

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

            <a href="support.html" class="account-btn">
              Support Center
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

        </div>

        
        <div class="account-tab-panel" data-panel="rewards">
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
          
        </div>
        
          <div class="account-tab-panel" data-panel="notifications">
              <div class="account-card account-notifications">
                  <div class="account-card-header">
                    <h2>Notifications</h2>
                    <button type="button" id="markNotificationsReadBtn">Mark all as read</button>
                  </div>
              <div id="customerNotificationsList"></div>
          </div>
        </div>
        
        <div class="account-tab-panel" data-panel="settings">
         <div class="account-card account-settings-card">
          <h2>Account Settings</h2>

          <div class="settings-option-row">
            <div>
              <strong>Profile Information</strong>
              <p>Edit your name, email, and account details.</p>
            </div>

            <button type="button" id="openEditProfileBtn" class="account-btn">
              Edit Profile
            </button>
          </div>

          <div class="settings-option-row">
            <div>
              <strong>Security</strong>
              <p>Change your account password.</p>
            </div>

            <button type="button" id="openChangePasswordBtn" class="account-btn">
              Change Password
            </button>
          </div>

          <div class="settings-option-row">
            <div>
              <strong>Communication Preferences</strong>
              <p>Choose if you want to receive promos and updates.</p>
            </div>

            <label class="account-switch">
              <input type="checkbox" id="marketingOptIn">
              <span></span>
            </label>
          </div>

          <div class="settings-option-row">
            <div>
              <strong>Logout</strong>
              <p>Sign out from this customer account.</p>
            </div>

            <button type="button" id="settingsLogoutBtn" class="account-btn account-btn-outline">
              Logout
            </button>
          </div>
        </div>

      </div>

      <div class="account-tab-panel" data-panel="orders">
          <div class="account-card account-recent-orders">
            <div class="account-card-header">
              <h2>Recent Orders</h2>
              <a href="order-history.html">View All</a>
            </div>

          <div id="recentOrdersList"></div>
      </div>

       </div>
      </div>

    </section>
   
    <div class="account-modal" id="editProfileModal" aria-hidden="true">
        <div class="account-modal__box">

          <div class="account-modal__header">
            <h2>Edit Profile</h2>     
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

      <div class="account-modal" id="changePasswordModal" aria-hidden="true">
       <div class="account-modal__box">

          <div class="account-modal__header">
            <h2>Change Password</h2>
            <button type="button" id="closeChangePasswordBtn">×</button>
          </div>

          <form id="changePasswordForm" class="account-edit-form">

            <label>
              Current Password
              <input type="password" id="currentPassword" required />
            </label>

            <label>
              New Password
              <input type="password" id="newPassword" required minlength="6" />
            </label>

            <label>
              Confirm New Password
              <input type="password" id="confirmNewPassword" required minlength="6" />
            </label>

            <div class="account-edit-actions">
              <button type="button" id="cancelChangePasswordBtn">Cancel</button>
              <button type="submit">Save Password</button>
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

  const points = getCustomerPoints(totalSpent);
  const tier = getCustomerTier(totalSpent);
  const nextTierInfo = getNextTierInfo(totalSpent);

  const previousGoal =
    tier === "Silver" ? 10000 :
    tier === "Gold" ? 50000 :
    0;

  const nextGoal = totalSpent + nextTierInfo.remaining;

  const progress =
    nextTierInfo.remaining === 0
      ? 100
      : ((points - previousGoal) / (nextGoal - previousGoal)) * 100;

  document.querySelector("#loyaltyPoints").textContent = `${points.toLocaleString()} pts`;
  document.querySelector("#loyaltyTier").textContent = tier;
  document.querySelector("#loyaltyTierLabel").textContent = tier;
  document.querySelector("#loyaltyNextReward").textContent =
    nextTierInfo.remaining > 0
      ? `${nextTierInfo.remaining.toLocaleString()} pts until ${nextTierInfo.nextTier}`
      : `${tier} unlocked`;

  document.querySelector("#loyaltyProgressBar").style.width =
    `${Math.min(Math.max(progress, 0), 100)}%`;
}

function bindAccountTabs() {
  const tabs = document.querySelectorAll(".account-tab");
  const panels = document.querySelectorAll(".account-tab-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      tabs.forEach(item => item.classList.remove("active"));
      panels.forEach(panel => panel.classList.remove("active"));

      tab.classList.add("active");

      document
        .querySelector(`[data-panel="${target}"]`)
        ?.classList.add("active");
    });
  });
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
      const existingKeys = new Set(
        notifications.map(item => `${item.orderId}-${item.status}`)
      );

      const uniqueNewNotifications = newNotifications.filter(item => {
        const key = `${item.orderId}-${item.status}`;
        return !existingKeys.has(key);
      });

      if (uniqueNewNotifications.length) {
        saveNotifications([...uniqueNewNotifications, ...notifications]);
      }
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
    <div class="notification-row ${item.read ? "" : "unread"} ${item.status?.toLowerCase() || ""}">
      <span>${item.read ? "✓" : (item.icon || "🔔")}</span>

      <div>
        <strong>${item.title}</strong>
        <p>${item.message}</p>
      </div>
    </div>
  `).join("");
}

function renderCustomerRewards(customer) {
  const panel = document.querySelector("#customerRewardsPanel");
  if (!panel) return;

  const orders = getCustomerOrders(customer);

  const validOrders = orders.filter(order => {
    const status = order.orderStatus || order.status || "";
    return status.toLowerCase() !== "cancelled";
  });

  const totalSpent = validOrders.reduce((sum, order) => {
    return sum + Number(order.total || order.subtotal || 0);
  }, 0);

  const points = Math.floor(totalSpent);
  const voucherCount = Math.floor(points / 1000);
  const discountValue = voucherCount * 50;

  panel.innerHTML = `
    <section class="account-card">
      <h2>Rewards</h2>
      <p>Earn points every time you shop.</p>

      <div class="rewards-summary-grid">
        <div class="reward-card">
          <span>Current Points</span>
          <strong>${points.toLocaleString()}</strong>
        </div>

        <div class="reward-card">
          <span>Available Vouchers</span>
          <strong>${voucherCount}</strong>
        </div>

        <div class="reward-card">
          <span>Discount Value</span>
          <strong>${formatCurrency(discountValue)}</strong>
        </div>
      </div>

      <div class="rewards-rules">
        <h3>How rewards work</h3>
        <p>Earn <strong>1 point</strong> for every ${formatCurrency(1)} spent.</p>
        <p>Every <strong>1,000 points</strong> can be redeemed for ${formatCurrency(50)} off.</p>
      </div>
    </section>
  `;
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

function bindAccountSettings(customer) {

  const editProfileBtn =
    document.querySelector("#settingsEditProfileBtn");

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      document
        .querySelector("#openEditProfileBtn")
        ?.click();
    });
  }

  const logoutBtn =
    document.querySelector("#settingsLogoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(
        "shoffeeko_current_customer"
      );

      window.location.href =
        "cust_login.html";
    });
  }

}

function getCustomerOrders(customer) {
  const email = customer?.email?.toLowerCase();
  if (!email) return [];

  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];

    return orders.filter(order => {
      const orderEmail =
        order.customerEmail ||
        order.email ||
        order.customer?.email ||
        "";

      return orderEmail.toLowerCase() === email;
    });
  } catch (error) {
    console.error("Orders are broken:", error);
    return [];
  }
}

function getWishlistCount(customer) {
  const email = customer?.email?.toLowerCase();
  if (!email) return 0;

  try {
    const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];

    return wishlist.filter(item => {
      const itemEmail =
        item.customerEmail ||
        item.email ||
        item.customer?.email ||
        "";

      return itemEmail.toLowerCase() === email;
    }).length;
  } catch (error) {
    console.error("Wishlist is broken:", error);
    return 0;
  }
}

function calculateRewardPoints(totalSpent) {
  return Math.floor(totalSpent);
}
  
function renderCustomerDashboardMetrics(customer) {
  const container = document.querySelector("#customerDashboardMetrics");
  if (!container) return;

  const orders = getCustomerOrders(customer);

  const totalOrders = orders.length;

  const totalSpent = orders.reduce((sum, order) => {
    return sum + Number(order.total || order.subtotal || 0);
  }, 0);

  const rewardPoints = calculateRewardPoints(totalSpent);
  const wishlistItems = getWishlistCount(customer);

  container.innerHTML = `
    <div class="customer-metric-card">
      <span>Total Orders</span>
      <strong>${totalOrders}</strong>
    </div>

    <div class="customer-metric-card">
      <span>Total Spent</span>
      <strong>${formatCurrency(totalSpent)}</strong>
    </div>

    <div class="customer-metric-card">
      <span>Reward Points</span>
      <strong>${rewardPoints}</strong>
    </div>

    <div class="customer-metric-card">
      <span>Wishlist Items</span>
      <strong>${wishlistItems}</strong>
    </div>
  `;
}

function calculateCustomerRewardData(customer) {
  const orders = getCustomerOrders(customer);

  const completedOrders = orders.filter(order => {
    const status = order.orderStatus || order.status || "";
    return status.toLowerCase() !== "cancelled";
  });

  const totalSpent = completedOrders.reduce((sum, order) => {
    return sum + Number(order.total || order.subtotal || 0);
  }, 0);

  const points = Math.floor(totalSpent);

  const voucherCount = Math.floor(points / 1000);
  const availableDiscount = voucherCount * 50;

  return {
    points,
    voucherCount,
    availableDiscount,
    completedOrders
  };
}

bindEditProfile();
    renderRecentOrders(customer);
    renderAccountStats(customer);
    bindNotifications(customer);
    renderCustomerNotifications(customer);
    renderLoyaltyRewards(customer);
    bindAccountTabs();
    bindAccountSettings(customer);
    bindChangePassword();
    bindCommunicationPreferences(customer);

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem(sessionKey);
    window.location.href = "cust_login.html";
  });
}