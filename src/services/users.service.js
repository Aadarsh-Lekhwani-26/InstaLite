const db = require("../db");

function getUserById(userId) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          posts: true,
          likes: true,
        },
      },
    },
  });
}

function createUser(payload) {
  return db.user.create({ data: payload });
}

async function updateUser(userId, payload) {
  const updateOutcome = await db.user.updateMany({
    where: { id: userId },
    data: payload,
  });

  if (updateOutcome.count === 0) {
    return null;
  }

  return getUserById(userId);
}

async function deleteUser(userId) {
  const deleteOutcome = await db.user.deleteMany({
    where: { id: userId },
  });

  return deleteOutcome.count > 0;
}

function listUsers({ page, limit, skip, sortBy, order, where }) {
  return db
    .$transaction([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      db.user.count({ where }),
    ])
    .then(([userList, userCount]) => ({
      data: userList,
      total: userCount,
      page,
      limit,
    }));
}

async function listUserPosts(userId, { page, limit, skip }) {
  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!targetUser) {
    return null;
  }

  const [postRecords, totalPostCount] = await db.$transaction([
    db.post.findMany({
      where: { authorId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { likes: true } },
      },
    }),
    db.post.count({ where: { authorId: userId } }),
  ]);

  return {
    data: postRecords,
    total: totalPostCount,
    page,
    limit,
  };
}

async function listLikedPosts(userId, { page, limit, skip }) {
  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!targetUser) {
    return null;
  }

  const likedCondition = { likes: { some: { userId } } };
  const [likedRecords, totalLikedCount] = await db.$transaction([
    db.post.findMany({
      where: likedCondition,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    }),
    db.post.count({ where: likedCondition }),
  ]);

  return {
    data: likedRecords,
    total: totalLikedCount,
    page,
    limit,
  };
}

module.exports = {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  listUsers,
  listUserPosts,
  listLikedPosts,
};
