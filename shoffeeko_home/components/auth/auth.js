document.addEventListener("DOMContentLoaded", initAuth);

async function initAuth() {

  const response = await fetch("../components/auth/auth.json");
  const config = await response.json();

  const customerKey =
    config.settings.customerStorageKey;

  const sessionKey =
    config.settings.sessionStorageKey;

  const registerForm =
    document.getElementById("registerForm");

  const loginForm =
    document.getElementById("loginForm");

  if (registerForm) {

    registerForm.addEventListener("submit", e => {

      e.preventDefault();

      const customers =
        JSON.parse(
          localStorage.getItem(customerKey)
        ) || [];

      const customer = {
        id: "CUST-" + Date.now(),
        firstName:
          document.getElementById("firstName").value,
        lastName:
          document.getElementById("lastName").value,
        email:
          document.getElementById("registerEmail").value,
        password:
          document.getElementById("registerPassword").value
      };

      customers.push(customer);

      localStorage.setItem(
        customerKey,
        JSON.stringify(customers)
      );

      localStorage.setItem(
        sessionKey,
        JSON.stringify(customer)
      );

      window.location.href =
        "cust_account.html";
    });

  }

  if (loginForm) {

    loginForm.addEventListener("submit", e => {

      e.preventDefault();

      const email =
        document.getElementById("loginEmail").value;

      const password =
        document.getElementById("loginPassword").value;

      const customers =
        JSON.parse(
          localStorage.getItem(customerKey)
        ) || [];

      const customer =
        customers.find(c =>
          c.email === email &&
          c.password === password
        );

      if (!customer) {
        alert("Invalid email or password");
        return;
      }

      localStorage.setItem(
        sessionKey,
        JSON.stringify(customer)
      );

      window.location.href =
        "cust_account.html";
    });

  }
}