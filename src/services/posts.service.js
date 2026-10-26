const db = require("../db");

function getPostById(postId) {
  return db.post.findUnique({
    where: { id: postId },
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
  });
}

function createPost(payload) {
  return db.post.create({ data: payload });
}

async function updatePost(postId, payload) {
  const updateOutcome = await db.post.updateMany({
    where: { id: postId },
    data: payload,
  });

  if (updateOutcome.count === 0) {
    return null;
  }

  return getPostById(postId);
}

async function deletePost(postId) {
  const deleteOutcome = await db.post.deleteMany({
    where: { id: postId },
  });

  return deleteOutcome.count > 0;
}

function listPosts({ page, limit, skip, sortBy, order, where }) {
  const sortRules =
    sortBy === "likes"
      ? [{ likes: { _count: order } }, { createdAt: "desc" }]
      : [{ [sortBy]: order }];

  return db
    .$transaction([
      db.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortRules,
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
      db.post.count({ where }),
    ])
    .then(([posts, count]) => ({
      data: posts,
      total: count,
      page,
      limit,
    }));
}

async function listPostLikes(postId) {
  const targetPost = await db.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!targetPost) {
    return null;
  }

  const likedEntries = await db.like.findMany({
    where: { postId },
    orderBy: { user: { username: "asc" } },
    select: {
      user: {
        select: {
          id: true,
          username: true,
          fullname: true,
        },
      },
    },
  });

  return likedEntries.map(({ user }) => user);
}

module.exports = {
  getPostById,
  createPost,
  updatePost,
  deletePost,
  listPosts,
  listPostLikes,
};
