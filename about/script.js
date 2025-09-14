const body = document.body;
function getSystemTheme() {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }
  return "light"; // Default to light if preference cannot be determined
}
function applyTheme(theme) {
  if (theme === "light") {
    body.classList.add("light");
  } else {
    body.classList.remove("light");
  }
}

function loadTheme() {
  return localStorage.getItem("theme") || "system";
}

window.addEventListener("load", () => {
  let theme = loadTheme();
  if (theme == "system") {
    theme = getSystemTheme();
  }
  applyTheme(theme);
});
