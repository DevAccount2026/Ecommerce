const CAMPAIGNS_KEY = "shoffeeko_marketing_campaigns";

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

      <span>
        <button
          class="marketing-action-btn"
          onclick="previewCampaign('${campaign.id}')">
          View
        </button>
      </span>
    </div>
  `).join("");
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