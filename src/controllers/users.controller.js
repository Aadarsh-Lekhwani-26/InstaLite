const usersService = require("../services/users.service");
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

async function getOne(req, res, next) {
  const userId = parseId(req.params.id);
  if (userId === null) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const foundUser = await usersService.getUserById(userId);
    if (!foundUser) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(foundUser);
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
    ["createdAt", "username", "fullname"],
    "sortBy must be one of: createdAt, username, fullname",
  );
  if (sortOptions.error) {
    return res.status(400).json({ error: sortOptions.error });
  }

  let privacySetting;
  if (req.query.isPrivate !== undefined) {
    if (req.query.isPrivate !== "true" && req.query.isPrivate !== "false") {
      return res
        .status(400)
        .json({ error: "isPrivate must be true or false" });
    }
    privacySetting = req.query.isPrivate === "true";
  }

  const filterConditions = {};

  if (privacySetting !== undefined) {
    filterConditions.isPrivate = privacySetting;
  }

  if (req.query.search !== undefined) {
    if (typeof req.query.search !== "string") {
      return res.status(400).json({ error: "search must be a string" });
    }
    filterConditions.OR = [
      { username: { contains: req.query.search, mode: "insensitive" } },
      { fullname: { contains: req.query.search, mode: "insensitive" } },
    ];
  }

  if (req.query.hasPosts !== undefined) {
    if (req.query.hasPosts !== "true" && req.query.hasPosts !== "false") {
      return res.status(400).json({ error: "hasPosts must be true or false" });
    }
    filterConditions.posts = req.query.hasPosts === "true" ? { some: {} } : { none: {} };
  }

  try {
    const usersResult = await usersService.listUsers({
      ...paging,
      ...sortOptions,
      where: filterConditions,
    });

    return res.status(200).json({
      data: usersResult.data,
      meta: createMeta(paging.page, paging.limit, usersResult.total),
    });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  const userPayload = req.body || {};
  const { username, email, fullname, bio } = userPayload;

  if (
    typeof username !== "string" ||
    !username ||
    typeof email !== "string" ||
    !email ||
    typeof fullname !== "string" ||
    !fullname
  ) {
    return res
      .status(400)
      .json({ error: "username, email and fullname are required" });
  }

  try {
    const createdUser = await usersService.createUser({
      username,
      email,
      fullname,
      ...(bio !== undefined ? { bio } : {}),
    });
    return res.status(201).json(createdUser);
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "username or email already taken" });
    }
    return next(err);
  }
}

async function update(req, res, next) {
  const userId = parseId(req.params.id);
  if (userId === null) {
    return res.status(404).json({ error: "User not found" });
  }

  const patchFields = {};
  const updatableKeys = ["fullname", "bio", "isPrivate"];

  for (const key of updatableKeys) {
    if (Object.hasOwn(req.body || {}, key)) {
      patchFields[key] = req.body[key];
    }
  }

  try {
    const updatedUser = await usersService.updateUser(userId, patchFields);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(updatedUser);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  const userId = parseId(req.params.id);
  if (userId === null) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const isDeleted = await usersService.deleteUser(userId);
    if (!isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

async function listPosts(req, res, next) {
  const userId = parseId(req.params.id);
  if (userId === null) {
    return res.status(404).json({ error: "User not found" });
  }

  const paging = parsePagination(req.query);
  if (paging.error) {
    return res.status(400).json({ error: paging.error });
  }

  try {
    const postsResult = await usersService.listUserPosts(userId, paging);
    if (postsResult === null) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({
      data: postsResult.data,
      meta: createMeta(paging.page, paging.limit, postsResult.total),
    });
  } catch (err) {
    return next(err);
  }
}

async function listLikedPosts(req, res, next) {
  const userId = parseId(req.params.id);
  if (userId === null) {
    return res.status(404).json({ error: "User not found" });
  }

  const paging = parsePagination(req.query);
  if (paging.error) {
    return res.status(400).json({ error: paging.error });
  }

  try {
    const likedResult = await usersService.listLikedPosts(userId, paging);
    if (likedResult === null) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({
      data: likedResult.data,
      meta: createMeta(paging.page, paging.limit, likedResult.total),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  list,
  getOne,
  listPosts,
  listLikedPosts,
  update,
  remove,
};
