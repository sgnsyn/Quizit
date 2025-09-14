import {
  getDirectory,
  getContent,
  openFolders,
  getSelectedItem,
  setSelectedItem,
  saveDirectory,
  saveContent,
  saveState,
  getQuizState,
  saveQuizState,
} from "./state.js";

export function findFolder(path, dir, currentPath = "root") {
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

export function findParentFolder(path, dir, currentPath = "root") {
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

export function expandToPath(path) {
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

export function createFileOrFolder(
  name,
  type,
  parentPath,
  errorContainer,
  directory,
  content,
  uiFunctions,
) {
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
      setSelectedItem(newItemPath);
      uiFunctions.toggleNav();
    }

    saveDirectory(directory);
    saveState();

    const filetreeContainer = document.querySelector(".filetree");
    filetreeContainer.innerHTML = "";
    uiFunctions.createFileTree([directory], filetreeContainer);
    uiFunctions.displayFileContent(getSelectedItem());
    uiFunctions.closePopupMenu();
    const creationPopup = document.querySelector(".creation-popup");
    if (creationPopup) {
      document.body.removeChild(creationPopup);
    }
  }
}

export function deleteItem(path, isFolder, directory, content, uiFunctions) {
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

      const quizState = getQuizState();
      pathsToDelete.forEach((p) => {
        if (quizState[p]) {
          delete quizState[p];
        }
      });
      saveQuizState(quizState);

      if (getSelectedItem() && getSelectedItem().startsWith(path + "/")) {
        setSelectedItem(null);
      }
    } else {
      // file
      delete content[path];
      const quizState = getQuizState();
      if (quizState[path]) {
        delete quizState[path];
        saveQuizState(quizState);
      }
      if (getSelectedItem() === path) {
        setSelectedItem(null);
      }
    }

    saveDirectory(directory);
    saveContent(content);
    saveState();

    const filetreeContainer = document.querySelector(".filetree");
    filetreeContainer.innerHTML = "";
    uiFunctions.createFileTree([directory], filetreeContainer);
    uiFunctions.displayFileContent(getSelectedItem());
    uiFunctions.closePopupMenu();
  }
}

export function renameItem(
  path,
  newName,
  errorContainer,
  directory,
  content,
  uiFunctions,
) {
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

      const newOpenFolders = openFolders.map((p) =>
        p.startsWith(oldPath) ? p.replace(oldPath, newPath) : p,
      );
      openFolders.length = 0;
      openFolders.push(...newOpenFolders);

      if (getSelectedItem() && getSelectedItem().startsWith(oldPath)) {
        setSelectedItem(getSelectedItem().replace(oldPath, newPath));
      }

      const quizState = getQuizState();
      if (quizState[oldPath]) {
        quizState[newPath] = quizState[oldPath];
        delete quizState[oldPath];
        saveQuizState(quizState);
      }

      saveDirectory(directory);
      saveContent(content);
      saveState();

      const filetreeContainer = document.querySelector(".filetree");
      filetreeContainer.innerHTML = "";
      uiFunctions.createFileTree([directory], filetreeContainer);
      const renamePopup = document.querySelector(".creation-popup");
      if (renamePopup) {
        document.body.removeChild(renamePopup);
      }
      uiFunctions.closePopupMenu();
    }
  }
}
