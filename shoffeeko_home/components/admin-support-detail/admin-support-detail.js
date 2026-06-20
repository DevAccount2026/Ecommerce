document.addEventListener("DOMContentLoaded", initAdminSupportDetailPage);

const SUPPORT_TICKETS_KEY = "shoffeeko_support_tickets";
const NOTIFICATIONS_KEY = "shoffeeko_notifications";

function initAdminSupportDetailPage() {
  const root = document.querySelector("#adminSupportDetailPage");
  if (!root) return;

  loadAdminSupportDetailComponent(root);
}

async function loadAdminSupportDetailComponent(root) {
  const componentPath = root.dataset.component;

  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error("Failed to load admin support detail");

    root.innerHTML = await response.text();

    bindAdminSupportEvents();
    renderAdminTicketDetail();
  } catch (error) {
    console.error("Admin Support Detail Error:", error);
    root.innerHTML = `
      <section class="admin-empty">
        <h2>Support ticket failed to load.</h2>
      </section>
    `;
  }
}

function getTicketIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
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

function getCurrentTicket() {
  const ticketId = getTicketIdFromUrl();
  return getSupportTickets().find(ticket => ticket.id === ticketId);
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

function bindAdminSupportEvents() {
  const form = document.querySelector("#adminReplyForm");
  form?.addEventListener("submit", handleAdminReply);
}

function renderAdminTicketDetail() {
  const ticket = getCurrentTicket();

  const title = document.querySelector("#adminTicketTitle");
  const subtitle = document.querySelector("#adminTicketSubtitle");
  const summary = document.querySelector("#adminTicketSummary");
  const thread = document.querySelector("#adminSupportThread");
  const replyCount = document.querySelector("#adminReplyCount");
  const statusSelect = document.querySelector("#adminTicketStatus");
  const form = document.querySelector("#adminReplyForm");

  if (!ticket || !summary || !thread) {
    if (title) title.textContent = "Ticket Not Found";
    if (subtitle) subtitle.textContent = "This support ticket does not exist.";

    if (summary) {
      summary.innerHTML = `
        <div class="admin-empty">
          <h2>Ticket not found</h2>
          <p>Go back to the support queue and choose an existing ticket.</p>
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
  if (statusSelect) statusSelect.value = ticket.status;

  summary.innerHTML = `
    <div class="admin-ticket-top">
      <div>
        <h2>${ticket.subject}</h2>
        <p>${ticket.message}</p>
      </div>

      <span class="admin-status ${statusClass}">
        ${ticket.status}
      </span>
    </div>

    <div class="admin-meta-grid">
      <div class="admin-meta-item">
        <span>Customer</span>
        <strong>${ticket.customerName || "Customer"}</strong>
      </div>

      <div class="admin-meta-item">
        <span>Email</span>
        <strong>${ticket.customerEmail || "No email"}</strong>
      </div>

      <div class="admin-meta-item">
        <span>Category</span>
        <strong>${ticket.category}</strong>
      </div>

      <div class="admin-meta-item">
        <span>Created</span>
        <strong>${formatDateTime(ticket.createdAt)}</strong>
      </div>
    </div>
  `;

  const replies = ticket.replies || [];

  if (replyCount) {
    replyCount.textContent = `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`;
  }

  thread.innerHTML = replies.map(reply => {
    const senderClass = reply.sender === "admin" ? "admin" : "customer";
    const senderLabel = reply.sender === "admin"
      ? "🛠 Support Team"
      : `👤 ${reply.senderName || ticket.customerName || "Customer"}`;

    return `
      <article class="admin-message ${senderClass}">
        <div class="admin-message__header">
          <span class="admin-message__sender">${senderLabel}</span>
          <span class="admin-message__date">${formatDateTime(reply.createdAt)}</span>
        </div>

        <p>${reply.message}</p>
      </article>
    `;
  }).join("");
}

function handleAdminReply(event) {
  event.preventDefault();

  const messageInput = document.querySelector("#adminReplyMessage");
  const statusSelect = document.querySelector("#adminTicketStatus");

  const message = messageInput?.value.trim();
  const selectedStatus = statusSelect?.value;
  const ticketId = getTicketIdFromUrl();

  if (!selectedStatus) return;

  const tickets = getSupportTickets();
  const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);

  if (ticketIndex === -1) return;

  if (message) {
    tickets[ticketIndex].replies = tickets[ticketIndex].replies || [];

    tickets[ticketIndex].replies.push({
      sender: "admin",
      senderName: "Support Team",
      message,
      createdAt: new Date().toISOString()
    });
  }

  tickets[ticketIndex].status = selectedStatus;
  tickets[ticketIndex].updatedAt = new Date().toISOString();

  saveSupportTickets(tickets);

  if (message) {
    createSupportNotification(tickets[ticketIndex]);
  }

  if (messageInput) messageInput.value = "";

  renderAdminTicketDetail();
}

function createSupportNotification(ticket) {
  if (!ticket.customerEmail) return;

  let notifications = [];

  try {
    notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
  } catch (error) {
    notifications = [];
  }

  notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    customerEmail: ticket.customerEmail,
    type: "support",
    title: "Support Ticket Updated",
    message: `Ticket ${ticket.id} has a new reply.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}