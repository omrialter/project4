const mongoose = require("mongoose");
const Joi = require("joi");

let schema = new mongoose.Schema({
    description: String,
    user_name: String,
    user_id: String,
    img_url: String,
    likes: {
        type: Array, default: []
    },
    date_created: {
        type: Date, default: Date.now
    },

})
exports.UserPostModel = mongoose.model("userPosts", schema)

exports.validateUserPosts = (_reqBody) => {
    let joiSchema = Joi.object({
        description: Joi.string().min(1).max(500).allow(null, ""),
        img_url: Joi.string().min(2).max(1000).required(),
    })
    return joiSchema.validate(_reqBody)
}