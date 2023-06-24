const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UserModel, validateUser, validateLogin, createToken, validateUpdate, validateChangePass } = require("../models/userModel")
const { auth, authAdmin } = require("../auth/auth.js");
const { UserPostModel } = require("../models/userPostModel");
const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ msg: "Users work" });
})

// only check the token 
router.get("/checkToken", auth, async (req, res) => {
  res.json({ _id: req.tokenData._id, role: req.tokenData.role });
})


// Get user info 
// Domain/users/userInfo
router.get("/userInfo", auth, async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 })
    res.json(user)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

//get other user info (only admin)
//Domain/users/OtherInfo
router.get("/OtherInfo/:id", authAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    let user = await UserModel.findOne({ _id: id }, { password: 0 })
    res.json(user)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

// Get user info (clinet)
// Domain/users/userInfo?user_name=koko
router.get("/otherUserInfo", auth, async (req, res) => {
  try {
    let { user_name } = req.query; // Retrieve user_name from query parameter
    let user = await UserModel.findOne({ user_name }, { password: 0 });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

//get all users(only admin)
//Domain/users/userList
router.get("/usersList", authAdmin, async (req, res) => {
  try {
    let perPage = req.query.perPage || 5;
    let page = req.query.page - 1 || 0;
    let data = await UserModel
      .find({}, { password: 0 })
      .limit(perPage)
      .skip(page * perPage)
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/count", async (req, res) => {
  try {
    let perPage = req.query.perPage || 5;
    const count = await UserModel.countDocuments({});
    res.json({ count, pages: Math.ceil(count / perPage) });
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


// Create a new user
// Domain/users
router.post("/", async (req, res) => {
  let validBody = validateUser(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details)
  }
  try {
    let user = new UserModel(req.body);
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user.password = "******";
    res.json(user);
  }
  catch (err) {
    console.log(err);
    if (err.code == 11000) {
      res.status(400).json({ msg: "email already exist", code: 11000 })
    }

  }
})

// Log in to get a token
// Domain/users/login

router.post("/login", async (req, res) => {
  let validBody = validateLogin(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  let user = await UserModel.findOne({ user_name: req.body.user_name });
  if (!user) {
    return res.status(401).json({ msg: "user_name not found" });
  }
  let passValid = await bcrypt.compare(req.body.password, user.password);
  if (!passValid) {
    return res.status(401).json({ msg: `problem with the password` });
  }
  let newToken = createToken(user._id, user.role, user.followings, user.email, user.user_name)
  res.json({ token: newToken });

})

// Update user (you cant update password or email)
// Domain/users/(id of the user you want to update)

router.put("/:id", auth, async (req, res) => {
  let validBody = validateUpdate(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details)
  }
  try {
    let id = req.params.id.trim();
    let data;
    if (req.tokenData.role == "admin") {
      data = await UserModel.updateOne({ _id: id }, req.body);
    } else if (id == req.tokenData._id) {
      data = await UserModel.updateOne({ _id: id }, req.body);
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})
// change password
// Domain/users/changePass/(id of the user)

router.put("/changePass/:id", auth, async (req, res) => {
  let validBody = validateChangePass(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details)
  }
  try {
    let id = req.params.id;
    let user = await UserModel.findById(id);
    if (req.tokenData.role == "admin") {
      user.password = req.body.newPassword;
      user.password = await bcrypt.hash(user.password, 10);
      await UserModel.updateOne({ _id: id }, { password: user.password });
      user = await user.save();
    }
    let email = await UserModel.findOne({ email: req.body.email });
    if (!email) {
      return res.status(401).json({ msg: "email or password  not found" });
    }
    if (req.body.email != req.tokenData.email) {
      return res.status(401).json({ msg: "problem with the email" });
    }
    let passValid = await bcrypt.compare(req.body.password, user.password);
    if (!passValid) {
      return res.status(401).json({ msg: `problem with the password` });
    }
    if (id == req.tokenData._id) {
      user.password = req.body.newPassword;
      user.password = await bcrypt.hash(user.password, 10);
      await UserModel.updateOne({ _id: id }, { password: user.password });
      user = await user.save();
    }
    res.json(user);
    console.log(user);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


// Delete
// Domain/users/(id of the user)
router.delete("/:id", auth, async (req, res) => {
  let id = req.params.id;
  let data;
  try {
    if (req.tokenData.role == "admin" && id != "643aeef089f3063e797886ae") {
      data = await UserModel.deleteOne({ _id: id });
    }
    else if (id == req.tokenData._id) {
      data = await UserModel.deleteOne({ _id: id });
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }

})

//follow other user
//Domain/users/follow/(id of the user you want to follow)

router.put("/follow/:id", auth, async (req, res) => {
  if (req.tokenData._id != req.params.id) {
    try {
      const user = await UserModel.findById(req.params.id);
      const currentUser = await UserModel.findById(req.tokenData._id);
      if (!user.followers.includes(req.tokenData._id)) {
        await user.updateOne({ $push: { followers: req.tokenData._id } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        res.json("user has been followed ")

      } else {
        res.status(403).json("you already follow this user");
      }
    }
    catch (err) {
      console.log(err);
      res.status(502).json({ err })
    }

  }
  else {
    res.status(403).json("you cant follow yourself")
  }
})

//unfollow other user
//Domain/users/follow/(id of the user you want to unfollow)

router.put("/unfollow/:id", auth, async (req, res) => {
  if (req.tokenData._id != req.params.id) {
    try {
      const user = await UserModel.findById(req.params.id);
      const currentUser = await UserModel.findById(req.tokenData._id);
      if (user.followers.includes(req.tokenData._id)) {
        await user.updateOne({ $pull: { followers: req.tokenData._id } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        res.json("user has unfollowed ")
      } else {
        res.status(403).json("you dont follow this user");
      }
    }
    catch (err) {
      console.log(err);
      res.status(502).json({ err })
    }
  }
  else {
    res.status(403).json("you cant unfollow yourself")
  }
})

//change user role
//Domain/users/changeRole/(id of the user)/admin\user
router.patch("/changeRole/:id/:role", authAdmin, async (req, res) => {
  const id = req.params.id;
  const newRole = req.params.role;
  try {
    if (id == req.tokenData._id || id == "643aeef089f3063e797886ae") {
      return res.status(401).json({ err: "You cant change your role! or the super admin" })
    }
    const data = await UserModel.updateOne({ _id: id }, { role: newRole })
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


router.put("/savePost/:id", auth, async (req, res) => {
  try {
    let id = req.params.id;
    const user = await UserModel.findById(req.tokenData._id);

    if (!user.saved_posts.includes(id)) {
      await user.updateOne({ $push: { saved_posts: id } });
      res.json("post has been saved ")

    } else {
      await user.updateOne({ $pull: { saved_posts: id } });
      res.status(403).json("post has been unsaved ");
    }
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }


})



module.exports = router;