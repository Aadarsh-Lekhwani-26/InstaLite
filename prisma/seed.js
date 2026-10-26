const dbClient = require("../src/db");
const { users: seedUsers, posts: seedPosts, likes: seedLikes } = require("./seed-data");

async function runSeed() {
  try {
    await dbClient.like.deleteMany();
    await dbClient.post.deleteMany();
    await dbClient.user.deleteMany();

    const createdUserRows = await dbClient.user.createManyAndReturn({
      data: seedUsers.map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt),
      })),
    });

    const userIdLookup = new Map(
      createdUserRows.map((user) => [user.username, user.id]),
    );

    const createdPostRows = await dbClient.post.createManyAndReturn({
      data: seedPosts.map(({ author, ...postInfo }) => {
        const authorId = userIdLookup.get(author);
        if (authorId === undefined) {
          throw new Error(`Unknown post author: ${author}`);
        }

        return {
          ...postInfo,
          authorId,
          createdAt: new Date(postInfo.createdAt),
        };
      }),
    });

    const postIdLookup = new Map(
      createdPostRows.map((post) => [
        post.imageUrl.split("/")[4],
        post.id,
      ]),
    );

    const likeRecords = seedLikes.map(({ user, post }) => {
      const userId = userIdLookup.get(user);
      const postId = postIdLookup.get(post);

      if (userId === undefined) {
        throw new Error(`Unknown user in like data: ${user}`);
      }
      if (postId === undefined) {
        throw new Error(`Unknown post in like data: ${post}`);
      }

      return { userId, postId };
    });

    const createdLikesResult = await dbClient.like.createMany({
      data: likeRecords,
    });

    console.log(
      `🌱 Seeded ${createdUserRows.length} users, ${createdPostRows.length} posts and ${createdLikesResult.count} likes`,
    );
  } catch (seedErr) {
    console.error(seedErr);
    process.exitCode = 1;
  } finally {
    try {
      await dbClient.$disconnect();
    } catch (disconnectErr) {
      console.error(disconnectErr);
      process.exitCode = 1;
    }
  }
}

runSeed();
