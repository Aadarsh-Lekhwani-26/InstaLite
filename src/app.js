const express = require("express");

const userRoutes = require("./routes/users.routes");
const postRoutes = require("./routes/posts.routes");

const serverApp = express();

serverApp.use(express.json());

serverApp.get("/health", (request, response) => {
  response.status(200).json({ status: "OK" });
});

serverApp.use("/users", userRoutes);
serverApp.use("/posts", postRoutes);

serverApp.use((err, _request, response, _next) => {
  console.error(err);
  response.status(500).json({ error: "Internal server error" });
});

module.exports = serverApp;
