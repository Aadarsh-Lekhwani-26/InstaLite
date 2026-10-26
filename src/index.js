require("dotenv/config");

const application = require("./app");

const SERVER_PORT = Number(process.env.PORT) || 3000;

application.listen(SERVER_PORT, () => {
  console.log(`Server started on port ${SERVER_PORT}`);
});
