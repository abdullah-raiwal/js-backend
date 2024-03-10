// const swaggerJSDoc = require("swagger-jsdoc");

import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0", // Indicate Swagger specification version
  info: {
    title: "youtube-backend", // Descriptive API title
    version: "1.0.0", // API version
    description: "Detailed description of your API",
  },
  servers: [
    { url: "http://localhost:8000" }, // Replace with your API's base URL
  ],
};

const options = {
  // Provide paths to API endpoint definitions (explained later)
  apis: ["./routes/*.js"], // Adjust path based on your route files
};

const swaggerSpec = swaggerJSDoc(swaggerDefinition, options);

module.exports = swaggerSpec;
