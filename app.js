import { loadProducts } from "./products-api.js";

const productGrid = document.querySelector("#product-grid");
const productTemplate = document.querySelector("#product-template");
const categorySelect = document.querySelector("#category");
const sortSelect = document.querySelector("#sort");
const searchInput = document.querySelector("#search");
const resultsCount = document.querySelector("#results-count");
const heroSpotlight = document.querySelector("#hero-spotlight");
const statProducts = document.querySelector("#stat-products");
const statCategories = document.querySelector("#stat-categories");
const statFeatured = document.querySelector("#stat-featured");
const categoryPills = document.querySelector("#category-pills");

const DEFAULT_STORE_URL = "https://proyesy.itch.io/";
const BRAND_NEON_START = "#1fe5ff";
const BRAND_NEON_END = "#2b7bff";
const BRAND_NEON_SOFT = "#bff9ff";

let products = [];
let eventsBound = false;
let isRefreshing = false;
let showcaseEffectsInitialized = false;

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
});

init();
window.addEventListener("pageshow", handlePageShow);

async function init() {
  initShowcaseEffects();
  bindEvents();
  await refreshProducts();
}

async function handlePageShow(event) {
  if (!event.persisted) {
    return;
  }

  await refreshProducts();
}

async function refreshProducts() {
  if (isRefreshing) {
    return;
  }

  isRefreshing = true;
  const selectedCategory = categorySelect.value;

  try {
    products = await loadProducts("No se pudo cargar el catalogo JSON.");
    populateCategories(products, selectedCategory);
    renderCategoryPills(products);
    renderStoreSummary(products);
    renderHeroSpotlight(products);
    renderProducts();
  } catch (error) {
    if (heroSpotlight) {
      heroSpotlight.innerHTML = `<div class="spotlight-empty">${error.message}</div>`;
    }
    productGrid.innerHTML = `<div class="empty-catalog">${error.message}</div>`;
    resultsCount.textContent = "No fue posible cargar los productos.";
  } finally {
    isRefreshing = false;
  }
}

function bindEvents() {
  if (eventsBound) {
    return;
  }

  searchInput.addEventListener("input", renderProducts);
  categorySelect.addEventListener("change", renderProducts);
  sortSelect.addEventListener("change", renderProducts);
  if (categoryPills) {
    categoryPills.addEventListener("click", handleCategoryPillClick);
  }

  eventsBound = true;
}

function populateCategories(items, selectedCategory = "all") {
  const categories = [...new Set(items.map((product) => product.category))].sort((left, right) => left.localeCompare(right));
  const nextSelectedCategory = categories.includes(selectedCategory) ? selectedCategory : "all";

  categorySelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "Todas";
  categorySelect.append(defaultOption);

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });

  categorySelect.value = nextSelectedCategory;
}

function renderCategoryPills(items) {
  if (!categoryPills) {
    return;
  }

  const counts = new Map();

  items.forEach((product) => {
    counts.set(product.category, (counts.get(product.category) || 0) + 1);
  });

  categoryPills.innerHTML = "";
  categoryPills.append(createCategoryPill("Todas", "all", items.length));

  [...counts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .forEach(([category, total]) => {
      categoryPills.append(createCategoryPill(category, category, total));
    });

  syncCategoryPills();
}

function createCategoryPill(label, category, total) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "category-pill";
  button.dataset.category = category;

  const text = document.createElement("span");
  text.textContent = label;

  const count = document.createElement("small");
  count.textContent = String(total);

  button.append(text, count);
  return button;
}

function handleCategoryPillClick(event) {
  const pill = event.target.closest(".category-pill");

  if (!pill) {
    return;
  }

  categorySelect.value = pill.dataset.category || "all";
  renderProducts();
}

function syncCategoryPills() {
  if (!categoryPills) {
    return;
  }

  categoryPills
    .querySelectorAll(".category-pill")
    .forEach((pill) => pill.classList.toggle("is-active", pill.dataset.category === categorySelect.value));
}

function renderStoreSummary(items) {
  if (!statProducts || !statCategories || !statFeatured) {
    return;
  }

  const categories = new Set(items.map((product) => product.category));
  const featuredCount = items.filter((product) => product.featured).length;

  statProducts.textContent = formatMetric(items.length);
  statCategories.textContent = formatMetric(categories.size);
  statFeatured.textContent = formatMetric(featuredCount);
}

