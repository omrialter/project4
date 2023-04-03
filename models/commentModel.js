const mongoose = require("mongoose");
const Joi = require("joi");

let schema = new mongoose.Schema({
    text: String,
    date_created: {
        type: Date, default: Date.now
    },
    user_id: String,
    post_id: String
})
exports.CommentModel = mongoose.model("comments", schema)

exports.validateComments = (_reqBody) => {
    let joiSchema = Joi.object({
        text: Joi.string().min(2).max(400).required(),
    })
    return joiSchema.validate(_reqBody)
}