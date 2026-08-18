const routes = {
  h: "index.html",
  r: "research.html",
  p: "projects.html",
  w: "writing.html",
  a: "about.html",
};

const palette = document.querySelector("[data-palette]");
const palettePanel = palette?.querySelector(".palette-panel");
const openButton = document.querySelector("[data-open-palette]");
const closeButton = document.querySelector("[data-close-palette]");

function openPalette() {
  if (!palette) return;
  palette.hidden = false;
  document.body.style.overflow = "hidden";
  palette.querySelector("a")?.focus();
}

function closePalette() {
  if (!palette) return;
  palette.hidden = true;
  document.body.style.overflow = "";
  openButton?.focus();
}

openButton?.addEventListener("click", openPalette);
closeButton?.addEventListener("click", closePalette);

palette?.addEventListener("click", (event) => {
  if (!palettePanel?.contains(event.target)) closePalette();
});

document.addEventListener("keydown", (event) => {
  const element = event.target;
  const isTyping =
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element?.isContentEditable;

  if (event.key === "Escape" && !palette?.hidden) {
    closePalette();
    return;
  }

  if (isTyping || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === "/") {
    event.preventDefault();
    palette?.hidden ? openPalette() : closePalette();
    return;
  }

  const route = routes[event.key.toLowerCase()];
  if (route) window.location.href = route;
});