function renderHeroSpotlight(items) {
  if (!heroSpotlight) {
    return;
  }

  heroSpotlight.innerHTML = "";

  if (!items.length) {
    heroSpotlight.innerHTML = `<div class="spotlight-empty">Todavia no hay productos publicados.</div>`;
    return;
  }

  const product = items.find((item) => item.featured) || items[0];
  const image = getPrimaryImage(product);
  const media = document.createElement("div");
  const content = document.createElement("div");
  const label = document.createElement("p");
  const title = document.createElement("h2");
  const description = document.createElement("p");
  const tags = document.createElement("div");
  const footer = document.createElement("div");
  const price = document.createElement("strong");
  const actions = document.createElement("div");
  const detailLink = document.createElement("a");
  const buyLink = document.createElement("a");

  heroSpotlight.style.setProperty("--spotlight-accent", BRAND_NEON_START);
  heroSpotlight.style.setProperty("--spotlight-accent-2", BRAND_NEON_END);

  media.className = "spotlight-media";
  content.className = "spotlight-content";
  label.className = "spotlight-label";
  title.className = "spotlight-title";
  description.className = "spotlight-description";
  tags.className = "spotlight-tags";
  footer.className = "spotlight-footer";
  price.className = "spotlight-price";
  actions.className = "spotlight-actions";

  if (image?.src) {
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt || `Vista previa de ${product.name}`;
    img.addEventListener("error", () => {
      media.innerHTML = "";
      media.classList.add("is-fallback");
      media.textContent = product.code || product.badge || "PRO";
    });
    media.append(img);
  } else {
    media.classList.add("is-fallback");
    media.textContent = product.code || product.badge || "PRO";
  }

  label.textContent = product.featured ? "Producto destacado" : "Recurso recomendado";
  title.textContent = product.name;
  description.textContent = product.description;
  tags.append(
    createTag(product.category),
    createTag(primaryFormat(product)),
    createTag(product.compatibility || "Listo para usar")
  );

  price.textContent = money.format(product.price);

  detailLink.className = "button button-primary";
  detailLink.href = `detalle.html?id=${product.id}`;
  detailLink.textContent = "Ver detalle";

  buyLink.className = "button button-secondary";
  buyLink.href = product.buyUrl || DEFAULT_STORE_URL;
  buyLink.target = "_blank";
  buyLink.rel = "noreferrer";
  buyLink.textContent = "Comprar";

  actions.append(detailLink, buyLink);
  footer.append(price, actions);
  content.append(label, title, description, tags, footer);
  heroSpotlight.append(media, content);
}

function createTag(text) {
  const tag = document.createElement("span");
  tag.className = "spotlight-tag";
  tag.textContent = text;
  return tag;
}

function renderProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categorySelect.value;
  const selectedSort = sortSelect.value;

  let filtered = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const haystack = [
      product.name,
      product.description,
      product.category,
      product.compatibility || "",
      product.format || "",
    ]
      .join(" ")
      .toLowerCase();

    return matchesCategory && haystack.includes(searchTerm);
  });

  filtered = sortProducts(filtered, selectedSort);
  syncCategoryPills();

  if (!filtered.length) {
    productGrid.innerHTML = `
      <div class="empty-catalog">
        <h3>No encontramos recursos con ese filtro.</h3>
        <p>Prueba otra busqueda o cambia la categoria seleccionada.</p>
      </div>
    `;
    resultsCount.textContent = "0 recursos";
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach((product, index) => {
    const node = productTemplate.content.cloneNode(true);
    const card = node.querySelector(".product-card");
    const cover = node.querySelector(".product-cover");
    const coverImage = node.querySelector(".product-cover-image");

    card.style.setProperty("--product-accent", BRAND_NEON_START);
    card.style.setProperty("--product-accent-2", BRAND_NEON_END);
    card.style.setProperty("--card-index", index.toString());

    applyProductCover(cover, coverImage, product);

    node.querySelector(".product-badge").textContent = product.badge || "DIGITAL";
    node.querySelector(".product-code").textContent = product.code || "PRO";
    node.querySelector(".product-category").textContent = product.category;
    node.querySelector(".product-format").textContent = primaryFormat(product);
    node.querySelector(".product-title").textContent = product.name;
    node.querySelector(".product-description").textContent = product.description;
    node.querySelector(".product-delivery").textContent = product.delivery || "Compra externa";
    node.querySelector(".product-compatibility").textContent = shortenText(product.compatibility || "Listo para usar", 26);
    node.querySelector(".product-price").textContent = money.format(product.price);
    node.querySelector(".product-stock").textContent = product.featured ? "Destacado en tienda" : "Disponible en ProyeSY";

    card.dataset.category = product.category;
    card.dataset.id = product.id;
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `Ver detalle de ${product.name}`);
    card.addEventListener("pointermove", handleCardPointerMove);
    card.addEventListener("pointerleave", resetCardPointer);
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
      window.open(product.buyUrl || DEFAULT_STORE_URL, "_blank", "noopener,noreferrer");
    });

    fragment.append(node);
  });

  productGrid.innerHTML = "";
  productGrid.append(fragment);
  resultsCount.textContent = `${filtered.length} ${filtered.length === 1 ? "recurso encontrado" : "recursos encontrados"}`;
}

