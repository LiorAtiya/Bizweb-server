const mongoose = require('mongoose')

const CalenderSchema = mongoose.Schema({
    businessID: String,
    dates: Array,
    availableHours: Array,
})

module.exports = mongoose.model("Calender", CalenderSchema);