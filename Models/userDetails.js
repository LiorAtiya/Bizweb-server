const mongoose = require("mongoose");

const UserDetailsSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    username: String,
    email: String,
    password: String,
    business: {
        type: Array,
        default: [],
    },
    myAppointments: {
        type: Array,
        default: [],
    },
    myShoppingCart: {
        type: Array,
        default: [],
    }
},
    { timestamps: true }
);

module.exports = mongoose.model("UserDetails", UserDetailsSchema);