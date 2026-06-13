
  window.getShoffeeKoDefaultAddress = function () {
  const customer = JSON.parse(
    localStorage.getItem("shoffeeko_current_customer")
  );

  const addresses = JSON.parse(
    localStorage.getItem("shoffeeko_addresses")
  ) || [];

  return addresses.find(
    addr =>
      addr.customerEmail === customer.email &&
      addr.isDefault
  ) || null;
};

