const productGrid = document.querySelector("#product-grid");
const productTemplate = document.querySelector("#product-template");
const categorySelect = document.querySelector("#category");
const sortSelect = document.querySelector("#sort");
const searchInput = document.querySelector("#search");
const resultsCount = document.querySelector("#results-count");

let products = [];

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
});

init();

async function init() {
  try {
    const response = await fetch("./products.json");
    if (!response.ok) {
      throw new Error("No se pudo cargar el catalogo JSON.");
    }

    products = await response.json();
    populateCategories(products);
    renderProducts();
    bindEvents();
  } catch (error) {
    productGrid.innerHTML = `<div class="empty-catalog">${error.message}</div>`;
    resultsCount.textContent = "No fue posible cargar los productos.";
  }
}

function bindEvents() {
  searchInput.addEventListener("input", renderProducts);
  categorySelect.addEventListener("change", renderProducts);
  sortSelect.addEventListener("change", renderProducts);
}

function populateCategories(items) {
  const categories = [...new Set(items.map((product) => product.category))].sort();

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });
}

function renderProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categorySelect.value;
  const selectedSort = sortSelect.value;

  let filtered = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const haystack = `${product.name} ${product.description} ${product.category} ${product.compatibility || ""} ${product.format || ""}`.toLowerCase();
    return matchesCategory && haystack.includes(searchTerm);
  });

  filtered = sortProducts(filtered, selectedSort);

  if (!filtered.length) {
    productGrid.innerHTML = `
      <div class="empty-catalog">
        <h3>No encontramos recursos con ese filtro.</h3>
        <p>Proba otra busqueda o cambia la categoria seleccionada.</p>
      </div>
    `;
    resultsCount.textContent = "0 resultados";
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach((product) => {
    const node = productTemplate.content.cloneNode(true);
    const card = node.querySelector(".product-card");
    const cover = node.querySelector(".product-cover");

    cover.style.background = `linear-gradient(135deg, ${product.accent[0]}, ${product.accent[1]})`;
    node.querySelector(".product-code").textContent = product.code;
    node.querySelector(".product-badge").textContent = product.badge;
    node.querySelector(".product-category").textContent = product.category;
    node.querySelector(".product-title").textContent = product.name;
    node.querySelector(".product-description").textContent = product.description;
    node.querySelector(".product-price").textContent = money.format(product.price);
    node.querySelector(".product-stock").textContent = product.delivery || product.format || "Disponible en itch.io";

    card.dataset.category = product.category;
    card.dataset.id = product.id;
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `Ver detalle de ${product.name}`);
    card.addEventListener("click", () => goToProduct(product.id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goToProduct(product.id);
      }
    });

    const button = node.querySelector(".buy-product");
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      window.open(product.buyUrl || "https://itch.io/", "_blank", "noopener,noreferrer");
    });

    fragment.append(node);
  });

  productGrid.innerHTML = "";
  productGrid.append(fragment);
  resultsCount.textContent = `${filtered.length} resultado(s)`;
}

function sortProducts(items, mode) {
  const sorted = [...items];

  switch (mode) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

function goToProduct(productId) {
  window.location.href = `detalle.html?id=${productId}`;
}
