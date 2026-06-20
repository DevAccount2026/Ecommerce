document.addEventListener("DOMContentLoaded", initCustomerSupportDetailPage);

const SUPPORT_TICKETS_KEY = "shoffeeko_support_tickets";
const CURRENT_CUSTOMER_KEY = "shoffeeko_current_customer";

function initCustomerSupportDetailPage() {
  const root = document.querySelector("#customerSupportDetailPage");
  if (!root) return;

  loadSupportDetailComponent(root);
}

async function loadSupportDetailComponent(root) {
  const componentPath = root.dataset.component;

  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error("Failed to load support detail component");

    root.innerHTML = await response.text();

    bindSupportDetailEvents();
    renderSupportTicketDetail();
  } catch (error) {
    console.error("Support Detail Error:", error);
    root.innerHTML = `
      <section class="support-empty">
        <h2>Ticket detail failed to load.</h2>
        <p>Please refresh the page and try again.</p>
      </section>
    `;
  }
}

function getTicketIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function getCurrentCustomer() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_CUSTOMER_KEY)) || null;
  } catch (error) {
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
    localStorage.removeItem(SUPPORT_TICKETS_KEY);
    return [];
  }
}

function saveSupportTickets(tickets) {
  localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(tickets));
}

function findCurrentTicket() {
  const ticketId = getTicketIdFromUrl();
  const customerEmail = getCustomerEmail();

  return getSupportTickets().find(
    ticket => ticket.id === ticketId && ticket.customerEmail === customerEmail
  );
}

function formatDateTime(value) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function bindSupportDetailEvents() {
  const form = document.querySelector("#supportReplyForm");
  form?.addEventListener("submit", handleCustomerReply);
}

function renderSupportTicketDetail() {
  const ticket = findCurrentTicket();
  const title = document.querySelector("#ticketTitle");
  const subtitle = document.querySelector("#ticketSubtitle");
  const card = document.querySelector("#ticketDetailCard");
  const thread = document.querySelector("#supportThread");
  const replyCount = document.querySelector("#replyCount");
  const form = document.querySelector("#supportReplyForm");

  if (!ticket || !card || !thread) {
    if (title) title.textContent = "Ticket Not Found";
    if (subtitle) subtitle.textContent = "This ticket does not exist or does not belong to your account.";

    if (card) {
      card.innerHTML = `
        <div class="support-empty">
          <h2>Ticket not found</h2>
          <p>Please go back to the Support Center and choose an existing ticket.</p>
        </div>
      `;
    }

    if (thread) thread.innerHTML = "";
    if (form) form.style.display = "none";
    return;
  }

  const statusClass = ticket.status.toLowerCase().replace(/\s+/g, "-");

  if (title) title.textContent = `Ticket ${ticket.id}`;
  if (subtitle) subtitle.textContent = ticket.subject;

  card.innerHTML = `
    <div class="support-ticket-summary">
      <div class="support-ticket-summary__top">
        <div>
          <h2>${ticket.subject}</h2>
          <p>${ticket.message}</p>
        </div>

        <span class="support-status ${statusClass}">
          ${ticket.status}
        </span>
      </div>

      <div class="support-meta-grid">
        <div class="support-meta-item">
          <span>Ticket ID</span>
          <strong>${ticket.id}</strong>
        </div>

        <div class="support-meta-item">
          <span>Category</span>
          <strong>${ticket.category}</strong>
        </div>

        <div class="support-meta-item">
          <span>Created</span>
          <strong>${formatDateTime(ticket.createdAt)}</strong>
        </div>

        <div class="support-meta-item">
          <span>Last Updated</span>
          <strong>${formatDateTime(ticket.updatedAt || ticket.createdAt)}</strong>
        </div>
      </div>
    </div>
  `;

  const replies = ticket.replies || [];

  if (replyCount) {
    replyCount.textContent = `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`;
  }

  thread.innerHTML = replies.map(reply => {
    const senderClass = reply.sender === "admin" ? "admin" : "customer";
    const senderLabel =
      reply.sender === "admin"
        ? "🛠 Support Team"
        : `👤 ${reply.senderName || getCustomerName()}`;

    return `
      <article class="support-message ${senderClass}">
        <div class="support-message__header">
            <span class="support-message__sender">${senderLabel}</span>
            </span>
          <span class="support-message__date">${formatDateTime(reply.createdAt)}</span>
        </div>

        <p>${reply.message}</p>
      </article>
    `;
  }).join("");
}

function handleCustomerReply(event) {
  event.preventDefault();

  const thread = document.querySelector("#supportThread");

    thread?.lastElementChild?.scrollIntoView({
    behavior: "smooth",
    block: "end"
  });

  const messageInput = document.querySelector("#supportReplyMessage");
  const message = messageInput?.value.trim();

  if (!message) return;

  const ticketId = getTicketIdFromUrl();
  const customerEmail = getCustomerEmail();
  const tickets = getSupportTickets();

  const ticketIndex = tickets.findIndex(
    ticket => ticket.id === ticketId && ticket.customerEmail === customerEmail
  );

  if (ticketIndex === -1) return;

  tickets[ticketIndex].replies = tickets[ticketIndex].replies || [];

  tickets[ticketIndex].replies.push({
    sender: "customer",
    senderName: getCustomerName(),
    message,
    createdAt: new Date().toISOString()
  });

  tickets[ticketIndex].updatedAt = new Date().toISOString();

  if (tickets[ticketIndex].status === "Resolved" || tickets[ticketIndex].status === "Closed") {
    tickets[ticketIndex].status = "Open";
  }

  saveSupportTickets(tickets);

  messageInput.value = "";
  renderSupportTicketDetail();
}