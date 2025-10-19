import { showCustomPopup } from "./popup.js";

const themeRadios = document.querySelectorAll('input[name="theme"]');
const body = document.body;

function applyTheme(theme) {
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (theme === "light") {
    body.classList.add("light");
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", "#f2f3f5");
    }
  } else {
    body.classList.remove("light");
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", "#14161a");
    }
  }
}

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

function saveTheme(theme) {
  localStorage.setItem("theme", theme);
}

function loadTheme() {
  return localStorage.getItem("theme") || "system";
}

function updateRadioButtons(theme) {
  const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
  if (radio) {
    radio.checked = true;
  }
}

export function initTheme() {
  const configPopup = document.querySelector(".config-popup");
  const backdrop = document.querySelector(".popup-backdrop");

  const closePopup = () => {
    configPopup.classList.add("disabled");
    backdrop.classList.add("disabled");
  };

  let savedTheme = loadTheme();
  saveTheme(savedTheme);
  let themeToApply;

  if (savedTheme === "system") {
    themeToApply = getSystemTheme();
  } else {
    themeToApply = savedTheme;
  }

  applyTheme(themeToApply);
  updateRadioButtons(savedTheme);

  themeRadios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      const newTheme = event.target.value;
      saveTheme(newTheme);
      if (newTheme === "system") {
        themeToApply = getSystemTheme();
      } else {
        themeToApply = newTheme;
      }
      applyTheme(themeToApply);
      closePopup();
    });
  });

  // Listen for changes in system theme
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (loadTheme() === "system") {
          const newSystemTheme = e.matches ? "dark" : "light";
          applyTheme(newSystemTheme);
        }
      });
  }

  const settingsBtn = document.querySelector(".settings-btn");
  const closeBtn = configPopup.querySelector(".close-popup-btn");

  settingsBtn.addEventListener("click", () => {
    configPopup.classList.remove("disabled");
    backdrop.classList.remove("disabled");
  });

  closeBtn.addEventListener("click", closePopup);
  backdrop.addEventListener("click", closePopup);

  const exportBtn = document.getElementById("export-config-btn");
  exportBtn.addEventListener("click", () => {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      allData[key] = localStorage.getItem(key);
    }

    const jsonString = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quizit-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  const importBtn = document.getElementById("import-config-btn");
  importBtn.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          await handleImportedData(importedData);
        } catch (error) {
          await showCustomPopup({
            message: "Error parsing JSON file: " + error.message,
            buttons: [{ text: "OK", value: true }],
          });
        }
      };
      reader.readAsText(file);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  });

  async function handleImportedData(importedData) {
    const localKeys = Object.keys(localStorage);
    const importedKeys = Object.keys(importedData);
    const conflictingKeys = importedKeys.filter((key) =>
      localKeys.includes(key),
    );

    if (conflictingKeys.length > 0) {
      const overwrite = await showCustomPopup({
        message: "Some data might be overwritten. Do you want to proceed?",
        buttons: [
          { text: "Cancel", value: false },
          { text: "Overwrite All", value: true, className: "danger-button" },
        ],
        messageClass: "text-center",
      });
      if (overwrite) {
        for (const key in importedData) {
          localStorage.setItem(key, importedData[key]);
        }
        await showCustomPopup({
          message: "Import successful! The page will now reload.",
          buttons: [{ text: "OK", value: true }],
        });
        location.reload();
      }
    } else {
      for (const key in importedData) {
        localStorage.setItem(key, importedData[key]);
      }
      await showCustomPopup({
        message: "Import successful! The page will now reload.",
        buttons: [{ text: "OK", value: true }],
      });
      location.reload();
    }
  }
}