function sortProducts(items, mode) {
  const sorted = [...items];

  switch (mode) {
    case "price-asc":
      return sorted.sort((left, right) => left.price - right.price);
    case "price-desc":
      return sorted.sort((left, right) => right.price - left.price);
    case "name":
      return sorted.sort((left, right) => left.name.localeCompare(right.name));
    case "featured":
    default:
      return sorted.sort((left, right) => Number(right.featured) - Number(left.featured));
  }
}

function goToProduct(productId) {
  window.location.href = `detalle.html?id=${productId}`;
}

function applyProductCover(coverElement, imageElement, product) {
  const primaryImage = getPrimaryImage(product);

  coverElement.style.background = `linear-gradient(135deg, ${BRAND_NEON_START}, ${BRAND_NEON_END})`;

  if (!primaryImage?.src) {
    imageElement.hidden = true;
    imageElement.removeAttribute("src");
    imageElement.alt = "";
    imageElement.onerror = null;
    imageElement.onload = null;
    return;
  }

  imageElement.hidden = false;
  imageElement.src = primaryImage.src;
  imageElement.alt = primaryImage.alt || `Vista previa de ${product.name}`;
  imageElement.onload = () => {
    imageElement.hidden = false;
  };
  imageElement.onerror = () => {
    const fallback = buildFallbackImage(product);
    imageElement.hidden = false;
    imageElement.src = fallback.src;
    imageElement.alt = fallback.alt;
    imageElement.onerror = null;
  };
}

function getPrimaryImage(product) {
  return Array.isArray(product.images) ? product.images.find((image) => image?.src) || null : null;
}

function buildFallbackImage(product) {
  const start = BRAND_NEON_START;
  const end = BRAND_NEON_END;
  const soft = BRAND_NEON_SOFT;
  const name = escapeXml(product.name || "Producto");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#g)" />
      <rect x="48" y="48" width="1104" height="804" rx="34" fill="rgba(7, 14, 26, 0.18)" stroke="rgba(255,255,255,0.3)" />
      <circle cx="1020" cy="160" r="88" fill="${soft}" fill-opacity="0.18" />
      <text x="80" y="780" fill="white" font-size="84" font-family="Arial, sans-serif" font-weight="700">${name}</text>
    </svg>
  `;

  return {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    alt: `Vista previa de ${product.name}`,
  };
}

function primaryFormat(product) {
  if (!product.format) {
    return "Formato digital";
  }

  return product.format
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");
}

function shortenText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatMetric(value) {
  return String(value).padStart(2, "0");
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function initShowcaseEffects() {
  if (!document.body.classList.contains("home-page-showcase") || showcaseEffectsInitialized) {
    return;
  }

  showcaseEffectsInitialized = true;
  resetAmbientPointer();
  window.addEventListener("pointermove", handleAmbientPointerMove, { passive: true });
  window.addEventListener("blur", resetAmbientPointer);

  if (!document.querySelector(".neon-particles")) {
    const particles = document.createElement("div");
    particles.className = "neon-particles";

    for (let index = 0; index < 26; index += 1) {
      const particle = document.createElement("span");
      particle.className = "neon-particle";
      particle.style.setProperty("--x", `${randomBetween(3, 97)}%`);
      particle.style.setProperty("--y", `${randomBetween(6, 92)}%`);
      particle.style.setProperty("--size", `${randomBetween(3, 10)}px`);
      particle.style.setProperty("--delay", `${randomBetween(0, 5)}s`);
      particle.style.setProperty("--duration", `${randomBetween(6, 13)}s`);
      particles.append(particle);
    }

    document.body.append(particles);
  }
}

function handleAmbientPointerMove(event) {
  updateAmbientPointer(event.clientX, event.clientY);
}

function handleCardPointerMove(event) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  card.style.setProperty("--pointer-x", `${x.toFixed(2)}%`);
  card.style.setProperty("--pointer-y", `${y.toFixed(2)}%`);
}

function resetCardPointer(event) {
  const card = event.currentTarget;
  card.style.removeProperty("--pointer-x");
  card.style.removeProperty("--pointer-y");
}

function updateAmbientPointer(clientX, clientY) {
  const x = clamp((clientX / window.innerWidth) * 100, 8, 92);
  const y = clamp((clientY / window.innerHeight) * 100, 8, 92);

  document.documentElement.style.setProperty("--cursor-x", `${x.toFixed(2)}%`);
  document.documentElement.style.setProperty("--cursor-y", `${y.toFixed(2)}%`);
}

function resetAmbientPointer() {
  updateAmbientPointer(window.innerWidth * 0.64, window.innerHeight * 0.16);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
