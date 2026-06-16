const ORDERS_KEY = "shoffeeko_orders";
const ADDRESSES_KEY = "shoffeeko_addresses";

let allCustomers = [];

function getSavedOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch (error) {
    console.error("Orders data is broken:", error);
    return [];
  }
}

function getSavedAddresses() {
  try {
    return JSON.parse(localStorage.getItem(ADDRESSES_KEY)) || [];
  } catch (error) {
    console.error("Addresses data is broken:", error);
    return [];
  }
}

function formatCurrency(amount) {
  return `₱${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getOrderTotal(order) {
  return Number(
    order.total ||
    order.subtotal ||
    order.totalAmount ||
    order.amount ||
    0
  );
}

function getCustomerEmail(order) {
  return (
    order.customerEmail ||
    order.email ||
    order.customer?.email ||
    "unknown@email.com"
  ).toLowerCase();
}

function getCustomerName(order, address) {
  const fromOrder =
    order.customerName ||
    order.name ||
    order.customer?.name;

  if (fromOrder) return fromOrder;

  if (address) {
    return `${address.firstName || ""} ${address.lastName || ""}`.trim();
  }

  return "Guest Customer";
}

function getOrderDate(order) {
  return order.createdAt || order.date || order.orderDate || null;
}

function buildCustomers() {
  const orders = getSavedOrders();
  const addresses = getSavedAddresses();
  const customers = {};

  orders.forEach(order => {
    const email = getCustomerEmail(order);
    const address = addresses.find(item =>
      String(item.customerEmail || item.email || "").toLowerCase() === email
    );

    if (!customers[email]) {
      customers[email] = {
        name: getCustomerName(order, address),
        email,
        orders: 0,
        totalSpend: 0,
        lastOrder: null,
        isReturning: false
      };
    }

    customers[email].orders += 1;
    customers[email].totalSpend += getOrderTotal(order);

    const orderDate = getOrderDate(order);

    if (
      orderDate &&
      (!customers[email].lastOrder ||
        new Date(orderDate) > new Date(customers[email].lastOrder))
    ) {
      customers[email].lastOrder = orderDate;
    }

    customers[email].isReturning = customers[email].orders > 1;
  });

  return Object.values(customers).sort((a, b) => {
    return new Date(b.lastOrder || 0) - new Date(a.lastOrder || 0);
  });
}

function renderCustomerStats(customers) {
  const totalCustomers = customers.length;
  const returningCustomers = customers.filter(customer => customer.orders > 1).length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const newThisMonth = customers.filter(customer => {
    if (!customer.lastOrder) return false;

    const date = new Date(customer.lastOrder);

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  }).length;

  const totalSpend = customers.reduce((sum, customer) => {
    return sum + customer.totalSpend;
  }, 0);

  const averageSpend = totalCustomers ? totalSpend / totalCustomers : 0;

  document.querySelector("#customersTotal").textContent = totalCustomers;
  document.querySelector("#customersNewThisMonth").textContent = newThisMonth;
  document.querySelector("#customersReturning").textContent = returningCustomers;
  document.querySelector("#customersAverageSpend").textContent = formatCurrency(averageSpend);
}

function renderCustomersTable(customers) {
  const tableBody = document.querySelector("#customersTableBody");
  const countLabel = document.querySelector("#customersCountLabel");

  if (!tableBody || !countLabel) return;

  countLabel.textContent = `${customers.length} customer${customers.length === 1 ? "" : "s"}`;

  if (!customers.length) {
    tableBody.innerHTML = `
      <div class="customers-empty">
        No customers found yet.
      </div>
    `;
    return;
  }

  tableBody.innerHTML = customers.map(customer => `
    <div class="customers-row">
      <div class="customer-name">${customer.name}</div>
      <div class="customer-email">${customer.email}</div>
      <div class="customer-orders">${customer.orders}</div>
      <div class="customer-spend">${formatCurrency(customer.totalSpend)}</div>
      <div class="customer-date">${formatDate(customer.lastOrder)}</div>
      <div>
        <button
          class="customer-view-btn"
          data-email="${customer.email}">
          View
        </button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".customer-view-btn").forEach(button => {
    button.addEventListener("click", () => {
      const email = button.dataset.email;
      window.location.href = `admin-customer-detail.html?email=${encodeURIComponent(email)}`;
    });
  });
}

function applyCustomerFilters() {
  const searchInput = document.querySelector("#customerSearch");
  const topSearchInput = document.querySelector("#customerTopSearch");
  const filterInput = document.querySelector("#customerFilter");

  const searchTerm = (
    searchInput?.value ||
    topSearchInput?.value ||
    ""
  ).toLowerCase();

  const filterValue = filterInput?.value || "all";

  let filtered = [...allCustomers];

  if (searchTerm) {
    filtered = filtered.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm)
    );
  }

  if (filterValue === "returning") {
    filtered = filtered.filter(customer => customer.orders > 1);
  }

  if (filterValue === "new") {
    filtered = filtered.filter(customer => customer.orders === 1);
  }

  renderCustomersTable(filtered);
}

function bindCustomerEvents() {
  const searchInput = document.querySelector("#customerSearch");
  const topSearchInput = document.querySelector("#customerTopSearch");
  const filterInput = document.querySelector("#customerFilter");

  searchInput?.addEventListener("input", applyCustomerFilters);
  topSearchInput?.addEventListener("input", event => {
    if (searchInput) searchInput.value = event.target.value;
    applyCustomerFilters();
  });

  filterInput?.addEventListener("change", applyCustomerFilters);
}

function initCustomersPage() {
  const page = document.querySelector("#adminCustomersPage");
  if (!page) return;

  allCustomers = buildCustomers();

  renderCustomerStats(allCustomers);
  renderCustomersTable(allCustomers);
  bindCustomerEvents();
}

document.addEventListener("DOMContentLoaded", initCustomersPage);