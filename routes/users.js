const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UserModel, validateUser, validateLogin, createToken, validateUpdate, validatePassWordChange } = require("../models/userModel")
const { auth, authAdmin } = require("../auth/auth.js");
const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ msg: "Users work" });
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
    res.status(400).json({ err: "email or user_name already exist" })
    res.status(502).json({ err })
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
  let passValid = bcrypt.compare(req.body.password, user.password);
  if (!passValid) {
    return res.status(401).json({ msg: `problem with the password` });
  }
  let newToken = createToken(user._id, user.role, user.followings)
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
    let id = req.params.id;
    let data;
    if (req.tokenData.role == "admin") {
      data = await UserModel.updateOne({ _id: id }, req.body);
    }
    else {
      data = await UserModel.updateOne({ id: req.tokenData._id }, req.body);
    }
    res.json(data);
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
    if (req.tokenData.role == "admin") {
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
//Domain/users/changeRole/(if of the user)
router.patch("/changeRole/:id/:role", authAdmin, async (req, res) => {
  const id = req.params.id;
  const newRole = req.params.role;
  try {
    if (id == req.tokenData._id || id == "6428534cdba27a455053dbbc") {
      return res.status(401).json({ err: "You cant change your role or the super admin" })
    }
    const data = await UserModel.updateOne({ _id: id }, { role: newRole })
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }

})





module.exports = router;