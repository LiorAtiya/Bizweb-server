const mongoose = require("mongoose");

const BusinessDetailsSchema = new mongoose.Schema({
    category: {
        type: String,
        require: true,
        default: ""
    },
    name: {
        type: String,
        require: true,
        default: ""
    },
    description: {
        type: String,
        require: true,
        default: ""
    },
    gallery: Array,
    reviews: Array,
    shop: Array,
    city: {
        type: String,
        require: true,
        default: ""
    },
    address: {
        type: String,
        require: true,
        default: ""
    },
    coordination: {
        type: Object,
        require: true,
    },
    phone: {
        type: Number,
        require: true,
    },
    backgroundPicture: {
        type: String,
        require: true,
    },
    tabs: Array
},
    { timestamps: true }
);

module.exports = mongoose.model("BusinessDetails", BusinessDetailsSchema);