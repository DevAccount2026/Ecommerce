document.addEventListener("DOMContentLoaded", initCustomerSupportPage);

const SUPPORT_TICKETS_KEY = "shoffeeko_support_tickets";
const CURRENT_CUSTOMER_KEY = "shoffeeko_current_customer";

function initCustomerSupportPage() {
  const root = document.querySelector("#customerSupportPage");
  if (!root) return;

  loadSupportComponent(root);
}

async function loadSupportComponent(root) {
  const componentPath = root.dataset.component;

  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error("Failed to load support component");

    root.innerHTML = await response.text();

    bindSupportEvents();
    renderSupportTickets();
  } catch (error) {
    console.error("Support Page Error:", error);
    root.innerHTML = `
      <section class="support-empty">
        <h2>Support Center failed to load.</h2>
        <p>Please refresh the page and try again.</p>
      </section>
    `;
  }
}

function getCurrentCustomer() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_CUSTOMER_KEY)) || null;
  } catch (error) {
    console.error("Customer session is broken:", error);
    return null;
  }
}

function getCustomerEmail() {
  const customer = getCurrentCustomer();

  return (
    customer?.email ||
    customer?.customerEmail ||
    customer?.userEmail ||
    "guest@customer.com"
  );
}

function getCustomerName() {
  const customer = getCurrentCustomer();

  return (
    customer?.name ||
    `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
    "Customer"
  );
}

function getSupportTickets() {
  try {
    return JSON.parse(localStorage.getItem(SUPPORT_TICKETS_KEY)) || [];
  } catch (error) {
    console.error("Support tickets are broken:", error);
    localStorage.removeItem(SUPPORT_TICKETS_KEY);
    return [];
  }
}

function saveSupportTickets(tickets) {
  localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(tickets));
}

function generateTicketId(tickets) {
  const nextNumber = tickets.length + 1;
  return `SUP-${String(nextNumber).padStart(3, "0")}`;
}

function formatTicketDate(value) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function bindSupportEvents() {
  const createBtn = document.querySelector("#createTicketBtn");
  const closeBtn = document.querySelector("#closeSupportModal");
  const cancelBtn = document.querySelector("#cancelSupportTicket");
  const form = document.querySelector("#supportTicketForm");

  createBtn?.addEventListener("click", openSupportModal);
  closeBtn?.addEventListener("click", closeSupportModal);
  cancelBtn?.addEventListener("click", closeSupportModal);
  form?.addEventListener("submit", handleCreateTicket);
}

function openSupportModal() {
  const modal = document.querySelector("#supportTicketModal");
  modal?.classList.add("is-open");
  modal?.setAttribute("aria-hidden", "false");
}

function closeSupportModal() {
  const modal = document.querySelector("#supportTicketModal");
  const form = document.querySelector("#supportTicketForm");

  modal?.classList.remove("is-open");
  modal?.setAttribute("aria-hidden", "true");
  form?.reset();
}

function handleCreateTicket(event) {
  event.preventDefault();

  const subject = document.querySelector("#ticketSubject")?.value.trim();
  const category = document.querySelector("#ticketCategory")?.value;
  const message = document.querySelector("#ticketMessage")?.value.trim();

  if (!subject || !category || !message) return;

  const tickets = getSupportTickets();
  const customerEmail = getCustomerEmail();

  const newTicket = {
    id: generateTicketId(tickets),
    customerEmail,
    customerName: getCustomerName(),
    subject,
    category,
    message,
    status: "Open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replies: [
      {
        sender: "customer",
        senderName: getCustomerName(),
        message,
        createdAt: new Date().toISOString()
      }
    ]
  };

  tickets.unshift(newTicket);
  saveSupportTickets(tickets);

  closeSupportModal();
  renderSupportTickets();
}

function renderSupportTickets() {
  const list = document.querySelector("#supportTicketList");
  const count = document.querySelector("#ticketCount");

  if (!list) return;

  const customerEmail = getCustomerEmail();
  const tickets = getSupportTickets().filter(
    ticket => ticket.customerEmail === customerEmail
  );

  if (count) {
    count.textContent = `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}`;
  }

  if (!tickets.length) {
    list.innerHTML = `
      <div class="support-empty">
        <h3>No support tickets yet</h3>
        <p>Create your first ticket if you need help with an order, payment, product, or delivery.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = tickets.map(ticket => {
    const statusClass = ticket.status.toLowerCase().replace(/\s+/g, "-");

    return `
      <article class="support-ticket-card">
        <div class="support-ticket-card__top">
          <div>
            <span class="support-ticket-meta">${ticket.id}</span>
            <h3>${ticket.subject}</h3>
            <p>${ticket.message}</p>
          </div>

          <span class="support-status ${statusClass}">
            ${ticket.status}
          </span>
        </div>

        <div class="support-ticket-meta">
          <span>Category: ${ticket.category}</span>
          <span>Created: ${formatTicketDate(ticket.createdAt)}</span>
          <span>Replies: ${ticket.replies?.length || 0}</span>
        </div>

        <div class="support-card-actions">
          <a href="support-detail.html?id=${ticket.id}" class="support-view-btn">
            View Ticket
          </a>
        </div>
      </article>
    `;
  }).join("");
}