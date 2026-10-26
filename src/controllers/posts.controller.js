const postsService = require("../services/posts.service");
const {
  parsePagination,
  parseSort,
  createMeta,
} = require("../utils/pagination");

function parseId(rawId) {
  if (!/^[1-9]\d*$/.test(rawId)) {
    return null;
  }

  const parsedId = Number(rawId);
  return Number.isSafeInteger(parsedId) ? parsedId : null;
}

function parseDate(inputDate) {
  if (
    typeof inputDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(inputDate)
  ) {
    return null;
  }

  const parsed = new Date(`${inputDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10) === inputDate ? parsed : null;
}

async function getOne(req, res, next) {
  const postId = parseId(req.params.id);
  if (postId === null) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const targetPost = await postsService.getPostById(postId);
    if (!targetPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json(targetPost);
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  const paging = parsePagination(req.query);
  if (paging.error) {
    return res.status(400).json({ error: paging.error });
  }

  const sortOptions = parseSort(
    req.query,
    ["createdAt", "updatedAt", "likes"],
    "sortBy must be one of: createdAt, updatedAt, likes",
  );
  if (sortOptions.error) {
    return res.status(400).json({ error: sortOptions.error });
  }

  const filters = {};

  if (req.query.location !== undefined) {
    if (typeof req.query.location !== "string") {
      return res.status(400).json({ error: "location must be a string" });
    }
    filters.location = {
      equals: req.query.location,
      mode: "insensitive",
    };
  }

  if (req.query.search !== undefined) {
    if (typeof req.query.search !== "string") {
      return res.status(400).json({ error: "search must be a string" });
    }
    filters.caption = {
      contains: req.query.search,
      mode: "insensitive",
    };
  }

  const fromDate = req.query.from === undefined ? undefined : parseDate(req.query.from);
  const toDate = req.query.to === undefined ? undefined : parseDate(req.query.to);

  if (
    (req.query.from !== undefined && fromDate === null) ||
    (req.query.to !== undefined && toDate === null)
  ) {
    return res.status(400).json({ error: "from and to must be valid dates" });
  }

  if (fromDate !== undefined || toDate !== undefined) {
    filters.createdAt = {
      ...(fromDate !== undefined ? { gte: fromDate } : {}),
      ...(toDate !== undefined ? { lt: toDate } : {}),
    };
  }

  try {
    const postsResult = await postsService.listPosts({
      ...paging,
      ...sortOptions,
      where: filters,
    });

    return res.status(200).json({
      data: postsResult.data,
      meta: createMeta(paging.page, paging.limit, postsResult.total),
    });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  const postBody = req.body || {};
  const { imageUrl, authorId, caption, location } = postBody;

  if (
    typeof imageUrl !== "string" ||
    !imageUrl ||
    !Number.isSafeInteger(authorId) ||
    authorId < 1
  ) {
    return res
      .status(400)
      .json({ error: "imageUrl and authorId are required" });
  }

  try {
    const createdPost = await postsService.createPost({
      imageUrl,
      authorId,
      ...(caption !== undefined ? { caption } : {}),
      ...(location !== undefined ? { location } : {}),
    });
    return res.status(201).json(createdPost);
  } catch (err) {
    if (err.code === "P2003") {
      return res.status(404).json({ error: "User not found" });
    }
    return next(err);
  }
}

async function update(req, res, next) {
  const postId = parseId(req.params.id);
  if (postId === null) {
    return res.status(404).json({ error: "Post not found" });
  }

  const patchData = {};
  const allowedAttributes = ["caption", "location"];

  for (const attr of allowedAttributes) {
    if (Object.hasOwn(req.body || {}, attr)) {
      patchData[attr] = req.body[attr];
    }
  }

  try {
    const modifiedPost = await postsService.updatePost(postId, patchData);
    if (!modifiedPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json(modifiedPost);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  const postId = parseId(req.params.id);
  if (postId === null) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const hasRemoved = await postsService.deletePost(postId);
    if (!hasRemoved) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

async function listLikes(req, res, next) {
  const postId = parseId(req.params.id);
  if (postId === null) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const likedUsers = await postsService.listPostLikes(postId);
    if (likedUsers === null) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json(likedUsers);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  list,
  getOne,
  listLikes,
  update,
  remove,
};
