import { loadProducts } from "./products-api.js";

const detailApp = document.querySelector("#detail-app");
const detailTemplate = document.querySelector("#detail-template");
const DEFAULT_STORE_URL = "https://proyesy.itch.io/";
const BRAND_NEON_START = "#1fe5ff";
const BRAND_NEON_END = "#2b7bff";

const productId = Number(new URLSearchParams(window.location.search).get("id"));

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
});

init();
window.addEventListener("pageshow", handlePageShow);

async function init() {
  await refreshDetail();
}

async function handlePageShow(event) {
  if (!event.persisted) {
    return;
  }

  await refreshDetail();
}

async function refreshDetail() {
  try {
    const products = await loadProducts("No se pudo cargar la informacion del recurso.");
    const product = products.find((item) => item.id === productId);

    if (!product) {
      throw new Error("No encontramos el recurso solicitado.");
    }

    renderDetail(product, products);
  } catch (error) {
    detailApp.innerHTML = `<div class="empty-catalog">${error.message}</div>`;
  }
}

function renderDetail(product, products) {
  const node = detailTemplate.content.cloneNode(true);
  const heroPanel = node.querySelector(".detail-hero-panel");
  const mainImage = node.querySelector("#main-image");
  const galleryThumbs = node.querySelector("#gallery-thumbs");
  const thumbsShell = node.querySelector(".detail-thumbs-shell");
  const detailDescription = node.querySelector(".detail-description");
  const storyPanel = node.querySelector("#detail-story-panel");
  const storyContent = node.querySelector("#detail-story");
  const featurePanel = node.querySelector("#detail-feature-panel");
  const specPanel = node.querySelector("#detail-spec-panel");
  const featureList = node.querySelector("#feature-list");
  const specList = node.querySelector("#spec-list");
  const relatedProducts = node.querySelector("#related-products");
  const buyButton = node.querySelector("#detail-add-cart");
  const videoPanel = node.querySelector("#detail-video-panel");
  const videoFrame = node.querySelector("#detail-video");
  const videoLink = node.querySelector(".detail-video-link");
  const licenseNoteText = node.querySelector("#license-note-text");

  const images = getProductImages(product);
  const primaryImage = images[0] || buildFallbackImage(product);
  const usageValue = getSpecValue(product.specs, "Uso") || product.license || "Proyecto final comercial permitido";

  heroPanel.style.setProperty("--product-accent", BRAND_NEON_START);
  heroPanel.style.setProperty("--product-accent-2", BRAND_NEON_END);

  document.title = `${product.name} | ProyeSY`;

  node.querySelector(".detail-category").textContent = [product.category, product.badge || product.code].filter(Boolean).join(" / ");
  node.querySelector(".detail-title").textContent = product.name;
  detailDescription.hidden = true;
  node.querySelector(".detail-format").textContent = product.format || "Formato digital";
  node.querySelector(".detail-compatibility").textContent = product.compatibility || "Listo para usar";
  node.querySelector(".detail-price").textContent = money.format(product.price);
  node.querySelector(".detail-stock").textContent = product.format || "Recurso digital";
  node.querySelector(".detail-delivery").textContent = product.delivery || "Disponible en itch.io";
  node.querySelector(".detail-license").textContent = product.license || "Comercial";
  node.querySelector(".detail-usage").textContent = usageValue;
  licenseNoteText.textContent = product.licenseNote || "Puedes usar el producto en proyectos propios o comerciales, pero no revenderlo por separado.";
  renderStoryContent(storyContent, mergeStoryText(product.description, product.longDescription));

  setMainImage(mainImage, primaryImage, product);

  if (images.length <= 1) {
    thumbsShell.remove();
  } else {
    images.forEach((image, index) => {
      const button = document.createElement("button");
      const thumbImage = document.createElement("img");

      button.type = "button";
      button.className = `thumb-button${index === 0 ? " is-active" : ""}`;
      button.setAttribute("aria-label", `Ver imagen ${index + 1} de ${product.name}`);

      thumbImage.src = image.src;
      thumbImage.alt = image.alt || `Vista previa de ${product.name}`;
      thumbImage.addEventListener("error", () => {
        thumbImage.src = buildFallbackImage(product).src;
        thumbImage.alt = buildFallbackImage(product).alt;
      });

      button.append(thumbImage);
      button.addEventListener("click", () => {
        setMainImage(mainImage, image, product);
        galleryThumbs
          .querySelectorAll(".thumb-button")
          .forEach((thumb) => thumb.classList.remove("is-active"));
        button.classList.add("is-active");
      });

      galleryThumbs.append(button);
    });
  }

  if ((product.features || []).length) {
    (product.features || []).forEach((feature) => {
      const item = document.createElement("li");
      item.textContent = feature;
      featureList.append(item);
    });
  } else {
    featurePanel.remove();
  }

  if ((product.specs || []).length) {
    (product.specs || []).forEach((spec) => {
      const article = document.createElement("article");
      const label = document.createElement("span");
      const value = document.createElement("strong");

      article.className = "spec-item";
      label.textContent = spec.label;
      value.textContent = spec.value;

      article.append(label, value);
      specList.append(article);
    });
  } else {
    specPanel.remove();
  }

  if (!storyContent.childElementCount) {
    storyPanel.remove();
  }

  if (product.youtubeId) {
    videoFrame.src = `https://www.youtube-nocookie.com/embed/${product.youtubeId}`;
  } else {
    videoPanel.remove();
    videoLink.remove();
  }

  buyButton.addEventListener("click", () => {
    window.open(product.buyUrl || DEFAULT_STORE_URL, "_blank", "noopener,noreferrer");
  });

  getRelatedProducts(product, products).forEach((item, index) => {
    relatedProducts.append(createRelatedCard(item, index));
  });

  if (!relatedProducts.children.length) {
    relatedProducts.innerHTML = `<p class="empty-state">No hay recursos relacionados para mostrar.</p>`;
  }

  detailApp.innerHTML = "";
  detailApp.append(node);
}

