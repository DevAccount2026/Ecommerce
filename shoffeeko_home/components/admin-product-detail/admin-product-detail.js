let currentProduct = null;

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

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(amount);
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
  if (!currentProduct) return;

  document.querySelector("#editProductName").value = currentProduct.name;
  document.querySelector("#editProductCategory").value = currentProduct.category;
  document.querySelector("#editProductPrice").value = currentProduct.price;
  document.querySelector("#editProductStock").value = currentProduct.stock;
  document.querySelector("#editProductStatus").value = currentProduct.status;
  document.querySelector("#editProductDescription").value =
    currentProduct.description || "";

  document.querySelector("#productEditorModal").classList.add("is-open");
  document.querySelector("#productEditorModal").setAttribute("aria-hidden", "false");

  document.querySelector("#editProductImagePreview").src = currentProduct.image;

  }

function closeProductEditor() {
  document.querySelector("#productEditorModal").classList.remove("is-open");
  document.querySelector("#productEditorModal").setAttribute("aria-hidden", "true");
}

async function handleProductEditorSubmit(event) {
  event.preventDefault();

  if (!currentProduct) return;

  currentProduct.name = document.querySelector("#editProductName").value.trim();
  currentProduct.category = document.querySelector("#editProductCategory").value;
  currentProduct.price = Number(document.querySelector("#editProductPrice").value);
  currentProduct.stock = Number(document.querySelector("#editProductStock").value);
  currentProduct.status = document.querySelector("#editProductStatus").value;
  currentProduct.description = document.querySelector("#editProductDescription").value.trim();

  const previewImage = document.querySelector("#editProductImagePreview");

  if (previewImage?.src) {
    currentProduct.image = previewImage.src;
  }

  let products =
    JSON.parse(localStorage.getItem("adminProducts")) ||
    await fetchProductData();

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

  const product = products.find(item => item.id === productId);

  renderProductDetail(product);

  const params = new URLSearchParams(window.location.search);

  if (params.get("edit") === "true") {
    setTimeout(() => {
      openProductEditor();
    }, 100);
  }

  document.querySelector("#editProductBtn")?.addEventListener("click", openProductEditor);
  document.querySelector("#closeProductEditor")?.addEventListener("click", closeProductEditor);
  document.querySelector("#cancelProductEditor")?.addEventListener("click", closeProductEditor);
  document.querySelector("#productEditorForm")?.addEventListener("submit", handleProductEditorSubmit);

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
    document.querySelector(
      "#editProductImagePreview"
    ).src = e.target.result;
  };

  reader.readAsDataURL(file);
});

document.addEventListener("DOMContentLoaded", initProductDetailPage);