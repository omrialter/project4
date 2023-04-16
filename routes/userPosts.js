const express = require("express");
const { UserPostModel, validateUserPosts } = require("../models/userPostModel");
const router = express.Router();
const { auth } = require("../auth/auth");
const { UserModel } = require("../models/userModel");




// get all the post of the users you following 
// Domain/userPosts
router.get("/", auth, async (req, res) => {
    let perPage = 10;
    let page = req.query.page - 1 || 0;
    let sort = req.query.sort || "date_created";
    let reverse = (req.query.reverse == "yes") ? 1 : -1;
    try {

        const allPosts = await UserPostModel.find({ $or: [{ user_id: req.tokenData._id }, { user_id: req.tokenData.followings }] }).
            limit(perPage)
            .skip(page * perPage)
            .sort({ [sort]: reverse });


        res.json(allPosts);

    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})

// search posts by title or description
// Domain/userPosts/search/?s=tel aviv
router.get("/search", auth, async (req, res) => {
    let s = req.query.s;
    let searchExp = new RegExp(s, "i");
    try {
        let data = await UserPostModel.find({ $or: [{ user_id: req.tokenData._id }, { user_id: req.tokenData.followings }] }).find({ description: searchExp }).limit(10)
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})
// get a single post by its id
// Domain/userPosts/single/(id of the post)
router.get("/single/:id", async (req, res) => {
    try {
        let data = await UserPostModel.findById(req.params.id);
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})

//Post a new post 
// Domain/userPosts
router.post("/", auth, async (req, res) => {
    let validBody = validateUserPosts(req.body);
    if (validBody.error) {
        console.log("not valid body")
        return res.status(400).json(validBody.error.details)
    }
    try {
        let userPost = new UserPostModel(req.body);
        userPost.user_name = req.tokenData.user_name;
        userPost.user_id = req.tokenData._id;
        await userPost.save();
        res.status(201).json(userPost);

    }
    catch (err) {
        console.log(err);
        res.status(502).json({ msg: "An error occurred while trying to save the post." })
    }
})

// Update a post
// Domain/userPosts/(id of the post)
router.put("/:id", auth, async (req, res) => {
    let validBody = validateUserPosts(req.body);

    if (validBody.error) {
        return res.status(400).json(validBody.error.details)
    }
    try {
        let id = req.params.id;
        let data;
        if (req.tokenData.role == "admin") {
            data = await UserPostModel.updateOne({ _id: id }, req.body);
        }
        else {
            data = await UserPostModel.updateOne({ _id: id, user_id: req.tokenData._id }, req.body);
        }
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})


// Delete a post 
// Domain/userPosts/(id of the post)
router.delete("/:id", auth, async (req, res) => {
    try {
        let id = req.params.id;
        let data;
        if (req.tokenData.role == "admin") {
            data = await UserPostModel.deleteOne({ _id: id });
        }
        else {
            data = await UserPostModel.deleteOne({ _id: id, user_id: req.tokenData._id });
        }
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})

//like a post
//userPosts/like/(id of the post)
router.put("/like/:id", auth, async (req, res) => {
    try {
        let id = req.params.id;
        const post = await UserPostModel.findById(id);

        if (!post.likes.includes(req.tokenData._id)) {
            await post.updateOne({ $push: { likes: req.tokenData._id } });
            res.json("post has been liked ")

        } else {
            await post.updateOne({ $pull: { likes: req.tokenData._id } });
            res.status(403).json("post has been unliked ");
        }
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }



})


module.exports = router;