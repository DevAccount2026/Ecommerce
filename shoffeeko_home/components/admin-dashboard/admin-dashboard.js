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

 const orders = getSavedOrders();

const totalOrders = orders.length;

const revenue = orders.reduce((sum, order) => {
  return sum + Number(order.total || order.subtotal || 0);
}, 0);

const customers = new Set(
  orders
    .map(order => order.customerEmail || order.email)
    .filter(Boolean)
).size;

const pendingOrders = orders.filter(order => {
  return (order.orderStatus || order.status) === "Pending";
}).length;

const cards = [
  {
    label: "Total Orders",
    value: totalOrders,
    note: "All saved orders"
  },
  {
    label: "Revenue",
    value: formatCurrency(revenue),
    note: "Total order revenue"
  },
  {
    label: "Customers",
    value: customers,
    note: "Unique customer emails"
  },
  {
    label: "Pending Orders",
    value: pendingOrders,
    note: "Orders awaiting action"
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

function renderRecentOrders() {
  const tableBody = document.querySelector("#recentOrdersTable");
  if (!tableBody) return;

  const orders = getSavedOrders();

  if (!orders.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">No recent orders found.</td>
      </tr>
    `;
    return;
  }

  const latestOrders = [...orders]
    .sort((a, b) => {
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    })
    .slice(0, 5);

  tableBody.innerHTML = latestOrders.map(order => {
    const orderId = order.id || order.orderNumber || "No ID";
    const orderDate = order.createdAt || order.date || new Date().toISOString();

    const customer =
      order.customerName ||
      order.customer?.name ||
      `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() ||
      (typeof order.customer === "string" ? order.customer : "") ||
      "Guest Customer";

    const total =
      order.total ||
      order.subtotal ||
      order.totalAmount ||
      order.grandTotal ||
      0;

    const status =
      order.orderStatus ||
      order.status ||
      "Pending";

    return `
      <tr>
        <td class="admin-order-id">${orderId}</td>
        <td>${formatDate(orderDate)}</td>
        <td>${customer}</td>
        <td>${formatCurrency(total)}</td>
        <td>
          <span class="admin-status admin-status--${getStatusClass(status)}">
            ${status}
          </span>
        </td>
        <td>
          <button
            class="admin-table-btn"
            onclick="window.location.href='admin-order-detail.html?id=${orderId}'"
          >
            View
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderLowStockAlerts(items) {
  const tableBody = document.querySelector("#lowStockTable");
  if (!tableBody || !Array.isArray(items)) return;

  tableBody.innerHTML = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td class="admin-order-id">${item.sku}</td>
      <td>${item.stock}</td>
      <td>
        <span class="admin-status admin-status--${getStatusClass(item.status)}">
          ${item.status}
        </span>
      </td>
      <td>
        <button class="admin-table-btn">Add Stock</button>
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
  renderSalesPerformanceChart(data?.salesPerformance);
  renderTopCategoriesChart(data?.topProductCategories);
  renderOrderStatusChart(data?.orderStatusDistribution);
  renderLowStockAlerts(data?.lowStockAlerts);

  renderRecentOrders();
  renderTopProducts();
}

//--------------//

function renderSalesPerformanceChart(items) {
  const canvas = document.querySelector("#salesPerformanceChart");

  if (!canvas || !Array.isArray(items) || typeof Chart === "undefined") return;

  const labels = items.map(item => item.date);
  const revenueData = items.map(item => item.revenue);
  const ordersData = items.map(item => item.orders);

  new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: revenueData,
          yAxisID: "revenueAxis",
          borderColor: "#5ee0b5",
          backgroundColor: "rgba(94, 224, 181, 0.12)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: "Orders",
          data: ordersData,
          yAxisID: "ordersAxis",
          borderColor: "#3fb7d9",
          backgroundColor: "rgba(63, 183, 217, 0.08)",
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false
      },

      plugins: {
        legend: {
          labels: {
            color: "#f5efe6"
          }
        },
        tooltip: {
          backgroundColor: "#f5efe6",
          titleColor: "#07111f",
          bodyColor: "#07111f"
        }
      },

      scales: {
        x: {
          ticks: {
            color: "#cfc7b9"
          },
          grid: {
            color: "rgba(255,255,255,0.06)"
          }
        },

        revenueAxis: {
          type: "linear",
          position: "left",
          ticks: {
            color: "#5ee0b5"
          },
          grid: {
            color: "rgba(255,255,255,0.06)"
          }
        },

        ordersAxis: {
          type: "linear",
          position: "right",
          ticks: {
            color: "#3fb7d9"
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

function renderOrderStatusChart(items) {
  const canvas = document.querySelector("#orderStatusChart");

  if (!canvas || !Array.isArray(items) || typeof Chart === "undefined") return;

  const labels = items.map(item => item.status);
  const values = items.map(item => item.count);

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#5ee0b5",
            "#3fb7d9",
            "#f1c76b",
            "#ff6b6b"
          ],
          borderColor: "#132238",
          borderWidth: 4,
          hoverOffset: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#f5efe6",
            padding: 16,
            usePointStyle: true,
            pointStyle: "circle"
          }
        },
        tooltip: {
          backgroundColor: "#f5efe6",
          titleColor: "#07111f",
          bodyColor: "#07111f"
        }
      }
    }
  });
}

function renderTopCategoriesChart(items) {
  const canvas = document.querySelector("#topCategoriesChart");

  if (!canvas || !Array.isArray(items) || typeof Chart === "undefined") return;

  const labels = items.map(item => item.category);
  const values = items.map(item => item.count);

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#5ee0b5",
            "#3fb7d9",
            "#c9a46b",
            "#f1c76b",
            "#8aa4c8"
          ],
          borderColor: "#132238",
          borderWidth: 4,
          hoverOffset: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#f5efe6",
            padding: 14,
            usePointStyle: true,
            pointStyle: "circle"
          }
        },
        tooltip: {
          backgroundColor: "#f5efe6",
          titleColor: "#07111f",
          bodyColor: "#07111f"
        }
      }
    }
  });
}


function getSavedOrders() {
  try {
    return JSON.parse(localStorage.getItem("shoffeeko_orders")) || [];
  } catch (error) {
    console.error("Saved orders are broken:", error);
    return [];
  }
}

//--------Top Products Category Widgets-------------//

function renderTopProducts() {
  const tableBody = document.querySelector("#topProductsTable");
  if (!tableBody) return;

  const orders = getSavedOrders();
  const productMap = new Map();

  orders.forEach(order => {
    if (!Array.isArray(order.items)) return;

    order.items.forEach(item => {
      const name = item.title || item.name || "Unnamed Product";
      const quantity = Number(item.quantity || 1);

      productMap.set(name, (productMap.get(name) || 0) + quantity);
    });
  });

  const topProducts = [...productMap.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  if (!topProducts.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="2">No product sales yet.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = topProducts.map((product, index) => `
    <tr>
      <td>${index + 1}. ${product.name}</td>
      <td>${product.quantity} sold</td>
    </tr>
  `).join("");
}



document.addEventListener("DOMContentLoaded", initAdminDashboard);