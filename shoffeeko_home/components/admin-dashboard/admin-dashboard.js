async function fetchDashboardStats() {
  const root = document.querySelector("#adminDashboard");
  const apiUrl = root?.dataset.api;

  if (!root || !apiUrl) return null;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return null;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(amount);
}

function renderDashboardStats(data) {
  const grid = document.querySelector("#adminStatsGrid");
  if (!grid || !data) return;

  const cards = [
    {
      label: "Revenue Today",
      value: formatCurrency(data.revenueToday),
      note: `${data.revenueChange}% vs yesterday`
    },
    {
      label: "Orders Today",
      value: data.ordersToday,
      note: `${data.ordersChange}% vs yesterday`
    },
    {
      label: "Products",
      value: data.totalProducts,
      note: `${data.activeProducts} active products`
    },
    {
      label: "Customers",
      value: data.customersToday,
      note: `${data.totalCustomers} total customers`
    }
  ];

  grid.innerHTML = cards.map(card => `
    <article class="admin-stat-card">
      <div class="admin-stat-card__label">${card.label}</div>
      <div class="admin-stat-card__value">${card.value}</div>
      <div class="admin-stat-card__note">${card.note}</div>
    </article>
  `).join("");
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getStatusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function renderRecentOrders(orders) {
  const tableBody = document.querySelector("#recentOrdersTable");
  if (!tableBody || !Array.isArray(orders)) return;

  tableBody.innerHTML = orders.map(order => `
    <tr>
      <td class="admin-order-id">${order.id}</td>
      <td>${formatDate(order.date)}</td>
      <td>${order.customer}</td>
      <td>${formatCurrency(order.total)}</td>
      <td>
        <span class="admin-status admin-status--${getStatusClass(order.status)}">
          ${order.status}
        </span>
      </td>
      <td>
        <button class="admin-table-btn">View</button>
      </td>
    </tr>
  `).join("");
}

async function initAdminDashboard() {
  const root = document.querySelector("#adminDashboard");
  if (!root) return;

  const htmlResponse = await fetch("../components/admin-dashboard/admin-dashboard.html");
  root.innerHTML = await htmlResponse.text();

  const data = await fetchDashboardStats();

  renderDashboardStats(data);
  renderRecentOrders(data?.recentOrders);
}

document.addEventListener("DOMContentLoaded", initAdminDashboard);