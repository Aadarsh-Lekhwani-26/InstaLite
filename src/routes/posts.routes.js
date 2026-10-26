const express = require("express");

const postsController = require("../controllers/posts.controller");
const likesController = require("../controllers/likes.controller");

const postsRouter = express.Router();

// Post collection endpoints
postsRouter.get("/", postsController.list);
postsRouter.post("/", postsController.create);

// Single post endpoints
postsRouter.get("/:id", postsController.getOne);
postsRouter.patch("/:id", postsController.update);
postsRouter.delete("/:id", postsController.remove);

// Post like association endpoints
postsRouter.get("/:id/likes", postsController.listLikes);
postsRouter.post("/:id/likes", likesController.create);
postsRouter.delete("/:id/likes/:userId", likesController.remove);

module.exports = postsRouter;
