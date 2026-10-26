const likesService = require("../services/likes.service");

function parseId(val) {
  if (typeof val === "number") {
    return Number.isSafeInteger(val) && val > 0 ? val : null;
  }
  if (typeof val !== "string" || !/^[1-9]\d*$/.test(val)) {
    return null;
  }

  const parsedNumber = Number(val);
  return Number.isSafeInteger(parsedNumber) ? parsedNumber : null;
}

async function remove(req, res, next) {
  const postId = parseId(req.params.id);
  if (postId === null) {
    return res.status(404).json({ error: "Like not found" });
  }

  const userId = parseId(req.params.userId);
  if (userId === null) {
    return res.status(404).json({ error: "Like not found" });
  }

  try {
    const isRemoved = await likesService.deleteLike(userId, postId);
    if (!isRemoved) {
      return res.status(404).json({ error: "Like not found" });
    }
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  const payload = req.body || {};
  if (!Object.hasOwn(payload, "userId")) {
    return res.status(400).json({ error: "userId is required" });
  }

  const postId = parseId(req.params.id);
  if (postId === null) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const postFound = await likesService.postExists(postId);
    if (!postFound) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userId = parseId(payload.userId);
    if (userId === null) {
      return res.status(404).json({ error: "User not found" });
    }

    const userFound = await likesService.userExists(userId);
    if (!userFound) {
      return res.status(404).json({ error: "User not found" });
    }

    const createdLike = await likesService.createLike(userId, postId);
    return res.status(201).json(createdLike);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Already liked" });
    }
    return next(err);
  }
}

module.exports = {
  create,
  remove,
};
