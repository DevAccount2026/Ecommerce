document.addEventListener("DOMContentLoaded", initCustomerAddresses);

async function initCustomerAddresses() {
  const root = document.getElementById("customerAddressesPage");
  if (!root) return;

  const sessionKey = "shoffeeko_current_customer";
  const addressesKey = "shoffeeko_addresses";

  const customer = JSON.parse(localStorage.getItem(sessionKey));

  if (!customer) {
    window.location.href = "cust_login.html";
    return;
  }

  

  let editingAddressId = null;

  function getAddresses() {
    return JSON.parse(localStorage.getItem(addressesKey)) || [];
  }

  function saveAddresses(addresses) {
    localStorage.setItem(addressesKey, JSON.stringify(addresses));
  }

  function normalizeCustomerDefault(addresses) {
    const customerAddresses = addresses.filter(
      addr => addr.customerEmail === customer.email
    );

    if (!customerAddresses.length) return addresses;

    const hasDefault = customerAddresses.some(addr => addr.isDefault);

    if (!hasDefault) {
      const firstCustomerAddressId = customerAddresses[0].id;

      addresses = addresses.map(addr =>
        addr.id === firstCustomerAddressId
          ? { ...addr, isDefault: true }
          : addr
      );
    }

    return addresses;
  }

  window.getShoffeeKoDefaultAddress = function () {
    return getAddresses().find(
      addr => addr.customerEmail === customer.email && addr.isDefault
    ) || null;
  };

  function render(editData = null) {
    let allAddresses = normalizeCustomerDefault(getAddresses());
    saveAddresses(allAddresses);

    const addresses = allAddresses.filter(
      addr => addr.customerEmail === customer.email
    );

    root.innerHTML = `
      <section class="addresses-section sk-container">
        <div class="addresses-header">
          <h1>Saved Addresses</h1>
          <a href="cust_account.html">Back to Account</a>
        </div>

        <div class="addresses-layout">

          <form class="address-form" id="addressForm">
            <h2>${editData ? "Edit Address" : "Add New Address"}</h2>

            <div class="address-row">
              <label>
                First Name
                <input type="text" name="firstName" value="${editData?.firstName || customer.firstName || ""}" required>
              </label>

              <label>
                Last Name
                <input type="text" name="lastName" value="${editData?.lastName || customer.lastName || ""}" required>
              </label>
            </div>

            <label>
              Phone
              <input type="tel" name="phone" value="${editData?.phone || ""}" required>
            </label>

            <label>
              Address
              <input type="text" name="address" value="${editData?.address || ""}" placeholder="Street / Barangay" required>
            </label>

            <div class="address-row">
              <label>
                City
                <input type="text" name="city" value="${editData?.city || ""}" required>
              </label>

              <label>
                Postal Code
                <input type="text" name="postalCode" value="${editData?.postalCode || ""}" required>
              </label>
            </div>

            <label>
              Country
              <input type="text" name="country" value="${editData?.country || "Philippines"}" required>
            </label>

            <label class="address-checkbox">
              <input type="checkbox" name="isDefault" ${editData?.isDefault ? "checked" : ""}>
              Set as default address
            </label>

            <button type="submit">${editData ? "Update Address" : "Save Address"}</button>

            ${
              editData
                ? `<button type="button" class="cancel-edit-btn" id="cancelEditBtn">Cancel Edit</button>`
                : ""
            }
          </form>

          <div class="address-list">
            <h2>Your Addresses</h2>

            ${
              addresses.length
                ? addresses.map(addr => `
                  <article class="address-card ${addr.isDefault ? "is-default" : ""}" data-id="${addr.id}">
                    <div>
                      <h3>${addr.firstName} ${addr.lastName}</h3>
                      <p>${addr.phone}</p>
                      <p>${addr.address}</p>
                      <p>${addr.city}, ${addr.postalCode}</p>
                      <p>${addr.country}</p>
                      ${addr.isDefault ? `<strong>Default Address</strong>` : ""}
                    </div>

                    <div class="address-actions">
                      <button type="button" data-action="edit">Edit</button>
                      <button type="button" data-action="delete">Delete</button>

                      ${
                        !addr.isDefault
                          ? `<button type="button" data-action="default">Set Default</button>`
                          : ""
                      }
                    </div>
                  </article>
                `).join("")
                : `<p class="address-empty">No saved addresses yet.</p>`
            }
          </div>

        </div>
      </section>
    `;

    bindEvents();
  }

  function bindEvents() {
    const form = document.getElementById("addressForm");
    const cancelEditBtn = document.getElementById("cancelEditBtn");

    form?.addEventListener("submit", e => {
      e.preventDefault();

      const formData = new FormData(form);
      let addresses = getAddresses();

      const isDefault = formData.get("isDefault") === "on";

      if (isDefault) {
        addresses = addresses.map(addr =>
          addr.customerEmail === customer.email
            ? { ...addr, isDefault: false }
            : addr
        );
      }

      const addressData = {
        id: editingAddressId || "ADDR-" + Date.now(),
        customerEmail: customer.email,
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        city: formData.get("city"),
        postalCode: formData.get("postalCode"),
        country: formData.get("country"),
        isDefault:
          isDefault ||
          !addresses.some(addr => addr.customerEmail === customer.email)
      };

      if (editingAddressId) {
        addresses = addresses.map(addr =>
          addr.id === editingAddressId ? addressData : addr
        );

        editingAddressId = null;
      } else {
        addresses.push(addressData);
      }

      addresses = normalizeCustomerDefault(addresses);

      saveAddresses(addresses);
      render();
    });

    cancelEditBtn?.addEventListener("click", () => {
      editingAddressId = null;
      render();
    });

    root.querySelectorAll(".address-card button").forEach(button => {
      button.addEventListener("click", () => {
        const card = button.closest(".address-card");
        const id = card.dataset.id;
        const action = button.dataset.action;

        let addresses = getAddresses();

        if (action === "edit") {
          const addressToEdit = addresses.find(addr => addr.id === id);
          if (!addressToEdit) return;

          editingAddressId = id;
          render(addressToEdit);

          window.scrollTo({
            top: root.offsetTop,
            behavior: "smooth"
          });

          return;
        }

        if (action === "delete") {
          const confirmDelete = confirm("Delete this saved address?");
          if (!confirmDelete) return;

          addresses = addresses.filter(addr => addr.id !== id);
          addresses = normalizeCustomerDefault(addresses);
        }

        if (action === "default") {
          addresses = addresses.map(addr =>
            addr.customerEmail === customer.email
              ? { ...addr, isDefault: addr.id === id }
              : addr
          );
        }

        saveAddresses(addresses);
        render();
      });
    });
  }

  render();
}