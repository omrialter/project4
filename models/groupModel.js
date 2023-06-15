const mongoose = require("mongoose");
const Joi = require("joi");

let schema = new mongoose.Schema({
    description: String,
    name: String,
    user_id: String,
    coverPic: {
        type: String, default: ""
    },
    members: {
        type: Array, default: []
    },
    date_created: {
        type: Date, default: Date.now
    },

})
exports.groupModel = mongoose.model("groups", schema)

exports.validateGroups = (_reqBody) => {
    let joiSchema = Joi.object({
        description: Joi.string().min(1).max(500).allow(null, ""),
        name: Joi.string().min(2).max(40).required(),
    })
    return joiSchema.validate(_reqBody)
}