const ORDERS_KEY = "shoffeeko_orders";

let analyticsCharts = [];

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch (error) {
    console.error("Orders data is broken:", error);
    return [];
  }
}

function formatCurrency(amount) {
  return `₱${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
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
  return new Date(order.createdAt || order.date || Date.now());
}

function getCustomerEmail(order) {
  return (
    order.customerEmail ||
    order.email ||
    order.customer?.email ||
    "unknown"
  ).toLowerCase();
}

function getOrderItems(order) {
  return order.items || order.cart || order.products || [];
}

function getItemName(item) {
  return item.title || item.name || item.productName || "Unknown Product";
}

function getItemCategory(item) {
  return item.category || item.collection || "Uncategorized";
}

function getItemQuantity(item) {
  return Number(item.quantity || item.qty || 1);
}

function getItemPrice(item) {
  return Number(item.price || item.unitPrice || 0);
}

function getItemRevenue(item) {
  return getItemQuantity(item) * getItemPrice(item);
}

function clearOldCharts() {
  analyticsCharts.forEach(chart => chart.destroy());
  analyticsCharts = [];
}

function makeChart(canvasId, config) {
  const canvas = document.querySelector(`#${canvasId}`);

  if (!canvas || typeof Chart === "undefined") return;

  const chart = new Chart(canvas, config);
  analyticsCharts.push(chart);
}

function getChartOptions(extraOptions = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#d7e6f6",
          boxWidth: 12,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: "#0a1422",
        titleColor: "#ffffff",
        bodyColor: "#d7e6f6",
        borderColor: "rgba(77, 214, 201, 0.35)",
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: "#aebdca",
          font: {
            size: 10
          }
        },
        grid: {
          color: "rgba(255,255,255,0.06)"
        }
      },
      y: {
        ticks: {
          color: "#aebdca",
          font: {
            size: 10
          }
        },
        grid: {
          color: "rgba(255,255,255,0.06)"
        }
      }
    },
    ...extraOptions
  };
}

function getLast30DaysRevenueAndOrders(orders) {
  const result = {};

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const key = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });

    result[key] = {
      revenue: 0,
      orders: 0
    };
  }

  orders.forEach(order => {
    const orderDate = getOrderDate(order);
    const key = orderDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });

    if (!result[key]) return;

    result[key].revenue += getOrderTotal(order);
    result[key].orders += 1;
  });

  return result;
}

function getProductStats(orders) {
  const products = {};

  orders.forEach(order => {
    getOrderItems(order).forEach(item => {
      const name = getItemName(item);

      if (!products[name]) {
        products[name] = {
          name,
          sold: 0,
          revenue: 0
        };
      }

      products[name].sold += getItemQuantity(item);
      products[name].revenue += getItemRevenue(item);
    });
  });

  return Object.values(products).sort((a, b) => b.sold - a.sold);
}

function getCategoryStats(orders) {
  const categories = {};

  orders.forEach(order => {
    getOrderItems(order).forEach(item => {
      const category = getItemCategory(item);
      categories[category] = (categories[category] || 0) + getItemQuantity(item);
    });
  });

  return categories;
}

function getCustomerStats(orders) {
  const customerOrders = {};

  orders.forEach(order => {
    const email = getCustomerEmail(order);

    if (!customerOrders[email]) {
      customerOrders[email] = 0;
    }

    customerOrders[email] += 1;
  });

  const emails = Object.keys(customerOrders);
  const recurring = emails.filter(email => customerOrders[email] > 1).length;
  const fresh = emails.length - recurring;

  return {
    total: emails.length,
    fresh,
    recurring
  };
}

function renderKpis(orders) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const aov = totalOrders ? totalRevenue / totalOrders : 0;
  const customers = getCustomerStats(orders);

  document.querySelector("#analyticsTotalRevenue").textContent = formatCurrency(totalRevenue);
  document.querySelector("#analyticsTotalOrders").textContent = totalOrders;
  document.querySelector("#analyticsAOV").textContent = formatCurrency(aov);
  document.querySelector("#analyticsCustomers").textContent = customers.total;
}

