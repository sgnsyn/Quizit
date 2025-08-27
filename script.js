const directory = {
  type: "folder",
  name: "root",
  children: [
    {
      type: "folder",
      name: "web",
      children: [
        {
          type: "folder",
          name: "html",
          children: [
            {
              type: "folder",
              name: "lessons",
              children: [{ type: "file", name: "lesson1" }],
            },
          ],
        },
      ],
    },
    { type: "file", name: "welcome" },
  ],
};

const content = {
  "root/web/html/lessons/lesson1": "This is the content of lesson1",
  "root/welcome": "This is the content of welcome",
};

const filetreeContainer = document.querySelector(".filetree");
const mainElement = document.querySelector("main");
const fileContnet = document.querySelector(".file-content");
const dirDisplay = document.querySelector(".directory-display");
const navToggleBtn = document.querySelector(".nav-expand-collapse");
let popupMenu = null;

navToggleBtn.addEventListener("click", navToggleHandler);
function navToggleHandler() {
  filetreeContainer.classList.toggle("disabled");
  document.querySelector("nav").classList.toggle("collapsed");
  navToggleBtn.closest(".nav-header").classList.toggle("collapsed");
  dirDisplay.classList.toggle("collapsed");
}

function closePopupMenu() {
  if (popupMenu) {
    popupMenu.remove();
    popupMenu = null;
  }
}

function showPopupMenu(button) {
  closePopupMenu(); // Close any existing menu

  const parent = button.parentElement;
  const isFolder = parent.classList.contains("current-dir");

  popupMenu = document.createElement("div");
  popupMenu.className = "popup-menu visible";
  const menuList = document.createElement("ul");

  if (isFolder) {
    menuList.innerHTML = `
            <li data-action=\"create-file\">Create File</li>
            <li data-action=\"create-folder\">Create Folder</li>
            <li data-action=\"delete-dir\">Delete Folder</li>
        `;
  } else {
    // It's a file
    menuList.innerHTML = `
            <li data-action=\"edit-file\">Edit File</li>
            <li data-action=\"delete-file\">Delete File</li>
        `;
  }

  popupMenu.appendChild(menuList);
  document.body.appendChild(popupMenu);

  const rect = button.getBoundingClientRect();
  popupMenu.style.top = `${rect.bottom}px`;
  popupMenu.style.left = `${rect.left}px`;

  menuList.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (action) {
      console.log(`Action: ${action} on`, parent);
      // TODO: Implement actions
    }
    closePopupMenu();
  });
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

filetreeContainer.addEventListener("click", (e) => {
  const target = e.target;
  if (target.closest(".expand-collapse")) {
    const button = target.closest(".expand-collapse");
    const parentDir = button.closest(".current-dir");
    if (parentDir) {
      const dir = parentDir.parentElement;
      const childDir = dir.querySelector(".child-dir");
      if (childDir) {
        childDir.classList.toggle("collapsed");
      }
      const icon = button.querySelector(".exp-icon");
      if (icon) {
        icon.classList.toggle("collapsed");
      }
    }
  } else if (target.closest(".file-container")) {
    const fileContainer = target.closest(".file-container");
    const path = fileContainer.dataset.path;
    if (path && content[path]) {
      dirDisplay.innerHTML = path;
      fileContnet.innerHTML = `<p>${content[path]}</p>`;
    }
  } else if (target.closest(".three-dot-button")) {
    e.stopPropagation();
    const button = target.closest(".three-dot-button");
    showPopupMenu(button);
  }
});

document.addEventListener("click", (e) => {
  if (
    popupMenu &&
    !popupMenu.contains(e.target) &&
    !e.target.closest(".three-dot-button")
  ) {
    closePopupMenu();
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
