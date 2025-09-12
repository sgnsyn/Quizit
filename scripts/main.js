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
} from "./state.js";
import {
  createFileTree,
  displayFileContent,
  createPopupMenu,
  initializeQuizView,
  toggleNav,
} from "./ui.js";
import { expandToPath } from "./fileSystem.js";
import { initTheme } from "./theme.js";

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
    expandToPath(path);
    saveState();
    renderFileTree();
    displayFileContent(path);
    toggleNav();
  }
});


initializeQuizView();
initTheme();
loadState();
renderFileTree();
displayFileContent(getSelectedItem());