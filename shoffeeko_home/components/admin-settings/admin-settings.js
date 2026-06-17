const SETTINGS_KEY = "shoffeeko_settings";

let defaultSettings = null;

async function fetchSettings() {
  const root = document.querySelector("#adminSettingsPage");
  const apiUrl = root?.dataset.api;

  if (!root || !apiUrl) return null;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch settings");
    return await response.json();
  } catch (error) {
    console.error("Settings API Error:", error);
    return null;
  }
}

function getSavedSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY));
  } catch (error) {
    console.error("Saved settings are broken:", error);
    localStorage.removeItem(SETTINGS_KEY);
    return null;
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getFormSettings() {
  return {
    store: {
      name: document.querySelector("#storeName").value.trim(),
      email: document.querySelector("#storeEmail").value.trim(),
      phone: document.querySelector("#storePhone").value.trim(),
      currency: document.querySelector("#storeCurrency").value
    },

    payments: {
      cod: {
        enabled: document.querySelector("#paymentCod").checked,
        label: "Cash on Delivery"
      },
      gcash: {
        enabled: document.querySelector("#paymentGcash").checked,
        label: "GCash",
        merchantName: document.querySelector("#gcashMerchantName").value.trim(),
        accountNumber: document.querySelector("#gcashAccountNumber").value.trim(),
        instructions: document.querySelector("#gcashInstructions").value.trim()
      },
      stripe: {
        enabled: document.querySelector("#paymentStripe").checked,
        label: "Stripe",
        testMode: document.querySelector("#stripeTestMode").checked,
        publicKey: document.querySelector("#stripePublicKey").value.trim(),
        secretKey: document.querySelector("#stripeSecretKey").value.trim()
      },
      paypal: {
        enabled: document.querySelector("#paymentPaypal").checked,
        label: "PayPal",
        testMode: document.querySelector("#paypalTestMode").checked,
        clientId: document.querySelector("#paypalClientId").value.trim(),
        secretKey: document.querySelector("#paypalSecretKey").value.trim()
      },
      bankTransfer: {
        enabled: document.querySelector("#paymentBankTransfer").checked,
        label: "Bank Transfer",
        bankName: document.querySelector("#bankName").value.trim(),
        accountName: document.querySelector("#bankAccountName").value.trim(),
        accountNumber: document.querySelector("#bankAccountNumber").value.trim(),
        instructions: document.querySelector("#bankInstructions").value.trim()
      }
    },

    shipping: {
      defaultFee: Number(document.querySelector("#shippingFee").value) || 0,
      freeShippingMinimum: Number(document.querySelector("#freeShippingMinimum").value) || 0
    },

    orders: {
      defaultStatus: document.querySelector("#defaultOrderStatus").value,
      defaultPaymentStatus: document.querySelector("#defaultPaymentStatus").value
    }
  };
}

function populateSettingsForm(settings) {
  if (!settings) return;

  document.querySelector("#storeName").value = settings.store?.name || "";
  document.querySelector("#storeEmail").value = settings.store?.email || "";
  document.querySelector("#storePhone").value = settings.store?.phone || "";
  document.querySelector("#storeCurrency").value = settings.store?.currency || "PHP";

  document.querySelector("#paymentCod").checked = !!settings.payments?.cod?.enabled;

  document.querySelector("#paymentGcash").checked = !!settings.payments?.gcash?.enabled;
  document.querySelector("#gcashMerchantName").value = settings.payments?.gcash?.merchantName || "";
  document.querySelector("#gcashAccountNumber").value = settings.payments?.gcash?.accountNumber || "";
  document.querySelector("#gcashInstructions").value = settings.payments?.gcash?.instructions || "";

  document.querySelector("#paymentStripe").checked = !!settings.payments?.stripe?.enabled;
  document.querySelector("#stripeTestMode").checked = !!settings.payments?.stripe?.testMode;
  document.querySelector("#stripePublicKey").value = settings.payments?.stripe?.publicKey || "";
  document.querySelector("#stripeSecretKey").value = settings.payments?.stripe?.secretKey || "";

  document.querySelector("#paymentPaypal").checked = !!settings.payments?.paypal?.enabled;
  document.querySelector("#paypalTestMode").checked = !!settings.payments?.paypal?.testMode;
  document.querySelector("#paypalClientId").value = settings.payments?.paypal?.clientId || "";
  document.querySelector("#paypalSecretKey").value = settings.payments?.paypal?.secretKey || "";

  document.querySelector("#paymentBankTransfer").checked = !!settings.payments?.bankTransfer?.enabled;
  document.querySelector("#bankName").value = settings.payments?.bankTransfer?.bankName || "";
  document.querySelector("#bankAccountName").value = settings.payments?.bankTransfer?.accountName || "";
  document.querySelector("#bankAccountNumber").value = settings.payments?.bankTransfer?.accountNumber || "";
  document.querySelector("#bankInstructions").value = settings.payments?.bankTransfer?.instructions || "";

  document.querySelector("#shippingFee").value = settings.shipping?.defaultFee ?? 0;
  document.querySelector("#freeShippingMinimum").value = settings.shipping?.freeShippingMinimum ?? 0;

  document.querySelector("#defaultOrderStatus").value = settings.orders?.defaultStatus || "Pending";
  document.querySelector("#defaultPaymentStatus").value = settings.orders?.defaultPaymentStatus || "Pending";
}

function showSettingsMessage(message, type = "success") {
  let messageBox = document.querySelector("#settingsMessage");

  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.id = "settingsMessage";
    messageBox.className = "admin-settings-message";

    const form = document.querySelector("#adminSettingsForm");
    form.prepend(messageBox);
  }

  messageBox.textContent = message;
  messageBox.dataset.type = type;

  setTimeout(() => {
    messageBox.remove();
  }, 3000);
}

