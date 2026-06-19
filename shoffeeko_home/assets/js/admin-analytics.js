const ORDERS_KEY = "shoffeeko_orders";
const PRODUCTS_KEY = "adminProducts";

let analyticsCharts = [];

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch {
    return [];
  }
}

function getProducts() {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
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

function getOrderTotal(order) {
  return Number(order.total || order.subtotal || order.totalAmount || 0);
}

function getOrderItems(order) {
  return order.items || order.cart || order.products || [];
}

function getCustomerEmail(order) {
  return (
    order.customerEmail ||
    order.email ||
    order.customer?.email ||
    "unknown"
  ).toLowerCase();
}

function getCustomerName(order) {
  return (
    order.customerName ||
    order.customer?.name ||
    `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() ||
    getCustomerEmail(order)
  );
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

function renderTable(selector, rows, emptyMessage = "No data yet") {
  const container = document.querySelector(selector);
  if (!container) return;

  if (!rows.length) {
    container.innerHTML = `<div class="analytics-empty">${emptyMessage}</div>`;
    return;
  }

  container.innerHTML = rows.join("");
}

function getProductStats(orders) {
  const stats = {};

  orders.forEach(order => {
    getOrderItems(order).forEach(item => {
      const name = getItemName(item);

      if (!stats[name]) {
        stats[name] = {
          name,
          category: getItemCategory(item),
          sold: 0,
          revenue: 0
        };
      }

      stats[name].sold += getItemQuantity(item);
      stats[name].revenue += getItemRevenue(item);
    });
  });

  return Object.values(stats);
}

function getCategoryRevenue(orders) {
  const stats = {};

  orders.forEach(order => {
    getOrderItems(order).forEach(item => {
      const category = getItemCategory(item);
      stats[category] = (stats[category] || 0) + getItemRevenue(item);
    });
  });

  return Object.entries(stats)
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

function getCustomerStats(orders) {
  const stats = {};

  orders.forEach(order => {
    const email = getCustomerEmail(order);

    if (!stats[email]) {
      stats[email] = {
        name: getCustomerName(order),
        email,
        orders: 0,
        spend: 0
      };
    }

    stats[email].orders += 1;
    stats[email].spend += getOrderTotal(order);
  });

  return Object.values(stats).sort((a, b) => b.spend - a.spend);
}

function getRepeatPurchaseRate(orders) {
  const customers = getCustomerStats(orders);
  if (!customers.length) return 0;

  const repeatCustomers = customers.filter(customer => customer.orders > 1).length;
  return (repeatCustomers / customers.length) * 100;
}

function getInventoryValue(products) {
  return products.reduce((sum, product) => {
    const price = Number(product.price || 0);
    const stock = Number(product.stock || product.inventory || 0);
    return sum + price * stock;
  }, 0);
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderKpis(orders, products) {
  const totalRevenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const totalOrders = orders.length;
  const customers = getCustomerStats(orders);
  const repeatRate = getRepeatPurchaseRate(orders);
  const inventoryValue = getInventoryValue(products);
  const aov = totalOrders ? totalRevenue / totalOrders : 0;
  const clv = getCustomerLifetimeValue(orders);
        
  setText("#analyticsCLV", formatCurrency(clv));
  setText("#analyticsTotalRevenue", formatCurrency(totalRevenue));
  setText("#analyticsTotalOrders", totalOrders);
  setText("#analyticsAOV", formatCurrency(aov));
  setText("#analyticsCustomers", customers.length);
  setText("#analyticsRepeatRate", `${repeatRate.toFixed(1)}%`);
  setText("#analyticsInventoryValue", formatCurrency(inventoryValue));
}

function renderRevenueByCategory(orders) {
  const rows = getCategoryRevenue(orders).slice(0, 8).map(item => `
    <div class="analytics-row">
      <span>${item.category}</span>
      <strong>${formatCurrency(item.revenue)}</strong>
    </div>
  `);

  renderTable("#revenueByCategoryList", rows);
}

function renderRevenueByProduct(orders) {
  const rows = getProductStats(orders)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map(product => `
      <div class="analytics-row">
        <span>${product.name}</span>
        <strong>${formatCurrency(product.revenue)}</strong>
      </div>
    `);

  renderTable("#revenueByProductList", rows);
}

function renderTopCustomers(orders) {
  const rows = getCustomerStats(orders).slice(0, 8).map(customer => `
    <div class="analytics-row">
      <span>
        ${customer.name}
        <small>${customer.email}</small>
      </span>
      <strong>${formatCurrency(customer.spend)}</strong>
    </div>
  `);

  renderTable("#topCustomersList", rows);
}

function renderBestSellingProducts(orders) {
  const rows = getProductStats(orders)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 8)
    .map(product => `
      <div class="analytics-row">
        <span>${product.name}</span>
        <strong>${product.sold} sold</strong>
      </div>
    `);

  renderTable("#bestSellingProductsList", rows);
}

function renderWorstSellingProducts(orders) {
  const rows = getProductStats(orders)
    .sort((a, b) => a.sold - b.sold)
    .slice(0, 8)
    .map(product => `
      <div class="analytics-row">
        <span>${product.name}</span>
        <strong>${product.sold} sold</strong>
      </div>
    `);

  renderTable("#worstSellingProductsList", rows);
}

function renderOrderTrends(orders) {
  const grouped = {};

  orders.forEach(order => {
    const date = new Date(order.createdAt || order.date || Date.now());
    const key = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });

    grouped[key] = (grouped[key] || 0) + 1;
  });

  const labels = Object.keys(grouped);
  const values = Object.values(grouped);

  makeChart("orderTrendsChart", {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Orders",
          data: values,
          borderColor: "#34d6c3",
          backgroundColor: "rgba(52, 214, 195, 0.16)",
          fill: true,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function renderMonthlyRevenueComparison(orders) {
  const grouped = {};

  orders.forEach(order => {
    const date = new Date(order.createdAt || order.date || Date.now());
    const key = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    });

    grouped[key] = (grouped[key] || 0) + getOrderTotal(order);
  });

  const labels = Object.keys(grouped);
  const values = Object.values(grouped);

  makeChart("monthlyRevenueChart", {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: values,
          backgroundColor: "#34d6c3"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function renderSalesConversionSummary(orders) {
  const totalOrders = orders.length;
  const customers = getCustomerStats(orders);
  const totalRevenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const aov = totalOrders ? totalRevenue / totalOrders : 0;
  const repeatRate = getRepeatPurchaseRate(orders);

  setText("#summaryTotalOrders", totalOrders);
  setText("#summaryRepeatRate", `${repeatRate.toFixed(1)}%`);
  setText("#summaryAOV", formatCurrency(aov));
  setText("#summaryCustomers", customers.length);
}

  function renderCustomerSegmentation(orders) {
  const customers = getCustomerStats(orders);

  const vipCustomers = customers.filter(customer => customer.spend >= 5000);
  const activeCustomers = customers.filter(customer => customer.orders >= 2);
  const atRiskCustomers = customers.filter(customer => customer.orders === 1);
  const newCustomers = customers.filter(customer => customer.orders === 1);

  setText("#segmentVipCustomers", vipCustomers.length);
  setText("#segmentActiveCustomers", activeCustomers.length);
  setText("#segmentAtRiskCustomers", atRiskCustomers.length);
  setText("#segmentNewCustomers", newCustomers.length);

      const rows = vipCustomers.slice(0, 5).map(customer => `
        <div class="analytics-row">
          <span>
            ${customer.name}
            <small>${customer.email} · ${customer.orders} order(s)</small>
          </span>
          <strong>${formatCurrency(customer.spend)}</strong>
        </div>
      `);

      renderTable(
        "#customerSegmentList",
        rows,
        "No VIP customers yet"
      );
    }

    function renderSalesFunnel(orders) {
  const created = orders.length;

  const processing = orders.filter(order =>
    (order.orderStatus || order.status) === "Processing"
  ).length;

  const shipped = orders.filter(order =>
    (order.orderStatus || order.status) === "Shipped"
  ).length;

  const delivered = orders.filter(order =>
    (order.orderStatus || order.status) === "Delivered"
  ).length;

  const max = Math.max(
    created,
    processing,
    shipped,
    delivered,
    1
  );

  const funnel = document.querySelector("#salesFunnel");

  if (!funnel) return;

  funnel.className = "sales-funnel";

  funnel.innerHTML = `
    ${buildFunnelRow("Created", created, max)}
    ${buildFunnelRow("Processing", processing, max)}
    ${buildFunnelRow("Shipped", shipped, max)}
    ${buildFunnelRow("Delivered", delivered, max)}
  `;
}

  function buildFunnelRow(label, value, max) {
    const width = (value / max) * 100;

    return `
      <div class="sales-funnel-row">
        <span>${label}</span>

        <div class="sales-funnel-bar">
          <div
            class="sales-funnel-fill"
            style="width:${width}%">
          </div>
        </div>

        <strong>${value}</strong>
      </div>
    `;
  }

  function getOrderSource(order) {
  return (
    order.source ||
    order.trafficSource ||
    order.marketingSource ||
    order.utmSource ||
    order.customer?.source ||
    "Direct"
  );
}

function getMarketingAttributionStats(orders) {
  const sources = {};

  orders.forEach(order => {
    const source = getOrderSource(order);
    const revenue = getOrderTotal(order);

    if (!sources[source]) {
      sources[source] = {
        source,
        orders: 0,
        revenue: 0
      };
    }

    sources[source].orders += 1;
    sources[source].revenue += revenue;
  });

  return Object.values(sources).sort((a, b) => b.revenue - a.revenue);
}

function renderMarketingAttribution(orders) {
  const stats = getMarketingAttributionStats(orders);

  const totalAttributedRevenue = stats.reduce((sum, item) => {
    return sum + item.revenue;
  }, 0);

  const totalAttributedOrders = stats.reduce((sum, item) => {
    return sum + item.orders;
  }, 0);

  const topSource = stats[0]?.source || "Direct";

  setText("#topTrafficSource", topSource);
  setText("#attributedRevenue", formatCurrency(totalAttributedRevenue));
  setText("#attributedOrders", totalAttributedOrders);

  const rows = stats.map(item => `
    <div class="analytics-row">
      <span>
        ${item.source}
        <small>${item.orders} order(s)</small>
      </span>
      <strong>${formatCurrency(item.revenue)}</strong>
    </div>
  `);

  renderTable(
    "#marketingAttributionList",
    rows,
    "No attribution data yet"
  );
}

function initAnalyticsPage() {
  const page = document.querySelector("#adminAnalyticsPage");
  if (!page) return;

  clearOldCharts();

  const orders = getOrders();
  const products = getProducts();

  renderMarketingAttribution(orders);
  renderSalesFunnel(orders);
  renderCustomerSegmentation(orders);
  renderSalesConversionSummary(orders);
  renderKpis(orders, products);
  renderRevenueByCategory(orders);
  renderRevenueByProduct(orders);
  renderTopCustomers(orders);
  renderBestSellingProducts(orders);
  renderWorstSellingProducts(orders);
  renderOrderTrends(orders);
  renderMonthlyRevenueComparison(orders);

  renderKpis(orders, products);
  renderRevenueByCategory(orders);
  renderRevenueByProduct(orders);
  renderTopCustomers(orders);
  renderBestSellingProducts(orders);
  renderWorstSellingProducts(orders);
  renderOrderTrends(orders);
  renderMonthlyRevenueComparison(orders);
  renderSalesConversionSummary(orders);
  renderCustomerSegmentation(orders);

}

function getCustomerLifetimeValue(orders) {
  const customers = getCustomerStats(orders);

  if (!customers.length) return 0;

  const totalSpend = customers.reduce((sum, customer) => {
    return sum + customer.spend;
  }, 0);

  return totalSpend / customers.length;
}

document.addEventListener("DOMContentLoaded", initAnalyticsPage);