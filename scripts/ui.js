import {
  openFolders,
  getSelectedItem,
  setSelectedItem,
  setPopupMenu,
  setBackdrop,
  getPopupMenu,
  getBackdrop,
  getActiveFileIcon,
  setActiveFileIcon,
  saveState,
  getDirectory,
  getContent,
  saveContent,
} from "./state.js";
import * as fileSystem from "./fileSystem.js";

const uiFunctions = {
  createFileTree,
  displayFileContent,
  closePopupMenu,
};

export function navToggleHandler() {
  const filetreeContainer = document.querySelector(".filetree");
  const dirDisplay = document.querySelector(".directory-display");
  const navToggleBtn = document.querySelector(".nav-expand-collapse");

  filetreeContainer.classList.toggle("disabled");
  document.querySelector("nav").classList.toggle("collapsed");
  navToggleBtn.closest(".nav-header").classList.toggle("collapsed");
  dirDisplay.classList.toggle("collapsed");
}

export function displayFileContent(path) {
  const fileContentDiv = document.querySelector(".file-content");
  const fileView = fileContentDiv.querySelector(".file-view");
  const noFileContent = fileContentDiv.querySelector(".no-file-content");
  const noFileSelected = fileContentDiv.querySelector(".no-file-selected");
  const textArea = noFileContent.querySelector("textarea");
  const clearButton = noFileContent.querySelector("#clear-btn");
  const saveButton = noFileContent.querySelector("#save-btn");
  const testDisplay = fileView.querySelector(".test-display");
  const titleSpan = document.querySelector(".directory-display .title");

  const pathSpan = document.querySelector(".directory-display .path");

  if (path && getContent().hasOwnProperty(path)) {
    pathSpan.textContent = path;
    const fileContent = getContent()[path];

    if (fileContent === "") {
      noFileSelected.classList.add("disabled");
      fileView.classList.add("disabled");
      noFileContent.classList.remove("disabled");

      textArea.value = "";
      textArea.focus();

      const newClearButton = clearButton.cloneNode(true);
      clearButton.parentNode.replaceChild(newClearButton, clearButton);
      const newSaveButton = saveButton.cloneNode(true);
      saveButton.parentNode.replaceChild(newSaveButton, saveButton);

      newClearButton.addEventListener("click", () => {
        textArea.value = "";
      });

      newSaveButton.addEventListener("click", () => {
        const newContent = textArea.value;
        const currentContent = getContent();
        currentContent[path] = newContent;
        saveContent(currentContent);
        displayFileContent(path);
      });
    } else {
      try {
        const quizData = JSON.parse(fileContent);
        if (quizData.questions) {
          noFileSelected.classList.add("disabled");
          noFileContent.classList.add("disabled");
          fileView.classList.remove("disabled");
          renderQuiz(quizData, testDisplay);
          if (quizData.title) {
            titleSpan.textContent = quizData.title.length > 12 ? quizData.title.substring(0, 12) + "..." : quizData.title;
          } else {
            titleSpan.textContent = "";
          }
        } else {
          throw new Error("Invalid JSON structure");
        }
      } catch (error) {
        noFileSelected.classList.add("disabled");
        noFileContent.classList.add("disabled");
        fileView.classList.remove("disabled");

        testDisplay.textContent = fileContent;
        titleSpan.textContent = "";
      }
    }
  } else {
    pathSpan.textContent = "";
    titleSpan.textContent = "";
    noFileSelected.classList.remove("disabled");
    fileView.classList.add("disabled");
  }
}

