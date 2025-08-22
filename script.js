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
              children: [{ type: "content", name: "lesson1" }],
            },
          ],
        },
      ],
    },
    { type: "content", name: "welcome" },
  ],
};

function themeHandler(currentTheme) {
  if (currentTheme == "dark") {
    document.body.classList.add("light");
    currentTheme = "light";
  } else {
    document.body.classList.remove("light");
    currentTheme = "dark";
  }
}
