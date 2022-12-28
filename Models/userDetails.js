const mongoose = require("mongoose");

const UserDetailsSchema = new mongoose.Schema({
    firstname: {
        type: String,
        require: true,
        default: ""
    },
    lastname: {
        type: String,
        require: true,
        default: ""
    },
    username: {
        type: String,
        require: true,
        min: 3,
        unique: true,
    },
    email: {
        type: String,
        require: true,
        max: 50,
        unique: true,
    },
    password: {
        type: String,
        require: true,
        min: 6
    },
    business: {
        type: Array,
        default: [],
    },
    myAppointments: {
        type: Array,
        default: [],
    }
},
    { timestamps: true }
);

module.exports = mongoose.model("UserDetails", UserDetailsSchema);