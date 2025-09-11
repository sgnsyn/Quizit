import {
  getDirectory,
  getContent,
  getDefaultDirectory,
  getDefaultContent,
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
  collapseNav,
  expandNav,
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
const mainElement = document.querySelector("main");
const navExpandBtn = document.querySelector(".nav-expand");
const navCollapseBtn = document.querySelector(".nav-collapse");

navExpandBtn.addEventListener("click", expandNav);
navCollapseBtn.addEventListener("click", collapseNav);

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
  }
});

const nav = document.querySelector("nav");
const resizer = document.querySelector(".resizer");

const resize = (e) => {
  const newNavWidth = e.clientX;
  nav.style.width = `${newNavWidth}px`;
  mainElement.style.width = `calc(100vw - ${newNavWidth}px)`;
  localStorage.setItem('navWidth', `${newNavWidth}px`);
};

resizer.addEventListener("mousedown", (e) => {
  e.preventDefault();
  resizer.style.zIndex = "11";

  const onMouseMove = (e) => {
    resize(e);
  };

  const onMouseUp = () => {
    resizer.style.zIndex = "2";
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});

function loadNavWidth() {
  const navWidth = localStorage.getItem('navWidth');
  if (navWidth) {
    nav.style.width = navWidth;
    mainElement.style.width = `calc(100vw - ${navWidth})`;
  }
}

initializeQuizView();
initTheme();
loadState();
loadNavWidth();
renderFileTree();
displayFileContent(getSelectedItem());
