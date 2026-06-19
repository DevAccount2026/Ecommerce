document.addEventListener("DOMContentLoaded", initCheckoutPage);

const ADMIN_PRODUCTS_KEY = "adminProducts";
const CART_KEY = "shoffeeko_cart";
const INVENTORY_LOG_KEY = "shoffeeko_inventory_logs";

function getAdminProducts() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY)) || [];
  } catch (error) {
    console.error("Admin products are broken:", error);
    return [];
  }
}

function saveAdminProducts(products) {
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
}

function getInventoryLogs() {
  try {
    return JSON.parse(localStorage.getItem(INVENTORY_LOG_KEY)) || [];
  } catch (error) {
    console.error("Inventory logs are broken:", error);
    return [];
  }
}

function saveInventoryLogs(logs) {
  localStorage.setItem(INVENTORY_LOG_KEY, JSON.stringify(logs));
}

function addInventoryLog(log) {
  const logs = getInventoryLogs();

  logs.unshift({
    id: "INV-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString(),
    ...log
  });

  saveInventoryLogs(logs);
}

function deductInventoryFromOrder(orderItems = [], orderId = "") {
  const products = getAdminProducts();
  const logsToAdd = [];

  const updatedProducts = products.map(product => {
    const orderedItem = orderItems.find(item => String(item.id) === String(product.id));

    if (!orderedItem) return product;

    const currentStock = Number(product.stock || 0);
    const quantityBought = Number(orderedItem.quantity || 1);
    const newStock = Math.max(currentStock - quantityBought, 0);

    logsToAdd.push({
      id: "INV-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      productId: product.id,
      sku: product.sku || product.id,
      productName: product.name || product.title || orderedItem.title || "Unnamed Product",
      type: "Deduction",
      quantity: -quantityBought,
      previousStock: currentStock,
      newStock,
      reason: orderId ? `Order ${orderId}` : "Customer order"
    });

    return {
      ...product,
      stock: newStock,
      status: newStock <= 0 ? "Inactive" : product.status
    };
  });

  saveAdminProducts(updatedProducts);

  if (logsToAdd.length) {
    const logs = getInventoryLogs();
    saveInventoryLogs([...logsToAdd, ...logs]);
  }
}

