let currentProduct = null;
let isAddingProduct = false;

async function fetchProductData() {
  const root = document.querySelector("#adminProductDetailPage");
  const apiUrl = root?.dataset.api;

  if (!root || !apiUrl) return [];

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch product data");

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error("Product Detail API Error:", error);
    return [];
  }
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function isAddMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("add") === "true";
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(amount);
}

function generateProductId(products) {
  const numbers = products
    .map(product => Number(String(product.id).replace("PROD-", "")))
    .filter(number => !Number.isNaN(number));

  const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;

  return `PROD-${String(nextNumber).padStart(3, "0")}`;
}

function renderProductDetail(product) {
  if (!product) {
    document.querySelector("#adminProductDetailPage").innerHTML = `
      <div class="admin-panel" style="padding:24px;">
        Product not found.
      </div>
    `;
    return;
  }

  currentProduct = product;

  document.querySelector("#detailProductName").textContent = product.name;
  document.querySelector("#detailProductImage").src = product.image;
  document.querySelector("#detailProductImage").alt = product.name;
  document.querySelector("#detailProductId").textContent = product.id;
  document.querySelector("#detailProductCategory").textContent = product.category;
  document.querySelector("#detailProductPrice").textContent = formatCurrency(product.price);
  document.querySelector("#detailProductStock").textContent = product.stock;
  document.querySelector("#detailProductStatus").textContent = product.status;
  document.querySelector("#detailProductDescription").textContent =
    product.description || "No description available yet.";
}

function openProductEditor() {
  if (!currentProduct && !isAddingProduct) return;

  const submitBtn =
  document.querySelector("#productEditorSubmitBtn");

  if (submitBtn) {
    submitBtn.textContent = isAddingProduct
      ? "Add Product"
      : "Save Changes";
  }

  const title = document.querySelector("#productEditorTitle");

    if (title) {
      title.textContent = isAddingProduct
        ? "Add Product"
        : "Edit Product";
    }

 /* document.querySelector("#editProductName").value = currentProduct?.name || "";
  document.querySelector("#editProductCategory").value = currentProduct?.category || "Arabica";
  document.querySelector("#editProductPrice").value = currentProduct?.price || "";
  document.querySelector("#editProductStock").value = currentProduct?.stock || "";
  document.querySelector("#editProductStatus").value = currentProduct?.status || "Active";
  document.querySelector("#editProductDescription").value =
    currentProduct?.description || "";*/

  const previewImage = document.querySelector("#editProductImagePreview");

  if (previewImage) {
    previewImage.src = currentProduct?.image || "";
  }

  document.querySelector("#productEditorModal").classList.add("is-open");
  document.querySelector("#productEditorModal").setAttribute("aria-hidden", "false");
}

function closeProductEditor() {
  document.querySelector("#productEditorModal").classList.remove("is-open");
  document.querySelector("#productEditorModal").setAttribute("aria-hidden", "true");
}


function getAutoStatus(stock) {
  const quantity = Number(stock);

  if (quantity <= 0) return "Out of Stock";
  if (quantity <= 10) return "Low Stock";
  return "Active";
}

