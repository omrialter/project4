const indexR = require("./index");
const usersR = require("./users");
const userPostsR = require("./userPosts");
const commentsR = require("./comments");






exports.routesInit = (app) => {
  app.use("/", indexR);
  app.use("/users", usersR);
  app.use("/userPosts", userPostsR);
  app.use("/comments", commentsR);
}