function renderQuiz(quizData, container) {
  container.innerHTML = "";

  if(quizData.title){
    const title = document.createElement("h2");
    title.textContent = quizData.title;
    container.appendChild(title);
  }

  quizData.questions.forEach((question, index) => {
    const questionContainer = document.createElement("div");
    questionContainer.className = "question-container";

    const questionText = document.createElement("p");
    questionText.textContent = `${index + 1}. ${question.question}`;
    questionContainer.appendChild(questionText);

    const answersContainer = document.createElement("div");
    answersContainer.className = "answers-container";

    question.answers.forEach((answer, answerIndex) => {
      const answerWrapper = document.createElement("div");
      answerWrapper.className = "answer-wrapper";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `question-${index}`;
      radio.value = answerIndex;
      radio.id = `q${index}a${answerIndex}`;

      const label = document.createElement("label");
      label.textContent = answer;
      label.htmlFor = `q${index}a${answerIndex}`;

      answerWrapper.appendChild(radio);
      answerWrapper.appendChild(label);
      answersContainer.appendChild(answerWrapper);
    });

    questionContainer.appendChild(answersContainer);
    container.appendChild(questionContainer);
  });
}

export function showCreationPopup(type, parentPath, rect) {
  closePopupMenu(true, true);

  const creationPopup = document.createElement("div");
  creationPopup.className = "creation-popup";
  creationPopup.style.top = `${rect.bottom}px`;
  creationPopup.style.left = `${rect.left}px`;

  const label = document.createElement("label");
  label.textContent = type === "file" ? "File Name" : "Folder Name";
  creationPopup.appendChild(label);

  const input = document.createElement("input");
  input.type = "text";
  creationPopup.appendChild(input);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(creationPopup);
    closePopupMenu();
  });
  buttonContainer.appendChild(cancelButton);

  const createButton = document.createElement("button");
  createButton.textContent = "Create";
  createButton.addEventListener("click", () => {
    fileSystem.createFileOrFolder(
      input.value,
      type,
      parentPath,
      errorContainer,
      getDirectory(),
      getContent(),
      uiFunctions,
    );
  });
  buttonContainer.appendChild(createButton);

  creationPopup.appendChild(buttonContainer);

  const errorContainer = document.createElement("div");
  errorContainer.className = "error-container";
  creationPopup.appendChild(errorContainer);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      fileSystem.createFileOrFolder(
        input.value,
        type,
        parentPath,
        errorContainer,
        getDirectory(),
        getContent(),
        uiFunctions,
      );
    }
  });

  document.body.appendChild(creationPopup);
  input.focus();
  if (getBackdrop()) {
    getBackdrop().onclick = () => {
      document.body.removeChild(creationPopup);
      closePopupMenu();
    };
  }
}

export function showDeleteConfirmationPopup(path, isFolder) {
  closePopupMenu(true, true);

  const confirmationPopup = document.createElement("div");
  confirmationPopup.className = "creation-popup";

  const warningMessage = document.createElement("p");
  warningMessage.textContent = `Are you sure you want to delete this ${
    isFolder ? "folder" : "file"
  }?`;
  warningMessage.style.color = "var(--warning)";
  confirmationPopup.appendChild(warningMessage);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(confirmationPopup);
    closePopupMenu();
  });
  buttonContainer.appendChild(cancelButton);

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => {
    fileSystem.deleteItem(path, isFolder, getDirectory(), getContent(), uiFunctions);
    document.body.removeChild(confirmationPopup);
    closePopupMenu();
  });
  buttonContainer.appendChild(deleteButton);

  confirmationPopup.appendChild(buttonContainer);

  document.body.appendChild(confirmationPopup);
  if (getBackdrop()) {
    getBackdrop().onclick = () => {
      document.body.removeChild(confirmationPopup);
      closePopupMenu();
    };
  }

  const highlightedItem = document.querySelector(".highlighted");
  if (highlightedItem) {
    const rect = highlightedItem.getBoundingClientRect();
    confirmationPopup.style.top = `${rect.bottom}px`;
    confirmationPopup.style.left = `${rect.left}px`;
  }
}