async function handleProductEditorSubmit(event) {
  event.preventDefault();

  const name = document.querySelector("#editProductName").value.trim();
  const previewImage = document.querySelector("#editProductImagePreview");

  const price = Number(
    document.querySelector("#editProductPrice").value.replace(/[^\d.]/g, "")
  );

  const stock = Number(
    document.querySelector("#editProductStock").value.replace(/[^\d]/g, "")
  );
  

  if (!name) {
    alert("Please enter a product name.");
    return;
  }

  if (!price || price <= 0) {
    alert("Please enter a valid product price.");
    return;
  }

  if (Number.isNaN(stock) || stock < 0) {
    alert("Please enter a valid stock quantity.");
    return;
  }

  if (isAddingProduct && !previewImage?.src) {
    alert("Please upload a product image.");
    return;
  }

  let products =
    JSON.parse(localStorage.getItem("adminProducts")) ||
    await fetchProductData();

  if (isAddingProduct) {
    const newProduct = {
      id: generateProductId(products),
      name: document.querySelector("#editProductName").value.trim(),
      title: document.querySelector("#editProductName").value.trim(),
      category: document.querySelector("#editProductCategory").value,
      price: price,
      stock: stock,
      status: getAutoStatus(stock),
      description: document.querySelector("#editProductDescription").value.trim(),
      image: previewImage?.src || "",
      hasOptions: false
    };

   products.push(newProduct);

    try {
      localStorage.setItem("adminProducts", JSON.stringify(products));

      alert("New product added locally.");
      window.location.href = "admin-products.html";
      return;

    } catch (error) {
      console.error("LocalStorage save failed:", error);
      alert("Product image is too large. Please upload a smaller image.");
      return;
    }
  }
  if (!currentProduct) return;

  currentProduct.name = document.querySelector("#editProductName").value.trim();
  currentProduct.title = currentProduct.name;
  currentProduct.category = document.querySelector("#editProductCategory").value;
  currentProduct.status = document.querySelector("#editProductStatus").value;
  currentProduct.description = document.querySelector("#editProductDescription").value.trim();

  currentProduct.price = price;
  currentProduct.stock = stock;

  if (previewImage?.src) {
    currentProduct.image = previewImage.src;
  }

  products = products.map(product =>
    product.id === currentProduct.id
      ? currentProduct
      : product
  );

  localStorage.setItem("adminProducts", JSON.stringify(products));

  renderProductDetail(currentProduct);
  closeProductEditor();

  alert("Product saved locally.");
}

async function initProductDetailPage() {
  const root = document.querySelector("#adminProductDetailPage");
  if (!root) return;

  const htmlResponse = await fetch("../components/admin-product-detail/admin-product-detail.html");
  root.innerHTML = await htmlResponse.text();

  const productId = getProductIdFromUrl();

  let products =
    JSON.parse(localStorage.getItem("adminProducts")) ||
    await fetchProductData();

  const params = new URLSearchParams(window.location.search);

  if (isAddMode()) {
    isAddingProduct = true;
    currentProduct = null;

    document.querySelector("#detailProductName").textContent = "Add Product";
    document.querySelector("#detailProductImage").src = "";
    document.querySelector("#detailProductImage").alt = "New product";
    document.querySelector("#detailProductId").textContent = "New";
    document.querySelector("#detailProductCategory").textContent = "-";
    document.querySelector("#detailProductPrice").textContent = "-";
    document.querySelector("#detailProductStock").textContent = "-";
    document.querySelector("#detailProductStatus").textContent = "-";
    document.querySelector("#detailProductDescription").textContent =
      "Fill out the form to create a new product.";

    setTimeout(() => {
      openProductEditor();
    }, 100);
  } else {
     isAddingProduct = false;

    const product = products.find(item => item.id === productId);
    renderProductDetail(product);

    if (params.get("edit") === "true") {
      setTimeout(() => {
        openProductEditor();
      }, 100);
    }
  }

 
  document.querySelector("#closeProductEditor")?.addEventListener("click", closeProductEditor);
  document.querySelector("#cancelProductEditor")?.addEventListener("click", closeProductEditor);
  document.querySelector("#productEditorForm")?.addEventListener("submit", handleProductEditorSubmit);

  document.querySelector("#editProductBtn")?.addEventListener("click", () => {
    isAddingProduct = false;
    openProductEditor();
  });

  document.querySelector("#productEditorModal")?.addEventListener("click", event => {
    if (event.target.id === "productEditorModal") {
      closeProductEditor();
    }
  });

  document.querySelector("#changeProductImageBtn")?.addEventListener("click", () => {
    document.querySelector("#editProductImage").click();
  });
  
}

document.addEventListener("change", event => {
  if (event.target.id !== "editProductImage") return;

  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    document.querySelector("#editProductImagePreview").src = e.target.result;
  };

  reader.readAsDataURL(file);
});

document.addEventListener("DOMContentLoaded", initProductDetailPage);