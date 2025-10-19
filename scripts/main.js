import {
  getDirectory,
  getContent,
  saveDirectory,
  saveContent,
  syncContentWithDirectory,
  loadState,
  openFolders,
  setSelectedItem,
  saveState,
  getSelectedItem,
  cleanupState,
} from "./state.js";
import {
  createFileTree,
  displayFileContent,
  createPopupMenu,
  initializeQuizView,
  toggleNav,
  setInstallIcon,
} from "./ui.js";
import * as fileSystem from "./fileSystem.js";
import { initTheme } from "./theme.js";
import { registerWorker } from "./sw-register.js";

let directory = getDirectory();
if (!directory) {
  directory = {
    type: "folder",
    name: "root",
    children: [],
  };
  saveDirectory(directory);
}

let content = getContent();
if (!content) {
  content = {};
  saveContent(content);
}

syncContentWithDirectory(directory, content);

const filetreeContainer = document.querySelector(".filetree");
const navExpandBtn = document.querySelector(".nav-expand");
const navCollapseBtn = document.querySelector(".nav-collapse");
const navBackdrop = document.querySelector(".nav-backdrop");

navExpandBtn.addEventListener("click", toggleNav);
navCollapseBtn.addEventListener("click", toggleNav);
navBackdrop.addEventListener("click", toggleNav);

function renderFileTree() {
  const directory = getDirectory();
  filetreeContainer.innerHTML = "";
  createFileTree([directory], filetreeContainer);
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
      const index = openFolders.indexOf(path);
      openFolders.splice(index, 1);
    } else {
      openFolders.push(path);
    }
    saveState();
    renderFileTree();
  } else if (target.closest(".file-container")) {
    e.preventDefault();
    const fileContainer = target.closest(".file-container");
    const path = fileContainer.dataset.path;
    setSelectedItem(path);
    fileSystem.expandToPath(path);
    saveState();
    renderFileTree();
    displayFileContent(path);
    toggleNav();
  }
});

let draggedElement = null;

filetreeContainer.addEventListener("dragstart", (e) => {
  const target = e.target.closest(".file-container, .current-dir");
  if (target) {
    draggedElement = target;
    e.dataTransfer.setData("text/plain", target.dataset.path);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      draggedElement.classList.add("dragging");
    }, 0);
  }
});

filetreeContainer.addEventListener("dragend", (e) => {
  if (draggedElement) {
    draggedElement.classList.remove("dragging");
    draggedElement = null;
  }
});

filetreeContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
  const target = e.target.closest(".current-dir");
  if (target && target !== draggedElement) {
    target.classList.add("drag-over");
  }
});

filetreeContainer.addEventListener("dragleave", (e) => {
  const target = e.target.closest(".current-dir");
  if (target) {
    target.classList.remove("drag-over");
  }
});

filetreeContainer.addEventListener("drop", (e) => {
  e.preventDefault();
  const target = e.target.closest(".current-dir");
  if (target) {
    target.classList.remove("drag-over");
    const sourcePath = e.dataTransfer.getData("text/plain");
    const targetFolderPath = target.dataset.path;
    fileSystem.moveItem(
      sourcePath,
      targetFolderPath,
      getDirectory(),
      getContent(),
      {
        createFileTree,
        displayFileContent,
        closePopupMenu: () => {},
        toggleNav,
      },
    );
  }
});

initializeQuizView();
initTheme();
setInstallIcon();
loadState();
cleanupState();
renderFileTree();
displayFileContent(getSelectedItem());
registerWorker();