export function showRenamePopup(itemToRename, rect) {
  closePopupMenu(true, true);

  const renamePopup = document.createElement("div");
  renamePopup.className = "creation-popup";
  renamePopup.style.top = `${rect.bottom}px`;
  renamePopup.style.left = `${rect.left}px`;

  const label = document.createElement("label");
  label.textContent = "New Name";
  renamePopup.appendChild(label);

  const input = document.createElement("input");
  input.type = "text";
  const oldName = itemToRename.dataset.path.split("/").pop();
  input.value = oldName;
  renamePopup.appendChild(input);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(renamePopup);
    closePopupMenu();
  });
  buttonContainer.appendChild(cancelButton);

  const renameButton = document.createElement("button");
  renameButton.textContent = "Rename";
  renameButton.addEventListener("click", () => {
    fileSystem.renameItem(
      itemToRename.dataset.path,
      input.value,
      errorContainer,
      getDirectory(),
      getContent(),
      uiFunctions,
    );
  });
  buttonContainer.appendChild(renameButton);

  renamePopup.appendChild(buttonContainer);

  const errorContainer = document.createElement("div");
  errorContainer.className = "error-container";
  renamePopup.appendChild(errorContainer);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      fileSystem.renameItem(
        itemToRename.dataset.path,
        input.value,
        errorContainer,
        getDirectory(),
        getContent(),
        uiFunctions,
      );
    }
  });

  document.body.appendChild(renamePopup);
  input.focus();
  if (getBackdrop()) {
    getBackdrop().onclick = () => {
      document.body.removeChild(renamePopup);
      closePopupMenu();
    };
  }
}

export function createPopupMenu(target, isFolder) {
  closePopupMenu();

  const backdrop = document.createElement("div");
  backdrop.className = "popup-backdrop";
  backdrop.addEventListener("click", () => closePopupMenu());
  document.body.appendChild(backdrop);
  setBackdrop(backdrop);

  const highlightedItem = target.closest(
    isFolder ? ".current-dir" : ".file-container",
  );
  highlightedItem.classList.add("highlighted");

  const isRoot = highlightedItem.dataset.path === "root";

  const popupMenu = document.createElement("div");
  popupMenu.className = "popup-menu visible";
  setPopupMenu(popupMenu);

  const ul = document.createElement("ul");
  const rect = target.getBoundingClientRect();

  if (isFolder) {
    const createFile = document.createElement("li");
    createFile.textContent = "Create File";
    createFile.addEventListener("click", () =>
      showCreationPopup("file", highlightedItem.dataset.path, rect),
    );
    ul.appendChild(createFile);

    const createFolder = document.createElement("li");
    createFolder.textContent = "Create Folder";
    createFolder.addEventListener("click", () =>
      showCreationPopup("folder", highlightedItem.dataset.path, rect),
    );
    ul.appendChild(createFolder);
  }

  if (!isRoot) {
    const renameItemLi = document.createElement("li");
    renameItemLi.textContent = "Rename";
    renameItemLi.addEventListener("click", () =>
      showRenamePopup(highlightedItem, rect),
    );
    ul.appendChild(renameItemLi);

    const deleteItemLi = document.createElement("li");
    deleteItemLi.textContent = "Delete";
    deleteItemLi.className = "delete-item";
    deleteItemLi.addEventListener("click", () =>
      showDeleteConfirmationPopup(highlightedItem.dataset.path, isFolder),
    );
    ul.appendChild(deleteItemLi);
  }

  getPopupMenu().appendChild(ul);
  document.body.appendChild(getPopupMenu());

  getPopupMenu().style.top = `${rect.bottom}px`;
  getPopupMenu().style.left = `${rect.left}px`;
}

export function closePopupMenu(keepHighlight = false, keepBackdrop = false) {
  if (getPopupMenu()) {
    getPopupMenu().remove();
    setPopupMenu(null);
  }
  const highlightedItem = document.querySelector(".highlighted");
  if (!keepHighlight) {
    if (highlightedItem) {
      highlightedItem.classList.remove("highlighted");
    }
  }
  if (getBackdrop() && !keepBackdrop) {
    getBackdrop().remove();
    setBackdrop(null);
  }
}

