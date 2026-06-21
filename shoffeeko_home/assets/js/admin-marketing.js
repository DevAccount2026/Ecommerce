const CAMPAIGNS_KEY = "shoffeeko_marketing_campaigns";
const ORDERS_KEY = "shoffeeko_orders";
const CURRENT_CUSTOMER_KEY = "shoffeeko_current_customer";

function getCustomerSegments(customer) {
  const tier = getCustomerTier(customer.totalSpent);
  const orderCount = Number(customer.orderCount || 0);
  const daysSinceLastOrder = Number(customer.daysSinceLastOrder || 0);

  return {
    all: true,
    new: orderCount === 1,
    repeat: orderCount >= 2,
    loyal: ["Silver", "Gold"].includes(tier),
    vip: tier === "Gold",
    active: daysSinceLastOrder <= 30,
    atRisk: daysSinceLastOrder > 30
  };
  
  segments.list = Object.keys(segments)
    .filter(key => segments[key] === true);

  return segments;

}

const MARKETING_SEGMENT_RULES = [
  {
    id: "all",
    name: "All Customers",
    match: customer => customer.segments.all
  },
  {
    id: "new",
    name: "New Customers",
    match: customer => customer.segments.new
  },
  {
    id: "repeat",
    name: "Repeat Buyers",
    match: customer => customer.segments.repeat
  },
  {
    id: "loyal",
    name: "Loyal Customers",
    match: customer => customer.segments.loyal
  },
  {
    id: "vip",
    name: "VIP Customers",
    match: customer => customer.segments.vip
  },
  {
    id: "active",
    name: "Active Customers",
    match: customer => customer.segments.active
  },
  {
    id: "at-risk",
    name: "At Risk Customers",
    match: customer => customer.segments.atRisk
  }

];

let campaigns = [];

document.addEventListener("DOMContentLoaded", initMarketingPage);

function getCampaigns() {
  try {
    return JSON.parse(localStorage.getItem(CAMPAIGNS_KEY)) || [];
  } catch (error) {
    console.error("Campaign data is broken:", error);
    localStorage.removeItem(CAMPAIGNS_KEY);
    return [];
  }
}

function saveCampaigns() {
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
}

function formatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function initMarketingPage() {
  const page = document.querySelector("#adminMarketingPage");
  if (!page) return;

  campaigns = getCampaigns();

  renderSegmentOptions();

  bindMarketingEvents();
  renderMarketingPage();
}

function bindMarketingEvents() {
  const openBtn = document.querySelector("#openCampaignModal");
  const closeBtn = document.querySelector("#closeCampaignModal");
  const cancelBtn = document.querySelector("#cancelCampaign");
  const modal = document.querySelector("#campaignModal");
  const form = document.querySelector("#campaignForm");
  const search = document.querySelector("#marketingSearch");

  openBtn?.addEventListener("click", openCampaignModal);
  closeBtn?.addEventListener("click", closeCampaignModal);
  cancelBtn?.addEventListener("click", closeCampaignModal);

  modal?.addEventListener("click", event => {
    if (event.target === modal) {
      closeCampaignModal();
    }
  });

  form?.addEventListener("submit", handleCampaignSubmit);

  search?.addEventListener("input", () => {
    renderCampaignList(search.value);
  });
}

function openCampaignModal() {
  const modal = document.querySelector("#campaignModal");
  const form = document.querySelector("#campaignForm");

  form?.reset();
  modal?.classList.add("active");
  modal?.setAttribute("aria-hidden", "false");
}

function closeCampaignModal() {
  const modal = document.querySelector("#campaignModal");

  modal?.classList.remove("active");
  modal?.setAttribute("aria-hidden", "true");
}

function handleCampaignSubmit(event) {
  event.preventDefault();

  const campaign = {
    id: `CMP-${Date.now()}`,
    name: document.querySelector("#campaignName").value.trim(),
    segment: document.querySelector("#campaignSegment").value,
    subject: document.querySelector("#campaignSubject").value.trim(),
    message: document.querySelector("#campaignMessage").value.trim(),
    status: document.querySelector("#campaignStatus").value,
    createdAt: new Date().toISOString()
  };

  campaigns.unshift(campaign);
  saveCampaigns();

  closeCampaignModal();
  renderMarketingPage();
}

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch (error) {
    console.error("Orders data is broken:", error);
    return [];
  }
}

function getCustomerEmail(order) {
  return (
    order.customerEmail ||
    order.email ||
    order.customer?.email ||
    ""
  ).toLowerCase();
}

