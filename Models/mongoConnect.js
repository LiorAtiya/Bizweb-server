const mongoose = require("mongoose");   
mongoose.set("strictQuery", true);

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
})
    .then(() => {
        console.log("Connected to database");
    })
    .catch((e) => console.log(e));
