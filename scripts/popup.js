export function showCustomPopup(options) {
  const { message, buttons, messageClass } = options;
  return new Promise((resolve) => {
    const popup = document.createElement("div");
    popup.className = "custom-popup";

    const messageEl = document.createElement("p");
    messageEl.textContent = message;
    if (messageClass) {
      messageEl.classList.add(messageClass);
    }
    popup.appendChild(messageEl);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";

    buttons.forEach((buttonInfo) => {
      const button = document.createElement("button");
      button.textContent = buttonInfo.text;
      if (buttonInfo.className) {
        button.classList.add(buttonInfo.className);
      }
      button.addEventListener("click", () => {
        document.body.removeChild(popup);
        document.body.removeChild(backdrop);
        resolve(buttonInfo.value);
      });
      buttonContainer.appendChild(button);
    });

    popup.appendChild(buttonContainer);

    const backdrop = document.createElement("div");
    backdrop.className = "custom-popup-backdrop";
    backdrop.addEventListener("click", () => {
      document.body.removeChild(popup);
      document.body.removeChild(backdrop);
      resolve(false);
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
  });
}
