const indexR = require("./index");
const usersR = require("./users");
const userPostsR = require("./userPosts");
const commentsR = require("./comments");






exports.routesInit = (app) => {
  app.use("/", indexR);
  app.use("/users", usersR);
  app.use("/userPosts", userPostsR);
  app.use("/comments", commentsR);


  app.use("/*", (req, res) => {
    res.status(404).json({ msg: "page not found 404" })
  })

}
