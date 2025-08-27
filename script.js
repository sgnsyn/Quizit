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
