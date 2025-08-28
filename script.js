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

const filetreeContainer = document.querySelector(".filetree");
const mainElement = document.querySelector("main");
const fileContnet = document.querySelector(".file-content");
const dirDisplay = document.querySelector(".directory-display");
const navToggleBtn = document.querySelector(".nav-expand-collapse");

navToggleBtn.addEventListener("click", navToggleHandler);
function navToggleHandler() {
  filetreeContainer.classList.toggle("disabled");
  document.querySelector("nav").classList.toggle("collapsed");
  navToggleBtn.closest(".nav-header").classList.toggle("collapsed");
  dirDisplay.classList.toggle("collapsed");
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
      folderUse.setAttribute("href", "#folder");
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
      childDirDiv.className = "child-dir collapsed";

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

createFileTree([directory], filetreeContainer);

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

loadState();

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

function showCreationPopup(type, parentPath, rect) {
  closePopupMenu();

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
  if (name.length < 3) {
    errorContainer.textContent = "Name must be at least 3 characters long";
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
    if (type === "folder") {
      newItem.children = [];
    }
    parentFolder.children.push(newItem);
    saveDirectory(directory);
    filetreeContainer.innerHTML = "";
    createFileTree([directory], filetreeContainer);
    closePopupMenu();
    const creationPopup = document.querySelector(".creation-popup");
    if (creationPopup) {
      document.body.removeChild(creationPopup);
    }
  }
}

function deleteItem(path, isFolder) {
  const parentFolder = findParentFolder(path, directory);
  if (parentFolder) {
    const itemName = path.split("/").pop();
    parentFolder.children = parentFolder.children.filter(
      (child) => child.name !== itemName,
    );
    saveDirectory(directory);
    if (!isFolder) {
      delete content[path];
      saveContent(content);
    }
    filetreeContainer.innerHTML = "";
    createFileTree([directory], filetreeContainer);
    closePopupMenu();
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

  const deleteItemLi = document.createElement("li");
  deleteItemLi.textContent = "Delete";
  deleteItemLi.className = "delete-item";
  deleteItemLi.addEventListener("click", () =>
    deleteItem(highlightedItem.dataset.path, isFolder),
  );
  ul.appendChild(deleteItemLi);

  popupMenu.appendChild(ul);
  document.body.appendChild(popupMenu);

  popupMenu.style.top = `${rect.bottom}px`;
  popupMenu.style.left = `${rect.left}px`;
}

function closePopupMenu() {
  if (popupMenu) {
    popupMenu.remove();
    popupMenu = null;
  }
  const highlightedItem = document.querySelector(".highlighted");
  if (highlightedItem) {
    highlightedItem.classList.remove("highlighted");
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
      if (selectedItem === currentPath) {
        currentDirDiv.classList.add("highlighted");
      }

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
      if (openFolders.includes(currentPath)) {
        folderIcon.classList.add("expanded");
      }
      const folderUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      folderUse.setAttribute("href", "#folder");
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
      if (currentPath === selectedItem) {
        fileContainer.classList.add("highlighted");
      }

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
    saveState();
    filetreeContainer.innerHTML = "";
    createFileTree([directory], filetreeContainer);
    if (path && content[path]) {
      dirDisplay.innerHTML = path;
      fileContnet.innerHTML = `<p>${content[path]}</p>`;
    }
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
