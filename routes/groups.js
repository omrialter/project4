const express = require("express");
const { validateGroups, GroupModel } = require("../models/groupModel");
const router = express.Router();
const { auth } = require("../auth/auth");

router.get("/", async (req, res) => {
    res.json({ msg: "Express homepage work" });
})

router.post("/", auth, async (req, res) => {
    let validBody = validateGroups(req.body);
    if (validBody.error) {
        console.log("not valid body")
        return res.status(400).json(validBody.error.details)
    }
    try {
        let group = new GroupModel(req.body);
        group.group_admin = req.tokenData._id;
        await group.save();
        res.status(201).json(group);

    }
    catch (err) {
        console.log(err);
        res.status(502).json({ msg: "An error occurred while trying to save the group." })
    }
})
module.exports = router;