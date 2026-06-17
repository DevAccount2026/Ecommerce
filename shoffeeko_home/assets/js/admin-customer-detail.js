const ORDERS_KEY = "shoffeeko_orders";
const ADDRESSES_KEY = "shoffeeko_addresses";

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

function getCustomerEmailFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("email");
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

function getOrderDate(order) {
  return order.createdAt || order.date || order.orderDate || null;
}

function getOrderId(order) {
  return order.id || order.orderId || order.orderNumber || "—";
}

function getOrderStatus(order) {
  return order.orderStatus || order.status || "Pending";
}

function getOrderItems(order) {
  return order.items || order.cart || order.products || [];
}

function getItemsCount(order) {
  return getOrderItems(order).reduce((sum, item) => {
    return sum + Number(item.quantity || item.qty || 1);
  }, 0);
}

function getCustomerEmail(order) {
  return (
    order.customerEmail ||
    order.email ||
    order.customer?.email ||
    ""
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

function getCustomerOrders(email, orders) {
  return orders
    .filter(order => getCustomerEmail(order) === email.toLowerCase())
    .sort((a, b) => {
      return new Date(getOrderDate(b) || 0) - new Date(getOrderDate(a) || 0);
    });
}

function getCustomerAddress(email, addresses) {
  return addresses.find(address => {
    const addressEmail = String(
      address.customerEmail ||
      address.email ||
      ""
    ).toLowerCase();

    return addressEmail === email.toLowerCase();
  });
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value || "—";
}

function renderMissingCustomer() {
  setText("#customerDetailName", "Customer not found");
  setText("#customerDetailEmail", "No matching customer record.");

  const body = document.querySelector("#customerOrdersBody");

  if (body) {
    body.innerHTML = `
      <div class="customer-empty">
        No customer data found.
      </div>
    `;
  }
}

function renderCustomerHeader(customerName, email) {
  setText("#customerDetailName", customerName);
  setText("#customerDetailEmail", email);
}

function renderCustomerStats(customerOrders) {
  const totalOrders = customerOrders.length;

  const totalSpend = customerOrders.reduce((sum, order) => {
    return sum + getOrderTotal(order);
  }, 0);

  const aov = totalOrders ? totalSpend / totalOrders : 0;

  const lastOrderDate = customerOrders[0]
    ? getOrderDate(customerOrders[0])
    : null;

  setText("#customerTotalOrders", totalOrders);
  setText("#customerTotalSpend", formatCurrency(totalSpend));
  setText("#customerAOV", formatCurrency(aov));
  setText("#customerLastOrder", formatDate(lastOrderDate));
}

function renderProfileDetails(customerName, email, address) {
  setText("#profileName", customerName);
  setText("#profileEmail", email);
  setText("#profilePhone", address?.phone || "—");

  setText("#profileAddress", address?.address || "—");
  setText("#profileCity", address?.city || "—");
  setText("#profilePostal", address?.postalCode || "—");
  setText("#profileCountry", address?.country || "—");
}

function renderOrderHistory(customerOrders) {
  const body = document.querySelector("#customerOrdersBody");
  const count = document.querySelector("#customerOrdersCount");

  if (!body || !count) return;

  count.textContent = `${customerOrders.length} order${customerOrders.length === 1 ? "" : "s"}`;

  if (!customerOrders.length) {
    body.innerHTML = `
      <div class="customer-empty">
        No orders found for this customer.
      </div>
    `;
    return;
  }

  body.innerHTML = customerOrders.map(order => {
    const orderId = getOrderId(order);

    return `
      <div class="customer-order-row">
        <div class="customer-order-id">${orderId}</div>
        <div>${formatDate(getOrderDate(order))}</div>
        <div>${getItemsCount(order)}</div>
        <div class="customer-order-total">${formatCurrency(getOrderTotal(order))}</div>
        <div class="customer-order-status">${getOrderStatus(order)}</div>
        <div>
          <a
            href="admin-order-detail.html?id=${encodeURIComponent(orderId)}"
            class="customer-order-view">
            View
          </a>
        </div>
      </div>
    `;
  }).join("");
}

function initCustomerDetailPage() {
  const page = document.querySelector("#adminCustomerDetailPage");
  if (!page) return;

  const email = getCustomerEmailFromUrl();

  if (!email) {
    renderMissingCustomer();
    return;
  }

  const orders = getSavedOrders();
  const addresses = getSavedAddresses();

  const customerOrders = getCustomerOrders(email, orders);
  const address = getCustomerAddress(email, addresses);

  if (!customerOrders.length && !address) {
    renderMissingCustomer();
    return;
  }

  const customerName = getCustomerName(customerOrders[0] || {}, address) || "Guest Customer";

  renderCustomerHeader(customerName, email);
  renderCustomerStats(customerOrders);
  renderProfileDetails(customerName, email, address);
  renderOrderHistory(customerOrders);
}

document.addEventListener("DOMContentLoaded", initCustomerDetailPage);