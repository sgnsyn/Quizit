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
  navToggleHandler,
  createPopupMenu,
  initializeQuizView,
} from "./ui.js";
import { expandToPath } from "./fileSystem.js";

let directory = getDirectory();
if (!directory) {
  directory = {
    type: "folder",
    name: "root",
    children: [{ type: "file", name: "quiz.json" }],
  };
  saveDirectory(directory);
}

let content = getContent();
if (!content) {
  content = {
    "root/quiz.json": JSON.stringify(
      {
        title: "Sample Quiz",
        questions: [
          {
            question: "What is the capital of France?",
            answers: ["London", "Paris", "Berlin", "Madrid"],
            correct_option: 1,
            explanation: "Paris is the capital of France.",
          },
          {
            question: "What is 2 + 2?",
            answers: ["3", "4", "5", "6"],
            correct_option: 1,
            explanation: "2 + 2 = 4",
          },
        ],
      },
      null,
      2
    ),
  };
  saveContent(content);
}

syncContentWithDirectory(directory, content);

const filetreeContainer = document.querySelector(".filetree");
const mainElement = document.querySelector("main");
const navToggleBtn = document.querySelector(".nav-expand-collapse");

navToggleBtn.addEventListener("click", navToggleHandler);

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
};

resizer.addEventListener("mousedown", (e) => {
  e.preventDefault();
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", () => {
    document.removeEventListener("mousemove", resize);
  });
});

initializeQuizView();
loadState();
renderFileTree();
displayFileContent(getSelectedItem());
