export let selectedItem = null;
export let activeFileIcon = null;
export let popupMenu = null;
export let openFolders = [];
export let backdrop = null;

export function setSelectedItem(value) {
  selectedItem = value;
}

export function getSelectedItem() {
  return selectedItem;
}

export function setActiveFileIcon(value) {
  activeFileIcon = value;
}

export function getActiveFileIcon() {
  return activeFileIcon;
}

export function setPopupMenu(value) {
  popupMenu = value;
}

export function getPopupMenu() {
  return popupMenu;
}

export function setBackdrop(value) {
  backdrop = value;
}

export function getBackdrop() {
  return backdrop;
}

export function getDefaultDirectory() {
  return {
    type: "folder",
    name: "root",
    children: [],
  };
}

export function getDirectory() {
  const directory = localStorage.getItem("directory");
  if (directory) {
    return JSON.parse(directory);
  }
  return null;
}

export function saveDirectory(directory) {
  localStorage.setItem("directory", JSON.stringify(directory));
}

export function getDefaultContent() {
  return {};
}

export function getContent() {
  const content = localStorage.getItem("content");
  if (content) {
    return JSON.parse(content);
  }
  return null;
}

export function saveContent(content) {
  localStorage.setItem("content", JSON.stringify(content));
}

export function syncContentWithDirectory(directory, content) {
  const allFilePaths = [];

  function collectFilePaths(folder, currentPath) {
    for (const item of folder.children) {
      const itemPath = `${currentPath}/${item.name}`;
      if (item.type === "file") {
        allFilePaths.push(itemPath);
      } else if (item.type === "folder") {
        collectFilePaths(item, itemPath);
      }
    }
  }

  collectFilePaths(directory, "root");

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

export function saveState() {
  localStorage.setItem("openFolders", JSON.stringify(openFolders));
  localStorage.setItem("selectedItem", selectedItem || "");
}

export function loadState() {
  const savedOpenFolders = localStorage.getItem("openFolders");
  if (savedOpenFolders) {
    openFolders.push(...JSON.parse(savedOpenFolders));
  }
  selectedItem = localStorage.getItem("selectedItem") || "";
  saveState();
}

export function getQuizState() {
  const quizState = localStorage.getItem("quizState");
  if (quizState) {
    return JSON.parse(quizState);
  }
  const defaultState = {};
  saveQuizState(defaultState);
  return defaultState;
}

export function saveQuizState(quizState) {
  localStorage.setItem("quizState", JSON.stringify(quizState));
}

export function cleanupState() {
  const directory = getDirectory();
  if (!directory) return;

  const allFilePaths = [];
  const allFolderPaths = [];

  function collectPaths(folder, currentPath) {
    for (const item of folder.children) {
      const itemPath = `${currentPath}/${item.name}`;
      if (item.type === "file") {
        allFilePaths.push(itemPath);
      } else if (item.type === "folder") {
        allFolderPaths.push(itemPath);
        if (item.children) {
          collectPaths(item, itemPath);
        }
      }
    }
  }

  allFolderPaths.push("root");
  collectPaths(directory, "root");

  // Clean content
  const content = getContent();
  let contentChanged = false;
  if (content) {
    for (const contentPath in content) {
      if (!allFilePaths.includes(contentPath)) {
        delete content[contentPath];
        contentChanged = true;
      }
    }
  }
  if (contentChanged) {
    saveContent(content);
  }

  // Clean openFolders
  const originalOpenFoldersLength = openFolders.length;
  const cleanedOpenFolders = openFolders.filter((folderPath) =>
    allFolderPaths.includes(folderPath),
  );
  let openFoldersChanged =
    cleanedOpenFolders.length !== originalOpenFoldersLength;
  if (openFoldersChanged) {
    openFolders.length = 0;
    openFolders.push(...cleanedOpenFolders);
  }

  // Clean selectedItem
  let selectedItemChanged = false;
  if (selectedItem && !allFilePaths.includes(selectedItem)) {
    setSelectedItem(null);
    selectedItemChanged = true;
  }

  if (openFoldersChanged || selectedItemChanged) {
    saveState();
  }

  // Clean quizState
  const quizState = getQuizState();
  let quizStateChanged = false;
  for (const path in quizState) {
    if (!allFilePaths.includes(path)) {
      delete quizState[path];
      quizStateChanged = true;
    }
  }
  if (quizStateChanged) {
    saveQuizState(quizState);
  }
}