async function initCheckoutPage() {
  const root = document.getElementById("checkoutPage");
  if (!root) return;

  const response = await fetch("../components/checkout-page/checkout-page.json");
  const data = await response.json();
  const settings = data.settings || {};

  const cartKey = settings.cartKey || "shoffeeko_cart";
  const ordersKey = settings.ordersKey || "shoffeeko_orders";
  const customerKey = "shoffeeko_current_customer";
  const addressesKey = "shoffeeko_addresses";

  const settingsKey = "shoffeeko_settings";

const defaultPaymentSettings = {
  cod: {
    enabled: true,
    label: "Cash on Delivery"
  },
  gcash: {
    enabled: false,
    label: "GCash"
  },
  stripe: {
    enabled: false,
    label: "Stripe"
  },
  paypal: {
    enabled: false,
    label: "PayPal"
  },
  bankTransfer: {
    enabled: false,
    label: "Bank Transfer"
  }
};

const paymentLabels = {
  cod: "Cash on Delivery",
  gcash: "GCash",
  stripe: "Stripe",
  paypal: "PayPal",
  bankTransfer: "Bank Transfer"
};

const savedStoreSettings =
  JSON.parse(localStorage.getItem(settingsKey)) || {};

const savedPayments = savedStoreSettings.payments || {};

const payments = {
  cod: {
    ...defaultPaymentSettings.cod,
    ...savedPayments.cod
  },
  gcash: {
    ...defaultPaymentSettings.gcash,
    ...savedPayments.gcash
  },
  stripe: {
    ...defaultPaymentSettings.stripe,
    ...savedPayments.stripe
  },
  paypal: {
    ...defaultPaymentSettings.paypal,
    ...savedPayments.paypal
  },
  bankTransfer: {
    ...defaultPaymentSettings.bankTransfer,
    ...savedPayments.bankTransfer
  }
};

const paymentDescriptions = {
  cod: "Pay when your order arrives.",
  gcash: "Pay using your GCash wallet.",
  stripe: "Pay securely using credit/debit card via Stripe.",
  paypal: "Pay securely using your PayPal account.",
  
  bankTransfer: "Pay directly through bank transfer."
};

function getPaymentInstructionHTML(key, payment) {
  if (key === "gcash") {
    return `
      <div class="payment-instructions" data-payment-instruction="${key}">
        <h3>GCash Payment Instructions</h3>
        <p><strong>Merchant Name:</strong> ${payment.merchantName || "Not set"}</p>
        <p><strong>GCash Number:</strong> ${payment.accountNumber || "Not set"}</p>
        <p>${payment.instructions || "Please send your payment using the GCash details above."}</p>
      </div>
    `;
  }

  if (key === "bankTransfer") {
    return `
      <div class="payment-instructions" data-payment-instruction="${key}">
        <h3>Bank Transfer Instructions</h3>
        <p><strong>Bank Name:</strong> ${payment.bankName || "Not set"}</p>
        <p><strong>Account Name:</strong> ${payment.accountName || "Not set"}</p>
        <p><strong>Account Number:</strong> ${payment.accountNumber || "Not set"}</p>
        <p>${payment.instructions || "Please transfer your payment using the bank details above."}</p>
      </div>
    `;
  }

  return "";
}




const enabledPayments = Object.entries(payments)
  .filter(([_, payment]) => payment.enabled === true);
  
/*const enabledPayments = Object.entries(adminSettings.payments || {})
  .filter(([key, payment]) => payment?.enabled); */

  const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
  const customer = JSON.parse(localStorage.getItem(customerKey));
  const allAddresses = JSON.parse(localStorage.getItem(addressesKey)) || [];

  const customerAddresses = customer
    ? allAddresses.filter(addr => addr.customerEmail === customer.email)
    : [];

  const defaultAddress =
    customerAddresses.find(addr => addr.isDefault) ||
    customerAddresses[0] ||
    null;

  if (!cart.length) {
    root.innerHTML = `
      <section class="checkout-empty sk-container">
        <h1>Your cart is empty</h1>
        <a href="catalog-page.html">Continue Shopping</a>
      </section>
    `;
    return;
  }

  const subtotal = cart.reduce((sum, item) => {
    return sum + parsePrice(item.price) * Number(item.quantity || 1);
  }, 0);

  function parsePrice(price) {
    if (typeof price === "number") return price;

    return Number(
      String(price)
        .replace("From", "")
        .replace("USD", "")
        .replace("$", "")
        .trim()
    ) || 0;
  }

  function formatPrice(value) {
    return `$${Number(value || 0).toFixed(2)} ${settings.currency || "USD"}`;
  }

  function safeValue(value) {
    return value || "";
  }

  root.innerHTML = `
    <section class="checkout-section sk-container">

      <h1>${settings.title}</h1>

      <div class="checkout-layout">

        <form class="checkout-form" id="checkoutForm">

          <div class="checkout-card">
            <h2>${settings.contactTitle}</h2>

            <label>
              Email
              <input
                type="email"
                name="email"
                value="${safeValue(customer?.email)}"
                ${customer ? "readonly" : ""}
                required
              >
            </label>

            <label>
              Phone
              <input type="tel" name="phone" value="${safeValue(defaultAddress?.phone)}" required>
            </label>
          </div>

          <div class="checkout-card">
            <h2>${settings.shippingTitle}</h2>

            ${
              customerAddresses.length
                ? `
                  <label>
                    Saved Addresses
                    <select id="savedAddressSelect">
                      ${customerAddresses.map(addr => `
                        <option value="${addr.id}" ${addr.id === defaultAddress?.id ? "selected" : ""}>
                          ${addr.address}, ${addr.city} ${addr.isDefault ? "(Default)" : ""}
                        </option>
                      `).join("")}
                    </select>
                  </label>
                `
                : `
                  <p class="checkout-note">
                    No saved address found. You can enter a shipping address manually.
                  </p>
                `
            }

            <div class="checkout-row">
              <label>
                First Name
                <input type="text" name="firstName" value="${safeValue(defaultAddress?.firstName || customer?.firstName)}" required>
              </label>

              <label>
                Last Name
                <input type="text" name="lastName" value="${safeValue(defaultAddress?.lastName || customer?.lastName)}" required>
              </label>
            </div>

            <label>
              Address
              <input type="text" name="address" value="${safeValue(defaultAddress?.address)}" required>
            </label>

            <div class="checkout-row">
              <label>
                City
                <input type="text" name="city" value="${safeValue(defaultAddress?.city)}" required>
              </label>

              <label>
                Postal Code
                <input type="text" name="postalCode" value="${safeValue(defaultAddress?.postalCode)}" required>
              </label>
            </div>

            <label>
              Country
              <input type="text" name="country" value="${safeValue(defaultAddress?.country || "Philippines")}" required>
            </label>
          </div>
         
          <div class="checkout-card">
            <h2>Payment Method</h2>

            ${
              enabledPayments.length
                ? `
                  ${enabledPayments.map(([key, payment], index) => `
                    <label class="payment-option">
                      <div class="payment-option__left">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="${key}"
                          data-label="${payment.label || paymentLabels[key]}"
                          ${index === 0 ? "checked" : ""}
                          required
                        >
                        <span>${payment.label || paymentLabels[key]}</span>
                        <small>${paymentDescriptions[key] || ""}</small>
                      </div>
                    </label>
                  `).join("")}

                 <div id="paymentInstructionsWrap">
                  ${enabledPayments.map(([key, payment]) => getPaymentInstructionHTML(key, payment)).join("")}
                </div>

                <div class="payment-proof-upload" id="paymentProofUpload" style="display:none;">
                  <h3>Upload Payment Proof</h3>
                  <p>Please upload your payment screenshot or receipt.</p>

                  <input
                    type="file"
                    id="paymentProofInput"
                    accept="image/*"
                  >

                  <img id="paymentProofPreview" alt="Payment proof preview" style="display:none;">
                </div>
                `
                : `
                  <p class="checkout-note">
                    No payment methods are currently available. Please contact store support.
                  </p>
                `
            }
          </div>

          <button class="checkout-submit" type="submit">
            ${settings.placeOrderText}
          </button>

          

          <a class="checkout-return" href="cart.html">
            ${settings.returnToCartText}
          </a>

        </form>

        <aside class="checkout-summary">
          <h2>${settings.summaryTitle}</h2>

          <div class="checkout-items">
            ${cart.map(item => `
              <div class="checkout-item">
                <img src="${item.image}" alt="${item.title}">
                <div>
                  <h3>${item.title}</h3>
                  <p>Qty: ${item.quantity}</p>
                </div>
                <strong>${formatPrice(parsePrice(item.price) * Number(item.quantity || 1))}</strong>
              </div>
            `).join("")}
          </div>

          <div class="checkout-total">
            <span>Subtotal</span>
            <strong>${formatPrice(subtotal)}</strong>
          </div>

          <p class="checkout-note">
            Payment integration will be added later. This version saves the order locally.
          </p>
        </aside>

      </div>
    </section>
  `;

  const form = document.getElementById("checkoutForm");
  const savedAddressSelect = document.getElementById("savedAddressSelect");

    function updatePaymentInstructions() {
      const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked')?.value;
      const proofUpload = document.querySelector("#paymentProofUpload");
      const proofInput = document.querySelector("#paymentProofInput");

      document.querySelectorAll("[data-payment-instruction]").forEach(box => {
        box.style.display =
          box.dataset.paymentInstruction === selectedPayment ? "block" : "none";
      });

      const needsProof = ["gcash", "bankTransfer"].includes(selectedPayment);

      if (proofUpload) {
        proofUpload.style.display = needsProof ? "block" : "none";
      }

      if (proofInput) {
        proofInput.required = needsProof;
      }
    }

    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
      input.addEventListener("change", updatePaymentInstructions);
    });

    let paymentProofData = null;

    const paymentProofInput = document.querySelector("#paymentProofInput");
    const paymentProofPreview = document.querySelector("#paymentProofPreview");

    paymentProofInput?.addEventListener("change", e => {
      const file = e.target.files[0];

      if (!file) {
        paymentProofData = null;
        paymentProofPreview.style.display = "none";
        paymentProofPreview.src = "";
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        paymentProofData = reader.result;
        paymentProofPreview.src = paymentProofData;
        paymentProofPreview.style.display = "block";
      };

      reader.readAsDataURL(file);
    });

      updatePaymentInstructions();            


  function fillAddressForm(address) {
    if (!address) return;

    form.elements.email.value = address.customerEmail || customer?.email || "";
    form.elements.phone.value = address.phone || "";
    form.elements.firstName.value = address.firstName || "";
    form.elements.lastName.value = address.lastName || "";
    form.elements.address.value = address.address || "";
    form.elements.city.value = address.city || "";
    form.elements.postalCode.value = address.postalCode || "";
    form.elements.country.value = address.country || "Philippines";
  }

  savedAddressSelect?.addEventListener("change", e => {
    const selectedAddress = customerAddresses.find(
      addr => addr.id === e.target.value
    );

    fillAddressForm(selectedAddress);
  });

  form.addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(form);

    const selectedPaymentInput = document.querySelector('input[name="paymentMethod"]:checked');

    const selectedPaymentMethod = selectedPaymentInput?.value || "";
    const selectedPaymentLabel = selectedPaymentInput?.dataset.label || selectedPaymentMethod;

    const automaticPaymentMethods = ["stripe", "paypal"];

    const isAutomaticPayment = automaticPaymentMethods.includes(selectedPaymentMethod);

    const manualProofMethods = ["gcash", "bankTransfer"];
    const requiresPaymentProof = manualProofMethods.includes(selectedPaymentMethod);

    if (requiresPaymentProof && !paymentProofData) {
      alert("Please upload your payment proof before placing your order.");
      return;
    }

    const order = {
      id: "SK-" + Date.now(),
      createdAt: new Date().toISOString(),
      customerEmail: customer?.email || formData.get("email"),
      customer: Object.fromEntries(formData.entries()),
      selectedAddressId: savedAddressSelect?.value || null,
      
      subtotal,
      paymentMethod: selectedPaymentMethod,
      paymentLabel: selectedPaymentLabel,
      paymentDetails: payments[selectedPaymentMethod] || null,
      paymentProof: paymentProofData,
      paymentProofUploadedAt: paymentProofData ? new Date().toISOString() : null,

      paymentType: isAutomaticPayment ? "automatic" : "manual",
      paymentStatus: isAutomaticPayment ? "Pending Payment" : "Pending Verification",
      gatewayStatus: isAutomaticPayment ? "awaiting_gateway" : "manual_verification",
      transactionId: null,
      paidAt: null,

      orderStatus: "Pending",
   

      items: cart.map(item => ({
        id: item.id,
        sku: item.sku,
        title: item.title || item.name,
        category: item.category || "Uncategorized",
        price: parsePrice(item.price),
        quantity: Number(item.quantity || 1),
        image: item.image
      }))

          
    };

    const orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    orders.push(order);

    localStorage.setItem(ordersKey, JSON.stringify(orders));

    deductInventoryFromOrder(order.items || [], order.id);

    localStorage.removeItem(cartKey);

    window.location.href = `order-confirmation.html?id=${order.id}`;
  });
}