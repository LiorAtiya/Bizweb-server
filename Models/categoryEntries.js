const mongoose = require('mongoose')

const CategoryEntriesSchema = mongoose.Schema({
    firstname: String,
    lastname: String,
    username: String,
    email: String,
    category: String,
})

module.exports = mongoose.model("CategoryEntries", CategoryEntriesSchema);