let selectedItem = null;
let activeFileIcon = null;
let popupMenu = null;
let openFolders = [];

function getDefaultDirectory() {
  return {
    type: "folder",
    name: "root",
    children: [],
  };
}

function getDirectory() {
  const directory = localStorage.getItem("directory");
  if (directory) {
    return JSON.parse(directory);
  }
  return null;
}

function saveDirectory(directory) {
  localStorage.setItem("directory", JSON.stringify(directory));
}

let directory = getDirectory();
if (!directory) {
  directory = getDefaultDirectory();
  saveDirectory(directory);
}

function getDefaultContent() {
  return {};
}

function getContent() {
  const content = localStorage.getItem("content");
  if (content) {
    return JSON.parse(content);
  }
  return null;
}

function saveContent(content) {
  localStorage.setItem("content", JSON.stringify(content));
}

let content = getContent();
if (!content) {
  content = getDefaultContent();
  saveContent(content);
}

function syncContentWithDirectory() {
  const allFilePaths = [];

  function collectFilePaths(folder, currentPath) {
    for (const item of folder.children) {
      const itemPath = `${currentPath}/${item.name}`;
      if (item.type === 'file') {
        allFilePaths.push(itemPath);
      } else if (item.type === 'folder') {
        collectFilePaths(item, itemPath);
      }
    }
  }

  collectFilePaths(directory, 'root');

  let contentChanged = false;
  for (const contentPath in content) {
    if (!allFilePaths.includes(contentPath)) {
      delete content[contentPath];
      contentChanged = true;
    }
  }

  if (contentChanged) {
    saveContent(content);
  }
}

syncContentWithDirectory();

const filetreeContainer = document.querySelector(".filetree");
const mainElement = document.querySelector("main");
const fileContnet = document.querySelector(".file-content");
const noFileSelected = document.querySelector(".no-file-selected");
const dirDisplay = document.querySelector(".directory-display");
const navToggleBtn = document.querySelector(".nav-expand-collapse");

navToggleBtn.addEventListener("click", navToggleHandler);
function navToggleHandler() {
  filetreeContainer.classList.toggle("disabled");
  document.querySelector("nav").classList.toggle("collapsed");
  navToggleBtn.closest(".nav-header").classList.toggle("collapsed");
  dirDisplay.classList.toggle("collapsed");
}

function displayFileContent(path) {
  const existingContent = fileContnet.querySelector(":scope > p");
  if (existingContent) {
    fileContnet.removeChild(existingContent);
  }

  const pathSpan = dirDisplay.querySelector('.path');

  if (path && content.hasOwnProperty(path)) {
    pathSpan.textContent = path;

    const p = document.createElement("p");
    p.textContent = content[path];
    fileContnet.appendChild(p);

    noFileSelected.classList.add("disabled");
  } else {
    pathSpan.textContent = '';
    noFileSelected.classList.remove("disabled");
  }
}

function saveState() {
  localStorage.setItem("openFolders", JSON.stringify(openFolders));
  localStorage.setItem("selectedItem", selectedItem);
}

function loadState() {
  const savedOpenFolders = localStorage.getItem("openFolders");
  if (savedOpenFolders) {
    openFolders = JSON.parse(savedOpenFolders);
  }
  selectedItem = localStorage.getItem("selectedItem");
}

let backdrop = null;

