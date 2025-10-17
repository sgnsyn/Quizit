export function registerWorker() {
  const installBtn = document.getElementById("install-btn");

  if (window.matchMedia("(display-mode: standalone)").matches) {
    installBtn.classList.add("disabled");
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").then(
        () => {
          // service worker registered
        },
        () => {
          // service worker failed to register
        },
      );
    });
  }

  // Declare deferredPrompt first
  let deferredPrompt;

  // Listen for the install prompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove("disabled");
  });

  // Handle click on the install button
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return; // safety check
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      installBtn.classList.add("disabled");
    } else {
      // user decliend to install
    }
    deferredPrompt = null;
  });
}