function renderStoryContent(container, text) {
  const blocks = String(text || "")
    .replaceAll("\r", "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  blocks.forEach((block) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      return;
    }

    const section = document.createElement("section");
    section.className = "detail-story-section";

    if (lines.length === 1) {
      const paragraph = document.createElement("p");
      paragraph.textContent = lines[0];
      section.append(paragraph);
      container.append(section);
      return;
    }

    if (lines[0].endsWith(":")) {
      const label = document.createElement("strong");
      label.className = "detail-story-label";
      label.textContent = lines[0].slice(0, -1);
      section.append(label);

      const remaining = lines.slice(1);
      const shouldRenderAsList = remaining.every((line) => !/[.!?]$/.test(line) && line.length <= 90);

      if (shouldRenderAsList) {
        const list = document.createElement("ul");
        list.className = "detail-story-list";
        remaining.forEach((line) => {
          const item = document.createElement("li");
          item.textContent = line;
          list.append(item);
        });
        section.append(list);
      } else {
        const paragraph = document.createElement("p");
        paragraph.textContent = remaining.join(" ");
        section.append(paragraph);
      }

      container.append(section);
      return;
    }

    const shouldRenderAsList = lines.every((line) => !/[.!?]$/.test(line) && line.length <= 90);

    if (shouldRenderAsList) {
      const list = document.createElement("ul");
      list.className = "detail-story-list";
      lines.forEach((line) => {
        const item = document.createElement("li");
        item.textContent = line;
        list.append(item);
      });
      section.append(list);
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = lines.join(" ");
      section.append(paragraph);
    }

    container.append(section);
  });
}

function mergeStoryText(description, longDescription) {
  const shortText = String(description || "").trim();
  const longText = String(longDescription || "").trim();

  if (!shortText) {
    return longText;
  }

  if (!longText) {
    return shortText;
  }

  if (normalizeText(longText).startsWith(normalizeText(shortText))) {
    return longText;
  }

  return `${shortText}\n\n${longText}`;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replaceAll("\r", "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function setMainImage(imageElement, image, product) {
  const fallback = buildFallbackImage(product);

  imageElement.src = image?.src || fallback.src;
  imageElement.alt = image?.alt || fallback.alt;
  imageElement.onerror = () => {
    imageElement.src = fallback.src;
    imageElement.alt = fallback.alt;
    imageElement.onerror = null;
  };
}

function getProductImages(product) {
  const images = Array.isArray(product.images) ? product.images.filter((image) => image?.src) : [];
  return images.length ? images : [buildFallbackImage(product)];
}

function getRelatedProducts(product, products) {
  return [...products]
    .filter((item) => item.id !== product.id)
    .sort((left, right) => {
      const leftScore = Number(left.category === product.category) + Number(left.featured);
      const rightScore = Number(right.category === product.category) + Number(right.featured);
      return rightScore - leftScore;
    })
    .slice(0, 3);
}

function createRelatedCard(product, index) {
  const link = document.createElement("a");
  const imageWrap = document.createElement("div");
  const image = document.createElement("img");
  const body = document.createElement("div");
  const top = document.createElement("div");
  const badge = document.createElement("span");
  const title = document.createElement("strong");
  const description = document.createElement("p");
  const price = document.createElement("span");
  const preview = getPrimaryImage(product) || buildFallbackImage(product);

  link.className = "related-card";
  link.href = `detalle.html?id=${product.id}`;
  link.style.setProperty("--card-index", index.toString());

  imageWrap.className = "related-media";
  body.className = "related-body";
  top.className = "related-top";
  badge.className = "related-badge";
  description.className = "related-description";

  image.src = preview.src;
  image.alt = preview.alt || `Vista previa de ${product.name}`;
  image.addEventListener("error", () => {
    image.src = buildFallbackImage(product).src;
    image.alt = buildFallbackImage(product).alt;
  });

  badge.textContent = product.category;
  title.textContent = product.name;
  description.textContent = product.description;
  price.textContent = money.format(product.price);

  imageWrap.append(image);
  top.append(badge, price);
  body.append(top, title, description);
  link.append(imageWrap, body);

  return link;
}

function getPrimaryImage(product) {
  return Array.isArray(product.images) ? product.images.find((image) => image?.src) || null : null;
}

function getSpecValue(specs, label) {
  const match = (specs || []).find((spec) => String(spec.label || "").toLowerCase() === label.toLowerCase());
  return match?.value || "";
}

function buildFallbackImage(product) {
  const start = BRAND_NEON_START;
  const end = BRAND_NEON_END;
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
      <text x="80" y="780" fill="white" font-size="84" font-family="Arial, sans-serif" font-weight="700">${name}</text>
    </svg>
  `;

  return {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    alt: `Vista previa de ${product.name}`,
  };
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
