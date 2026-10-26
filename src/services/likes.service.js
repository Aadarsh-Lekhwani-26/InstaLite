const db = require("../db");

function createLike(targetUserId, targetPostId) {
  return db.like.create({
    data: {
      userId: targetUserId,
      postId: targetPostId,
    },
  });
}

async function deleteLike(targetUserId, targetPostId) {
  try {
    await db.like.delete({
      where: {
        userId_postId: {
          userId: targetUserId,
          postId: targetPostId,
        },
      },
    });
    return true;
  } catch (err) {
    if (err.code === "P2025") {
      return false;
    }
    throw err;
  }
}

function userExists(targetUserId) {
  return db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });
}

function postExists(targetPostId) {
  return db.post.findUnique({
    where: { id: targetPostId },
    select: { id: true },
  });
}

module.exports = {
  createLike,
  deleteLike,
  userExists,
  postExists,
};