export function createFileTree(data, parent, path = "") {
  if (!data) return;

  data.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === "folder" ? -1 : 1;
  });

  data.forEach((item) => {
    const currentPath = path ? `${path}/${item.name}` : item.name;
    if (item.type === "folder") {
      const dirDiv = document.createElement("div");
      dirDiv.className = "dir";

      const currentDirDiv = document.createElement("div");
      currentDirDiv.className = "current-dir";
      currentDirDiv.dataset.path = currentPath;

      const fileFolderInfo = document.createElement("div");
      fileFolderInfo.className = "file-folder-info";

      const expandButton = document.createElement("button");
      expandButton.className = "svg-button expand-collapse";
      const expandSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      expandSvg.classList.add("exp-icon");
      if (openFolders.includes(currentPath)) {
        expandSvg.classList.add("collapsed");
      }
      const expandUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      expandUse.setAttribute("href", "#right-arrow");
      expandSvg.appendChild(expandUse);
      expandButton.appendChild(expandSvg);

      const folderIcon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      folderIcon.classList.add("file-folder-icon");
      const folderUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      if (openFolders.includes(currentPath)) {
        folderIcon.classList.add("expanded");
        folderUse.setAttribute("href", "#folder-open");
      } else {
        if (item.children && item.children.length > 0) {
          folderUse.setAttribute("href", "#folder-with-files");
        } else {
          folderUse.setAttribute("href", "#folder");
        }
      }
      folderIcon.appendChild(folderUse);

      const folderName = document.createElement("span");
      folderName.className = "file-folder-name";
      folderName.textContent = item.name;

      fileFolderInfo.appendChild(expandButton);
      fileFolderInfo.appendChild(folderIcon);
      fileFolderInfo.appendChild(folderName);

      const threeDotButton = document.createElement("button");
      threeDotButton.className = "svg-button three-dot-button";
      const threeDotSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      const threeDotUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      threeDotUse.setAttribute("href", "#three-dot");
      threeDotSvg.appendChild(threeDotUse);
      threeDotButton.appendChild(threeDotSvg);

      currentDirDiv.appendChild(fileFolderInfo);
      currentDirDiv.appendChild(threeDotButton);

      const childDirDiv = document.createElement("div");
      childDirDiv.className = "child-dir";
      if (!openFolders.includes(currentPath)) {
        childDirDiv.classList.add("collapsed");
      }

      dirDiv.appendChild(currentDirDiv);
      dirDiv.appendChild(childDirDiv);

      parent.appendChild(dirDiv);

      createFileTree(item.children, childDirDiv, currentPath);
    } else {
      const fileContainer = document.createElement("div");
      fileContainer.className = "file-container";
      fileContainer.dataset.path = currentPath;

      const fileFolderInfo = document.createElement("div");
      fileFolderInfo.className = "file-folder-info";

      const fileIcon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      fileIcon.classList.add("file-folder-icon");
      if (currentPath === getSelectedItem()) {
        fileIcon.classList.add("active");
        setActiveFileIcon(fileIcon);
      }
      const fileUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      fileUse.setAttribute("href", "#file");
      fileIcon.appendChild(fileUse);

      const fileName = document.createElement("span");
      fileName.className = "file-folder-name";
      fileName.textContent = item.name;

      fileFolderInfo.appendChild(fileIcon);
      fileFolderInfo.appendChild(fileName);

      const threeDotButton = document.createElement("button");
      threeDotButton.className = "svg-button three-dot-button";
      const threeDotSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      const threeDotUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      threeDotUse.setAttribute("href", "#three-dot");
      threeDotSvg.appendChild(threeDotUse);
      threeDotButton.appendChild(threeDotSvg);

      fileContainer.appendChild(fileFolderInfo);
      fileContainer.appendChild(threeDotButton);

      parent.appendChild(fileContainer);
    }
  });
}
