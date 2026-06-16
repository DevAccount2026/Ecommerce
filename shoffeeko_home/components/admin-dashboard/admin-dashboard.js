
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
 return getOrderDisplayStatus(order) === "Pending";
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

/*function getOrderDisplayStatus(order) {
  return (
    order.deliveryStatus ||
    order.orderStatus ||
    order.status ||
    "Pending"
  );
}*/


/*function getOrderDisplayStatus(order) {
  return (
    order.orderStatus ||
    order.deliveryStatus ||
    order.status ||
    "Pending"
  );
}*/


function getOrderDisplayStatus(order) {
  return (
    order.status ||
    order.orderStatus ||
    order.deliveryStatus ||
    "Pending"
  );
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

   const status = getOrderDisplayStatus(order);

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

const PRODUCTS_KEY = "shoffeeko_products";

async function fetchProducts() {
  try {
    const savedProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];

    if (savedProducts.length) {
      return savedProducts;
    }

   const response = await fetch("../api/admin-products.json");
    if (!response.ok) throw new Error("Failed to fetch products");

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error("Products fetch error:", error);
    return [];
  }
}

function renderLowStockAlerts(products) {
  const tableBody = document.querySelector("#lowStockTable");
  if (!tableBody || !Array.isArray(products)) return;

  const lowStockProducts = products.filter(product => {
    return Number(product.stock || 0) <= 5;
  });

  if (!lowStockProducts.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">No low stock products found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = lowStockProducts.map(product => {
    const stock = Number(product.stock || 0);
    const status = stock === 0 ? "Out of Stock" : "Low Stock";

    return `
      <tr>
        <td>${product.name || product.title || "Unnamed Product"}</td>
        <td class="admin-order-id">${product.sku || product.id || "No SKU"}</td>
        <td>${stock}</td>
        <td>
          <span class="admin-status admin-status--${getStatusClass(status)}">
            ${status}
          </span>
        </td>
        <td>
          <button class="admin-table-btn">Add Stock</button>
        </td>
      </tr>
    `;
  }).join("");
}


async function initAdminDashboard() {
  const root = document.querySelector("#adminDashboard");
  if (!root) return;

  const htmlResponse = await fetch("../components/admin-dashboard/admin-dashboard.html");
  root.innerHTML = await htmlResponse.text();

  const data = await fetchDashboardStats();

  renderDashboardStats(data);
  renderSalesPerformanceChart(data?.salesPerformance);


  renderTopCategoriesChart(await getTopCategoryData());

  renderOrderStatusChart(getOrderStatusData());
  
  const products = await fetchProducts();
  renderLowStockAlerts(products);

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

function getOrderStatusData() {
  const orders = getSavedOrders();
  const statusMap = new Map();

  orders.forEach(order => {
       const status = getOrderDisplayStatus(order);
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  return [...statusMap.entries()].map(([status, count]) => ({
    status,
    count
  }));
}

function renderOrderStatusChart(items) {
  const canvas = document.querySelector("#orderStatusChart");

  if (!canvas || !Array.isArray(items) || typeof Chart === "undefined") return;

  const labels = items.map(item => item.status);
  const values = items.map(item => item.count);
  const total = values.reduce((sum, value) => sum + value, 0);

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
            "#ff6b6b",
            "#8aa4c8"
          ],
          borderColor: "#132238",
          borderWidth: 4,
          hoverOffset: 8
        }
      ]
    },
    plugins: typeof ChartDataLabels !== "undefined" ? [ChartDataLabels] : [],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",

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

       datalabels: {
        display: (context) => {
          return context.chart.data.labels.length > 1;
        },

        color: "#f5efe6",

        font: {
          weight: "700",
          size: 12
        },

        anchor: "end",
        align: "end",
        offset: 18,

        formatter: (value, context) => {
          const label = context.chart.data.labels[context.dataIndex];

          const percent = total
            ? Math.round((value / total) * 100)
            : 0;

          return `${label}\n${value} Orders (${percent}%)`;
        }
      },
        tooltip: {
          backgroundColor: "#f5efe6",
          titleColor: "#07111f",
          bodyColor: "#07111f",
          callbacks: {
            label: context => {
              const value = context.raw;
              const percent = total ? Math.round((value / total) * 100) : 0;
              return `${context.label}: ${value} orders (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

async function getTopCategoryData() {
  const orders = getSavedOrders();
  const products = await fetchProducts();

  const productMap = new Map();

  products.forEach(product => {
    const keys = [
      product.id,
      product.productId,
      product.sku,
      product.name,
      product.title
    ].filter(Boolean);

    keys.forEach(key => {
      productMap.set(String(key).toLowerCase(), product);
    });
  });

  const categoryMap = new Map();

  const categoryAliases = {
  "arabica coffee": "Arabica",
  "haraaz red mocha": "Flavored Coffee",
  "hazelnut coffee": "Flavored Coffee",
  "red mocha": "Flavored Coffee",
  "tiramisu": "Flavored Coffee",
  "caramel roast": "Espresso",
  "pine and juniper": "Arabica"
};

  orders.forEach(order => {
    if (!Array.isArray(order.items)) return;

    order.items.forEach(item => {
      const lookupKey = String(
        item.id ||
        item.productId ||
        item.sku ||
        item.name ||
        item.title ||
        ""
      ).toLowerCase();

      const matchedProduct = productMap.get(lookupKey);

     const itemName = String(item.name || item.title || "").toLowerCase();

      // TEMPORARY:
      
      const category =
        item.category ||
        item.productCategory ||
        matchedProduct?.category ||
        matchedProduct?.productCategory ||
        categoryAliases[itemName] ||
        "Uncategorized";
      // Used to map old order data that does not contain category.
      // Remove after migrating to database-backed orders.



      const quantity = Number(item.quantity || 1);

      categoryMap.set(category, (categoryMap.get(category) || 0) + quantity);
    });
  });

  return [...categoryMap.entries()].map(([category, count]) => ({
    category,
    count
  }));
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

//--------Top Products Widgets-------------//

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