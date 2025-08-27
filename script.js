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

document.querySelectorAll(".filetree .expand-collapse").forEach((button) => {
  button.addEventListener("click", () => {
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
  });
});

const nav = document.querySelector("nav");
const main = document.querySelector("main");
const resizer = document.querySelector(".resizer");
const filetree = document.querySelector(".filetree");

const resize = (e) => {
  const newNavWidth = e.clientX;
  nav.style.width = `${newNavWidth}px`;
  main.style.width = `calc(100vw - ${newNavWidth}px)`;
};

resizer.addEventListener("mousedown", (e) => {
  e.preventDefault();
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", () => {
    document.removeEventListener("mousemove", resize);
  });
});