function getMarketingCustomers() {
  const orders = getOrders();
  const customerMap = new Map();
  const now = new Date();

  orders.forEach(order => {
    const email = getCustomerEmail(order);
    if (!email) return;

    const total = Number(order.total || order.subtotal || 0);
    const date = new Date(order.createdAt || order.date || order.orderDate);

    if (!customerMap.has(email)) {
      customerMap.set(email, {
        email,
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: null,
        daysSinceLastOrder: null
      });
    }

    const customer = customerMap.get(email);

    customer.orderCount += 1;
    customer.totalSpent += total;

    if (!Number.isNaN(date.getTime())) {
      if (!customer.lastOrderDate || date > customer.lastOrderDate) {
        customer.lastOrderDate = date;
      }
    }
  });

  return Array.from(customerMap.values()).map(customer => {
    if (!customer.lastOrderDate) {
      return customer;
    }

   const daysSinceLastOrder = Math.floor(
      (now - customer.lastOrderDate) / (1000 * 60 * 60 * 24)
    );

    const customerProfile = {
      ...customer,
      daysSinceLastOrder
    };

    customerProfile.segments = getCustomerSegments(customerProfile);

    return customerProfile;
  });
}

function getMarketingSegments() {
  const customers = getMarketingCustomers();

  customers.forEach(customer => {
    customer.segments = getCustomerSegments(customer);
  });

  return MARKETING_SEGMENT_RULES.map(rule => ({
    id: rule.id,
    name: rule.name,
    customers: customers.filter(rule.match)
  }));
}

function renderSegmentOptions() {
  const select = document.querySelector("#campaignSegment");

  if (!select) return;

  select.innerHTML = MARKETING_SEGMENT_RULES.map(segment => `
    <option value="${segment.name}">
      ${segment.name}
    </option>
  `).join("");
}

function renderMarketingPage() {
  renderMarketingKpis();
  renderCampaignList();
}

function renderMarketingKpis() {
  const total = campaigns.length;
  const draft = campaigns.filter(campaign => campaign.status === "Draft").length;
  const ready = campaigns.filter(campaign => campaign.status === "Ready").length;

  setText("#totalCampaigns", total);
  setText("#draftCampaigns", draft);
  setText("#readyCampaigns", ready);

  const segments = getMarketingSegments();
  setText("#targetSegments", segments.length);
  setText("#campaignCountLabel", `${total} campaign${total === 1 ? "" : "s"}`);

  
}

function renderCampaignList(searchTerm = "") {
  const list = document.querySelector("#campaignList");
  if (!list) return;

  const keyword = searchTerm.toLowerCase();

  const filteredCampaigns = campaigns.filter(campaign => {
    return (
      campaign.name.toLowerCase().includes(keyword) ||
      campaign.segment.toLowerCase().includes(keyword) ||
      campaign.subject.toLowerCase().includes(keyword) ||
      campaign.status.toLowerCase().includes(keyword)
    );
  });

  if (!filteredCampaigns.length) {
    list.innerHTML = `
      <div class="marketing-empty">
        No campaigns found. Create your first campaign.
      </div>
    `;
    return;
  }

  list.innerHTML = filteredCampaigns.map(campaign => `
    <div class="marketing-row">
      <span>
        <strong>${campaign.name}</strong><br>
        <small>${campaign.subject}</small>
      </span>

      <span>${campaign.segment}</span>

      <span>
        <em class="marketing-status marketing-status--${campaign.status.toLowerCase()}">
          ${campaign.status}
        </em>
      </span>

      <span>${formatDate(campaign.createdAt)}</span>

      <span class="marketing-actions">
        <button class="marketing-action-btn" onclick="previewCampaign('${campaign.id}')">
          View
        </button>

        <button class="marketing-action-btn" onclick="markCampaignReady('${campaign.id}')">
          Ready
        </button>

        <button class="marketing-action-btn marketing-action-btn--danger" onclick="deleteCampaign('${campaign.id}')">
          Delete
        </button>
      </span>

    </div>
  `).join("");
}

function markCampaignReady(campaignId) {
  campaigns = campaigns.map(campaign => {
    if (campaign.id === campaignId) {
      return {
        ...campaign,
        status: "Ready"
      };
    }

    return campaign;
  });

  saveCampaigns();
  renderMarketingPage();
}

function deleteCampaign(campaignId) {
  const confirmDelete = confirm("Delete this campaign?");

  if (!confirmDelete) return;

  campaigns = campaigns.filter(campaign => campaign.id !== campaignId);

  saveCampaigns();
  renderMarketingPage();
}

function previewCampaign(campaignId) {
  const campaign = campaigns.find(item => item.id === campaignId);

  if (!campaign) return;

  alert(
`Campaign: ${campaign.name}

Segment: ${campaign.segment}
Status: ${campaign.status}

Subject:
${campaign.subject}

Message:
${campaign.message}`
  );
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}