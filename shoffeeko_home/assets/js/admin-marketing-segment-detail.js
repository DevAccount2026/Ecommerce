document.addEventListener("DOMContentLoaded", initSegmentDetailPage);

function initSegmentDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const segmentId = params.get("segment");

  const segments = getMarketingSegments();
  const segment = segments.find(item => item.id === segmentId);

  if (!segment) {
    document.querySelector("#segmentTitle").textContent = "Segment Not Found";
    document.querySelector("#segmentCustomerList").innerHTML = `
      <div class="segment-empty">No segment found.</div>
    `;
    return;
  }

  renderSegmentDetail(segment);
}

function renderSegmentDetail(segment) {
  document.querySelector("#segmentTitle").textContent = segment.name;
  document.querySelector("#segmentSubtitle").textContent =
    `Customers matching the ${segment.name} segment.`;

  document.querySelector("#segmentCustomerCount").textContent =
    segment.customers.length;

  renderCustomers(segment.customers);
}

function renderCustomers(customers) {
  const list = document.querySelector("#segmentCustomerList");

  if (!customers.length) {
    list.innerHTML = `
      <div class="segment-empty">
        No customers found in this segment.
      </div>
    `;
    return;
  }

  list.innerHTML = customers.map(customer => `
    <div class="segment-customer-row">
      <span>${customer.email}</span>
      <span>${customer.orderCount}</span>
      <span>${formatMoney(customer.totalSpent)}</span>
      <span>${formatSegmentDate(customer.lastOrderDate)}</span>
    </div>
  `).join("");
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatSegmentDate(value) {
  if (!value) return "No order";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}