const ORDERS_KEY = "shoffeeko_orders";
const PRODUCTS_KEY = "adminProducts";

let orderTrendsChartInstance = null;
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
    order.customer?.phone ||
    order.customer?.firstName ||
    order.customerName ||
    order.id ||
    order.orderNumber ||
    "unknown"
  ).toString().toLowerCase();
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
  setText("#analyticsCLVCard", formatCurrency(clv));
  setText("#analyticsCLVChange", "9.7%");

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

function renderOrderTrendsChart(labels, values) {
  const canvas = document.querySelector("#orderTrendsChart");
  if (!canvas) return;

  if (orderTrendsChartInstance) {
    orderTrendsChartInstance.destroy();
  }

  orderTrendsChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Orders",
        data: values,
        tension: 0.4,
        fill: true
      }]
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

function renderCustomerBehaviorFunnel() {
  const container = document.querySelector("#customerBehaviorFunnel");
  if (!container) {
    console.warn("Customer Behavior Funnel container not found.");
    return;
  }

  const orders = getOrders();

  const visitors = 100;
  const productViews = 65;
  const addToCart = 18;
  const checkout = 9;
  const completedPurchase = orders.length || 3;

  const stages = [
    { label: "Visitors", value: visitors, rate: 100, className: "visitors" },
    { label: "Product View", value: productViews, rate: 65, className: "product-view" },
    { label: "Add to Cart", value: addToCart, rate: 18, className: "add-cart" },
    { label: "Checkout", value: checkout, rate: 9, className: "checkout" },
    { label: "Completed Purchase", value: completedPurchase, rate: 3.2, className: "purchase" }
  ];

  container.innerHTML = stages.map(stage => `
    <div class="behavior-row">
      <div class="behavior-label">${stage.label}</div>

      <div class="behavior-track">
        <div 
          class="behavior-bar ${stage.className}" 
          style="width:${stage.rate}%"
        ></div>
      </div>

      <div class="behavior-rate">${stage.rate}%</div>
    </div>
  `).join("");
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

  renderOrderTrendsChart(labels, values);
}

function renderSparkline(canvasId, values, color = "#31c7bd") {
  const canvas = document.querySelector(`#${canvasId}`);
  if (!canvas || typeof Chart === "undefined") return;

  new Chart(canvas, {
    type: "line",
    data: {
      labels: values.map((_, index) => index + 1),
      datasets: [{
        data: values,
        borderColor: color,
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.45
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

function renderSvgSparkline(elementId, values, color = "#31c7bd") {
  const element = document.querySelector(`#${elementId}`);
  if (!element || !values.length) return;

  const width = 110;
  const height = 42;
  const padding = 5;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  element.innerHTML = `
  <svg viewBox="0 0 ${width} ${height}">
    <polyline 
      points="${points.join(" ")}"
      fill="none"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    ></polyline>
  </svg>
`;
}

function renderKpiSparklines() {
  renderSvgSparkline("aovSparkline", [560, 590, 570, 630, 650, 640, 652]);
  renderSvgSparkline("revenueSparkline", [3200, 4800, 4300, 6500, 8000, 9300, 12400]);
  renderSvgSparkline("ordersSparkline", [3, 5, 4, 8, 10, 13, 19]);
  renderSvgSparkline("repeatSparkline", [54, 52, 51, 50, 49, 50, 50]);
  renderSvgSparkline("clvSparkline", [3200, 3350, 3300, 3600, 3500, 3900, 4250]);
}

function renderCustomerSegmentGraph(orders = getOrders()) {
  const canvas = document.querySelector("#customerSegmentChart");
  const legend = document.querySelector("#customerSegmentLegend");
  const totalEl = document.querySelector("#customerSegmentTotal");

  if (!canvas || !legend || !totalEl) return;

  const customers = getCustomerStats(orders);

 const getAnalyticsCustomerTier = totalSpent => {
 const spent = Number(totalSpent || 0);

  if (spent >= 50000) return "Platinum";
  if (spent >= 10000) return "Gold";
  if (spent >= 5000) return "Silver";
  if (spent >= 1000) return "Bronze";

    return "New";
  };

  const analyticsCustomers = customers.map(customer => {
    const tier = getAnalyticsCustomerTier(customer.spend);

    return {
      ...customer,
      tier,
     segments: {
        vip: tier === "Platinum",
        loyal: tier === "Gold",
        occasional: ["New", "Bronze", "Silver"].includes(tier) && customer.orders === 1,
        atRisk: ["New", "Bronze", "Silver"].includes(tier) && customer.orders >= 2
     }
    };
  });

  const totalCustomers = analyticsCustomers.length;

  const segmentData = [
    {
      name: "VIP Customers",
      color: "#7c4dff",
      count: analyticsCustomers.filter(c => c.segments.vip).length
    },
    {
      name: "Loyal Customers",
      color: "#2f8cff",
      count: analyticsCustomers.filter(c => c.segments.loyal).length
    },
    {
      name: "Occasional Buyers",
      color: "#2fc47c",
      count: analyticsCustomers.filter(c => c.segments.occasional).length
    },
    {
      name: "At Risk Customers",
      color: "#f6a027",
      count: analyticsCustomers.filter(c => c.segments.atRisk).length
    }
  ];

  totalEl.textContent = totalCustomers.toLocaleString();

  legend.innerHTML = segmentData.map(segment => {
    const percent = totalCustomers
      ? Math.round((segment.count / totalCustomers) * 100)
      : 0;

    return `
      <div class="customer-segment-row">
        <span class="customer-segment-dot" style="background:${segment.color}"></span>
        <span class="customer-segment-name">${segment.name}</span>
        <span class="customer-segment-value">
          ${percent}% <span>(${segment.count.toLocaleString()})</span>
        </span>
      </div>
    `;
  }).join("");

  if (window.customerSegmentChartInstance) {
    window.customerSegmentChartInstance.destroy();
  }

  window.customerSegmentChartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: segmentData.map(segment => segment.name),
      datasets: [{
        data: segmentData.map(segment => segment.count),
        backgroundColor: segmentData.map(segment => segment.color),
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function initAnalyticsPage() {
  const page = document.querySelector("#adminAnalyticsPage");
  if (!page) return;

  clearOldCharts();

  const orders = getOrders();
  const products = getProducts();

  renderKpis(orders, products);
  renderRevenueByCategory(orders);
  renderRevenueByProduct(orders);
  renderTopCustomers(orders);
  renderBestSellingProducts(orders);
  renderWorstSellingProducts(orders);
  renderOrderTrends(orders);
  renderMonthlyRevenueComparison(orders);
  renderMarketingAttribution(orders);
  renderSalesConversionSummary(orders);
  renderCustomerBehaviorFunnel();
  renderSalesFunnel(orders);
  renderKpiSparklines();
  renderCustomerSegmentGraph(orders);
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