const PRODUCTS_URL = new URL("./products.json", window.location.href);

export async function loadProducts(errorMessage = "No se pudo cargar el catalogo JSON.") {
  const requestUrl = new URL(PRODUCTS_URL);
  requestUrl.searchParams.set("ts", Date.now().toString());

  const response = await fetch(requestUrl, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
}