function findFolder(path, dir, currentPath = "root") {
  if (dir.type === "folder" && currentPath === path) {
    return dir;
  }

  if (dir.children) {
    for (const child of dir.children) {
      const found = findFolder(path, child, `${currentPath}/${child.name}`);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function findParentFolder(path, dir, currentPath = "root") {
  for (const child of dir.children) {
    const childPath = `${currentPath}/${child.name}`;
    if (childPath === path) {
      return dir;
    }
    if (child.children) {
      const found = findParentFolder(path, child, childPath);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function expandToPath(path) {
  const pathParts = path.split("/");
  pathParts.pop();
  let currentPath = "";
  for (const part of pathParts) {
    currentPath += (currentPath ? "/" : "") + part;
    if (!openFolders.includes(currentPath)) {
      openFolders.push(currentPath);
    }
  }
}

function showCreationPopup(type, parentPath, rect) {
  closePopupMenu(true);

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
    createFileOrFolder(input.value, type, parentPath, errorContainer);
  });
  buttonContainer.appendChild(createButton);

  creationPopup.appendChild(buttonContainer);

  const errorContainer = document.createElement("div");
  errorContainer.className = "error-container";
  creationPopup.appendChild(errorContainer);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      createFileOrFolder(input.value, type, parentPath, errorContainer);
    }
  });

  document.body.appendChild(creationPopup);
  input.focus();
}

function createFileOrFolder(name, type, parentPath, errorContainer) {
  if (name.length < 1) {
    errorContainer.textContent = "Name must be at least 1 character long";
    return;
  }

  const parentFolder = findFolder(parentPath, directory);
  if (parentFolder) {
    const nameExists = parentFolder.children.some(
      (child) => child.name === name,
    );
    if (nameExists) {
      errorContainer.textContent = "Name already exists";
      return;
    }

    const newItem = { type, name };
    const newItemPath = parentPath ? `${parentPath}/${name}` : name;

    if (type === "folder") {
      newItem.children = [];
    } else {
      content[newItemPath] = "";
      saveContent(content);
    }
    parentFolder.children.push(newItem);

    expandToPath(newItemPath);

    if (type === "folder") {
      if (!openFolders.includes(newItemPath)) {
        openFolders.push(newItemPath);
      }
    }

    if (type === "file") {
      selectedItem = newItemPath;
    }

    saveDirectory(directory);
    saveState();

    filetreeContainer.innerHTML = "";
    createFileTree([directory], filetreeContainer);
    displayFileContent(selectedItem);
    closePopupMenu();
    const creationPopup = document.querySelector(".creation-popup");
    if (creationPopup) {
      document.body.removeChild(creationPopup);
    }
  }
}

function deleteItem(path, isFolder) {
  if (path === "root") return;
  const parentFolder = findParentFolder(path, directory);
  if (parentFolder) {
    const itemName = path.split("/").pop();
    const itemIndex = parentFolder.children.findIndex(
      (c) => c.name === itemName,
    );
    if (itemIndex === -1) return;

    const itemToDelete = parentFolder.children[itemIndex];

    parentFolder.children.splice(itemIndex, 1);

    if (itemToDelete.type === "folder") {
      const pathsToDelete = [];
      function collectPaths(item, currentPath) {
        if (item.type === "file") {
          pathsToDelete.push(currentPath);
        } else if (item.type === "folder" && item.children) {
          item.children.forEach((child) => {
            collectPaths(child, `${currentPath}/${child.name}`);
          });
        }
      }
      collectPaths(itemToDelete, path);

      pathsToDelete.forEach((p) => delete content[p]);

      if (selectedItem && selectedItem.startsWith(path + "/")) {
        selectedItem = null;
      }
    } else {
      // file
      delete content[path];
      if (selectedItem === path) {
        selectedItem = null;
      }
    }

    saveDirectory(directory);
    saveContent(content);
    saveState();

    filetreeContainer.innerHTML = "";
    createFileTree([directory], filetreeContainer);
    displayFileContent(selectedItem);
    closePopupMenu();
  }
}

function showDeleteConfirmationPopup(path, isFolder) {
  if (popupMenu) {
    popupMenu.remove();
    popupMenu = null;
  }

  const confirmationPopup = document.createElement("div");
  confirmationPopup.className = "creation-popup";

  const warningMessage = document.createElement("p");
  warningMessage.textContent = `Are you sure you want to delete this ${isFolder ? "folder" : "file"}?`;
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
    deleteItem(path, isFolder);
    document.body.removeChild(confirmationPopup);
    closePopupMenu();
  });
  buttonContainer.appendChild(deleteButton);

  confirmationPopup.appendChild(buttonContainer);

  document.body.appendChild(confirmationPopup);

  if (backdrop) {
    backdrop.onclick = () => {
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

function showRenamePopup(itemToRename, rect) {
  closePopupMenu(true);

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
    renameItem(itemToRename.dataset.path, input.value, errorContainer);
  });
  buttonContainer.appendChild(renameButton);

  renamePopup.appendChild(buttonContainer);

  const errorContainer = document.createElement("div");
  errorContainer.className = "error-container";
  renamePopup.appendChild(errorContainer);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      renameItem(itemToRename.dataset.path, input.value, errorContainer);
    }
  });

  document.body.appendChild(renamePopup);
  input.focus();
}

