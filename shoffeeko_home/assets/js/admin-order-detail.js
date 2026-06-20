const NOTIFICATIONS_KEY = "shoffeeko_notifications";

function getSavedNotifications() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
  } catch (error) {
    console.error("Notifications are broken:", error);
    return [];
  }
}

function saveNotifications(notifications) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

function createOrderStatusNotification(order, oldStatus, newStatus) {
  if (!order || oldStatus === newStatus) return;

  const customerEmail =
    order.customerEmail ||
    order.email ||
    order.customer?.email ||
    "";

  if (!customerEmail) return;

  const orderId =
    order.id ||
    order.orderId ||
    order.orderNumber ||
    "Unknown Order";

  const existingNotifications = getSavedNotifications();

  const notificationKey = `${orderId}-${newStatus}`;

  const alreadyExists = existingNotifications.some(
    item => item.notificationKey === notificationKey
  );

  if (alreadyExists) return;

  const notification = {
    id: `NOTIF-${Date.now()}`,
    notificationKey,
    customerEmail: customerEmail.toLowerCase(),
    orderId,
    status: newStatus,
    title: `Order ${newStatus}`,
    message: `Order ${orderId} is currently ${newStatus}.`,
    type: "order-status",
    read: false,
    createdAt: new Date().toISOString()
  };

  saveNotifications([notification, ...existingNotifications]);
}