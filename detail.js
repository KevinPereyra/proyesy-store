const detailApp = document.querySelector("#detail-app");
const detailTemplate = document.querySelector("#detail-template");

const productId = Number(new URLSearchParams(window.location.search).get("id"));

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
});

init();

async function init() {
  try {
    const response = await fetch("./products.json");
    if (!response.ok) {
      throw new Error("No se pudo cargar la informacion del recurso.");
    }

    const products = await response.json();
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
  const mainImage = node.querySelector("#main-image");
  const galleryThumbs = node.querySelector("#gallery-thumbs");
  const featureList = node.querySelector("#feature-list");
  const specList = node.querySelector("#spec-list");
  const relatedProducts = node.querySelector("#related-products");
  const buyButton = node.querySelector("#detail-add-cart");
  const videoPanel = node.querySelector("#detail-video-panel");
  const videoFrame = node.querySelector("#detail-video");
  const videoLink = node.querySelector(".detail-video-link");
  const licenseNoteText = node.querySelector("#license-note-text");

  document.title = `${product.name} | ProyeSY`;

  node.querySelector(".detail-category").textContent = `${product.category} - ${product.badge}`;
  node.querySelector(".detail-title").textContent = product.name;
  node.querySelector(".detail-description").textContent = product.longDescription;
  node.querySelector(".detail-price").textContent = money.format(product.price);
  node.querySelector(".detail-stock").textContent = product.format || "Recurso digital";
  node.querySelector(".detail-delivery").textContent = product.delivery || "Disponible en itch.io";
  node.querySelector(".detail-license").textContent = product.license || "Comercial";
  licenseNoteText.textContent = product.licenseNote || "Puedes usar el producto en proyectos propios o comerciales, pero no revenderlo por separado.";

  setMainImage(mainImage, product.images[0]);

  product.images.forEach((image, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `thumb-button${index === 0 ? " is-active" : ""}`;
    button.setAttribute("aria-label", `Ver imagen ${index + 1} de ${product.name}`);
    button.innerHTML = `<img src="${image.src}" alt="${image.alt}">`;
    button.addEventListener("click", () => {
      setMainImage(mainImage, image);
      galleryThumbs
        .querySelectorAll(".thumb-button")
        .forEach((thumb) => thumb.classList.remove("is-active"));
      button.classList.add("is-active");
    });
    galleryThumbs.append(button);
  });

  product.features.forEach((feature) => {
    const item = document.createElement("li");
    item.textContent = feature;
    featureList.append(item);
  });

  product.specs.forEach((spec) => {
    const article = document.createElement("article");
    article.className = "spec-item";
    article.innerHTML = `
      <span>${spec.label}</span>
      <strong>${spec.value}</strong>
    `;
    specList.append(article);
  });

  if (product.youtubeId) {
    videoFrame.src = `https://www.youtube-nocookie.com/embed/${product.youtubeId}`;
  } else {
    videoPanel.remove();
    videoLink.remove();
  }

  buyButton.textContent = "Comprar en itch.io";
  buyButton.addEventListener("click", () => {
    window.open(product.buyUrl || "https://itch.io/", "_blank", "noopener,noreferrer");
  });

  products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 3)
    .forEach((item) => {
      const link = document.createElement("a");
      link.className = "related-card";
      link.href = `detalle.html?id=${item.id}`;
      link.innerHTML = `
        <img src="${item.images[0].src}" alt="${item.images[0].alt}">
        <div>
          <strong>${item.name}</strong>
          <span>${money.format(item.price)}</span>
        </div>
      `;
      relatedProducts.append(link);
    });

  if (!relatedProducts.children.length) {
    relatedProducts.innerHTML = `<p class="empty-state">No hay recursos relacionados para mostrar.</p>`;
  }

  detailApp.innerHTML = "";
  detailApp.append(node);
}

function setMainImage(imageElement, image) {
  imageElement.src = image.src;
  imageElement.alt = image.alt;
}
