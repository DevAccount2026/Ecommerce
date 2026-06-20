document.addEventListener("DOMContentLoaded", initAdminSupportPage);

const SUPPORT_TICKETS_KEY = "shoffeeko_support_tickets";

let supportSearchTerm = "";
let supportStatusFilter = getStatusFromUrl();

function getStatusFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("status") || "All";
}

function initAdminSupportPage() {
  const root = document.querySelector("#adminSupportPage");
  if (!root) return;

  loadAdminSupportComponent(root);
}

async function loadAdminSupportComponent(root) {
  const componentPath = root.dataset.component;

  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error("Failed to load admin support component");

    root.innerHTML = await response.text();

    bindAdminSupportEvents();
    renderAdminSupportPage();
  } catch (error) {
    console.error("Admin Support Error:", error);
    root.innerHTML = `
      <section class="admin-empty-row">
        <h2>Admin support failed to load.</h2>
      </section>
    `;
  }
}

function bindAdminSupportEvents() {
  const searchInput = document.querySelector("#supportSearchInput");
  const statusFilter = document.querySelector("#supportStatusFilter");

  searchInput?.addEventListener("input", event => {
    supportSearchTerm = event.target.value.toLowerCase().trim();
    renderAdminSupportPage();
  });

  statusFilter?.addEventListener("change", event => {
    supportStatusFilter = event.target.value;
    renderAdminSupportPage();
  });

    if (statusFilter) {
      statusFilter.value = supportStatusFilter;
    }

}

function getSupportTickets() {
  try {
    return JSON.parse(localStorage.getItem(SUPPORT_TICKETS_KEY)) || [];
  } catch (error) {
    localStorage.removeItem(SUPPORT_TICKETS_KEY);
    return [];
  }
}

function formatDateTime(value) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getFilteredTickets() {
  const tickets = getSupportTickets();

  return tickets
    .filter(ticket => {
      if (supportStatusFilter === "All") return true;
      return ticket.status === supportStatusFilter;
    })
    .filter(ticket => {
      if (!supportSearchTerm) return true;

      const searchable = [
        ticket.id,
        ticket.customerName,
        ticket.customerEmail,
        ticket.subject,
        ticket.category,
        ticket.status,
        ticket.message
      ].join(" ").toLowerCase();

      return searchable.includes(supportSearchTerm);
    })
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
}

function renderAdminSupportPage() {
  renderAdminSupportStats();
  renderAdminSupportTable();
}

function renderAdminSupportStats() {
  const statsRoot = document.querySelector("#adminSupportStats");
  if (!statsRoot) return;

  const tickets = getSupportTickets();

  const open = tickets.filter(ticket => ticket.status === "Open").length;
  const inProgress = tickets.filter(ticket => ticket.status === "In Progress").length;
  const waiting = tickets.filter(ticket => ticket.status === "Waiting Customer").length;
  const resolved = tickets.filter(
    ticket => ticket.status === "Resolved" || ticket.status === "Closed"
  ).length;

  statsRoot.innerHTML = `
    <article class="admin-support-stat">
      <span>Total Tickets</span>
      <strong>${tickets.length}</strong>
    </article>

    <article class="admin-support-stat">
      <span>Open</span>
      <strong>${open}</strong>
    </article>

    <article class="admin-support-stat">
      <span>In Progress</span>
      <strong>${inProgress}</strong>
    </article>

    <article class="admin-support-stat">
      <span>Resolved / Closed</span>
      <strong>${resolved}</strong>
    </article>
  `;
}

function renderAdminSupportTable() {
  const tableBody = document.querySelector("#adminSupportTableBody");
  const count = document.querySelector("#adminSupportCount");

  if (!tableBody) return;

  const tickets = getFilteredTickets();

  if (count) {
    count.textContent = `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}`;
  }

  if (!tickets.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="admin-empty-row">
          No support tickets found.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = tickets.map(ticket => {
    const statusClass = ticket.status.toLowerCase().replace(/\s+/g, "-");
    const repliesCount = ticket.replies?.length || 0;

    return `
      <tr>
        <td>
          <span class="admin-ticket-id">${ticket.id}</span>
        </td>

        <td>
          <strong>${ticket.customerName || "Customer"}</strong>
          <div class="admin-ticket-message">${ticket.customerEmail || "No email"}</div>
        </td>

        <td>
          <div class="admin-ticket-subject">${ticket.subject}</div>
          <div class="admin-ticket-message">${ticket.message}</div>
        </td>

        <td>
          <span class="admin-status ${statusClass}">
            ${ticket.status}
          </span>
        </td>

        <td>${repliesCount}</td>

        <td>${formatDateTime(ticket.updatedAt || ticket.createdAt)}</td>

        <td>
          <a href="admin-support-detail.html?id=${ticket.id}" class="admin-view-btn">
            View
          </a>
        </td>
      </tr>
    `;
  }).join("");
}