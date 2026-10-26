const express = require("express");
const usersController = require("../controllers/users.controller");

const usersRouter = express.Router();

// User collection routes
usersRouter.get("/", usersController.list);
usersRouter.post("/", usersController.create);

// Individual user item routes
usersRouter.get("/:id", usersController.getOne);
usersRouter.patch("/:id", usersController.update);
usersRouter.delete("/:id", usersController.remove);

// User relation routes
usersRouter.get("/:id/posts", usersController.listPosts);
usersRouter.get("/:id/liked-posts", usersController.listLikedPosts);

module.exports = usersRouter;
