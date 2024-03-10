const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "youtube backend with express js",
      version: "0.1.0",
      description:
        "this backend projects manuplates youtube like behaviour. for polishing backend skills",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
    },
    servers: [
      {
        url: "http://localhost:8000",
      },
    ],
  },
  apis: ["./src/controllers/*.js"],
};

export { options };