function renameItem(path, newName, errorContainer) {
  if (path === "root") return;
  if (newName.length < 1) {
    errorContainer.textContent = "Name must be at least 1 character long";
    return;
  }

  const parentFolder = findParentFolder(path, directory);
  if (parentFolder) {
    const nameExists = parentFolder.children.some(
      (child) => child.name === newName,
    );
    if (nameExists) {
      errorContainer.textContent = "Name already exists";
      return;
    }

    const oldName = path.split("/").pop();
    const itemToRename = parentFolder.children.find(
      (child) => child.name === oldName,
    );

    if (itemToRename) {
      const oldPath = path;
      const newPath = path.substring(0, path.lastIndexOf("/")) + "/" + newName;

      const affectedPaths = [];
      function collectPaths(item, currentPath) {
        affectedPaths.push(currentPath);
        if (item.type === "folder" && item.children) {
          item.children.forEach((child) => {
            collectPaths(child, `${currentPath}/${child.name}`);
          });
        }
      }

      collectPaths(itemToRename, oldPath);

      itemToRename.name = newName;

      affectedPaths.forEach((p) => {
        const newP = p.replace(oldPath, newPath);
        if (content[p]) {
          content[newP] = content[p];
          delete content[p];
        }
      });

      openFolders = openFolders.map((p) =>
        p.startsWith(oldPath) ? p.replace(oldPath, newPath) : p,
      );

      if (selectedItem && selectedItem.startsWith(oldPath)) {
        selectedItem = selectedItem.replace(oldPath, newPath);
      }

      saveDirectory(directory);
      saveContent(content);
      saveState();

      filetreeContainer.innerHTML = "";
      createFileTree([directory], filetreeContainer);
      const renamePopup = document.querySelector(".creation-popup");
      if (renamePopup) {
        document.body.removeChild(renamePopup);
      }
      closePopupMenu();
    }
  }
}

function createPopupMenu(target, isFolder) {
  closePopupMenu();

  backdrop = document.createElement("div");
  backdrop.className = "popup-backdrop";
  backdrop.addEventListener("click", closePopupMenu);
  document.body.appendChild(backdrop);

  const highlightedItem = target.closest(
    isFolder ? ".current-dir" : ".file-container",
  );
  highlightedItem.classList.add("highlighted");

  const isRoot = highlightedItem.dataset.path === "root";

  popupMenu = document.createElement("div");
  popupMenu.className = "popup-menu visible";

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

  popupMenu.appendChild(ul);
  document.body.appendChild(popupMenu);

  popupMenu.style.top = `${rect.bottom}px`;
  popupMenu.style.left = `${rect.left}px`;
}

function closePopupMenu(keepHighlight = false) {
  if (popupMenu) {
    popupMenu.remove();
    popupMenu = null;
  }
  if (!keepHighlight) {
    const highlightedItem = document.querySelector(".highlighted");
    if (highlightedItem) {
      highlightedItem.classList.remove("highlighted");
    }
  }
  if (backdrop) {
    backdrop.remove();
    backdrop = null;
  }
}

function createFileTree(data, parent, path = "") {
  if (!data) return;

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
      if (currentPath === selectedItem) {
        fileIcon.classList.add("active");
        activeFileIcon = fileIcon;
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

filetreeContainer.addEventListener("click", (e) => {
  const target = e.target;
  if (target.closest(".three-dot-button")) {
    const isFolder = target.closest(".current-dir");
    createPopupMenu(target, isFolder);
  } else if (target.closest(".current-dir")) {
    if (target.closest(".three-dot-button")) {
      return;
    }
    const parentDir = target.closest(".current-dir");
    const path = parentDir.dataset.path;
    if (openFolders.includes(path)) {
      openFolders = openFolders.filter((p) => p !== path);
    } else {
      openFolders.push(path);
    }
    saveState();
    filetreeContainer.innerHTML = "";
    createFileTree([directory], filetreeContainer);
  } else if (target.closest(".file-container")) {
    const fileContainer = target.closest(".file-container");
    const path = fileContainer.dataset.path;
    selectedItem = path;
    expandToPath(path);
    saveState();
    filetreeContainer.innerHTML = "";
    createFileTree([directory], filetreeContainer);
    displayFileContent(path);
  }
});

const nav = document.querySelector("nav");
const resizer = document.querySelector(".resizer");

const resize = (e) => {
  const newNavWidth = e.clientX;
  nav.style.width = `${newNavWidth}px`;
  mainElement.style.width = `calc(100vw - ${newNavWidth}px)`;
};

resizer.addEventListener("mousedown", (e) => {
  e.preventDefault();
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", () => {
    document.removeEventListener("mousemove", resize);
  });
});

loadState();
createFileTree([directory], filetreeContainer);
displayFileContent(selectedItem);
