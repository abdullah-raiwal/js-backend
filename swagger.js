import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "My API",
    description: "Description",
  },
  host: "localhost:3000",
};

const outputFile = "./swagger-output.json";
const routes = ["./src/routes/*.js"];

swaggerAutogen(outputFile, routes, doc).then(() => {
  console.log('swagger run');
  require("./src/index.js"); // Your project's root file
});