function renderRevenueTrendChart(orders) {
  const grouped = getLast30DaysRevenueAndOrders(orders);
  const labels = Object.keys(grouped);

  makeChart("revenueTrendChart", {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: labels.map(label => grouped[label].revenue),
          borderColor: "#34d6c3",
          backgroundColor: "rgba(52, 214, 195, 0.16)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2
        },
        {
          label: "Orders",
          data: labels.map(label => grouped[label].orders),
          borderColor: "#4ba6df",
          backgroundColor: "rgba(75, 166, 223, 0.12)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2,
          yAxisID: "ordersAxis"
        }
      ]
    },
    options: getChartOptions({
      scales: {
        x: {
          ticks: {
            color: "#aebdca",
            font: { size: 10 }
          },
          grid: {
            color: "rgba(255,255,255,0.06)"
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#aebdca",
            callback: value => formatCurrency(value)
          },
          grid: {
            color: "rgba(255,255,255,0.06)"
          }
        },
        ordersAxis: {
          beginAtZero: true,
          position: "right",
          ticks: {
            color: "#4ba6df",
            precision: 0
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    })
  });
}

function renderTopCategoriesChart(orders) {
  const categories = getCategoryStats(orders);
  const labels = Object.keys(categories);
  const values = Object.values(categories);

  makeChart("topCategoriesChart", {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#31c7bd",
            "#4ba6df",
            "#9bd9d2",
            "#e2a84b",
            "#e66b87"
          ],
          borderColor: "#162537",
          borderWidth: 2
        }
      ]
    },
    options: getChartOptions({
      cutout: "58%",
      scales: {}
    })
  });
}

/*function renderAcquisitionSourceChart() {
  makeChart("acquisitionSourceChart", {
    type: "doughnut",
    data: {
      labels: ["Direct", "Social", "Search", "Referral"],
      datasets: [
        {
          data: [40, 25, 20, 15],
          backgroundColor: [
            "#31c7bd",
            "#4ba6df",
            "#9bd9d2",
            "#e2a84b"
          ],
          borderColor: "#162537",
          borderWidth: 2
        }
      ]
    },
    options: getChartOptions({
      cutout: "58%",
      scales: {}
    })
  });
}                             */

function renderNewRecurringChart(orders) {
  const customers = getCustomerStats(orders);

  makeChart("newRecurringChart", {
    type: "doughnut",
    data: {
      labels: ["New", "Recurring"],
      datasets: [
        {
          data: [customers.fresh, customers.recurring],
          backgroundColor: ["#31c7bd", "#4ba6df"],
          borderColor: "#162537",
          borderWidth: 2
        }
      ]
    },
    options: getChartOptions({
      cutout: "62%",
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "#0a1422",
          titleColor: "#ffffff",
          bodyColor: "#d7e6f6"
        }
      },
      scales: {}
    })
  });
}

function renderProductMatrix(orders) {
  const matrix = document.querySelector("#analyticsProductMatrix");
  if (!matrix) return;

  const products = getProductStats(orders).slice(0, 5);

  if (!products.length) {
    matrix.innerHTML = `
      <div class="heatmap-row">
        <span>No product data yet</span>
        <span>-</span>
        <span>-</span>
      </div>
    `;
    return;
  }

  matrix.innerHTML = products.map(product => `
    <div class="heatmap-row">
      <span>${product.name}</span>
      <span>
        <div class="heatmap-cell">${product.sold}</div>
      </span>
      <span>
        <div class="heatmap-cell">${formatCurrency(product.revenue)}</div>
      </span>
    </div>
  `).join("");
}

function initAnalyticsPage() {
  const page = document.querySelector("#adminAnalyticsPage");
  if (!page) return;

  clearOldCharts();

  const orders = getOrders();

  renderKpis(orders);
  renderRevenueTrendChart(orders);
  renderTopCategoriesChart(orders);
/*  renderAcquisitionSourceChart(); */
  renderNewRecurringChart(orders);
  renderProductMatrix(orders);
}

document.addEventListener("DOMContentLoaded", initAnalyticsPage);