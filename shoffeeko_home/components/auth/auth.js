document.addEventListener("DOMContentLoaded", initAuth);

const CUSTOMER_KEY = "shoffeeko_customers";
const SESSION_KEY = "shoffeeko_current_customer";

function getCustomers() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCustomers(customers) {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customers));
}

function saveSession(customer) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(customer));
}

function initAuth() {
  const registerForm = document.querySelector("#registerForm");
  const loginForm = document.querySelector("#loginForm");

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
}

function handleRegister(event) {
  event.preventDefault();

  const firstName = document.querySelector("#firstName").value.trim();
  const lastName = document.querySelector("#lastName").value.trim();
  const email = document.querySelector("#registerEmail").value.trim().toLowerCase();
  const password = document.querySelector("#registerPassword").value.trim();

  const customers = getCustomers();

  const existingCustomer = customers.find(customer => customer.email === email);

  if (existingCustomer) {
    alert("This email is already registered. Please login instead.");
    return;
  }

  const customer = {
    id: `CUST-${Date.now()}`,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email,
    password,
    createdAt: new Date().toISOString()
  };

  customers.push(customer);
  saveCustomers(customers);
  saveSession(customer);

  window.location.href = "cust_account.html";
}

function handleLogin(event) {
  event.preventDefault();

  const email = document.querySelector("#loginEmail").value.trim().toLowerCase();
  const password = document.querySelector("#loginPassword").value.trim();

  const customers = getCustomers();

  const customer = customers.find(customer => {
    return customer.email === email && customer.password === password;
  });

  if (!customer) {
    alert("Invalid email or password");
    return;
  }

  saveSession(customer);

  window.location.href = "cust_account.html";
}