const express = require("express");
const dotenv = require('dotenv');
dotenv.config();
const cors = require("cors");
require('./Models/mongoConnect')
// const helmet = require('helmet');
// const morgan = require('morgan');

const bodyParser = require('body-parser')
const userRoute = require('./Routes/users.route')
const authRoute = require('./Routes/auth.route')
const businessRoute = require('./Routes/business.route')
const calenderRoute = require('./Routes/calander.route')

const app = express();

//Middleware
app.use(cors());
app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(helmet())
// app.use(morgan('common'))

//Routes
app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/business', businessRoute);
app.use('/api/calender', calenderRoute);

app.get("/", () => {
    console.log('Hello from Bizweb server')
})
//Connection to server
const port = process.env.PORT || 5015;
app.listen(port, () => {
    console.log("Server Started with http://localhost:" + port + "/");
})