function bindSettingsEvents() {
  const form = document.querySelector("#adminSettingsForm");
  const resetBtn = document.querySelector("#resetSettingsBtn");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const settings = getFormSettings();
    saveSettings(settings);

    showSettingsMessage("Settings saved successfully.");
  });

  resetBtn?.addEventListener("click", () => {
    if (!defaultSettings) return;

    localStorage.removeItem(SETTINGS_KEY);
    populateSettingsForm(defaultSettings);

    showSettingsMessage("Settings reset to default.");
  });
}

async function initAdminSettings() {
  const root = document.querySelector("#adminSettingsPage");
  if (!root) return;

  const htmlResponse = await fetch("../components/admin-settings/admin-settings.html");
  root.innerHTML = await htmlResponse.text();

  defaultSettings = await fetchSettings();
  if (!defaultSettings) return;

  const savedSettings = getSavedSettings();

  const activeSettings = structuredClone(defaultSettings);

  if (savedSettings) {
    activeSettings.store = {
      ...defaultSettings.store,
      ...savedSettings.store
    };

    activeSettings.shipping = {
      ...defaultSettings.shipping,
      ...savedSettings.shipping
    };

    activeSettings.orders = {
      ...defaultSettings.orders,
      ...savedSettings.orders
    };

    activeSettings.payments = {
        cod: {
            ...defaultSettings.payments?.cod,
            ...savedSettings.payments?.cod
        },
        gcash: {
            ...defaultSettings.payments?.gcash,
            ...savedSettings.payments?.gcash
        },
        stripe: {
            ...defaultSettings.payments?.stripe,
            ...savedSettings.payments?.stripe
        },
        paypal: {
            ...defaultSettings.payments?.paypal,
            ...savedSettings.payments?.paypal
        },
        bankTransfer: {
            ...defaultSettings.payments?.bankTransfer,
            ...savedSettings.payments?.bankTransfer
        }
    };
  }

  populateSettingsForm(activeSettings);
  bindSettingsEvents();
}

document.addEventListener("DOMContentLoaded", initAdminSettings);