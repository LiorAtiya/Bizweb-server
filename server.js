const express = require("express");
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require("cors");
const bodyParser = require('body-parser')

const userRoute = require('./Routes/users')
const authRoute = require('./Routes/auth')
const businessRoute = require('./Routes/business')
const calenderRoute = require('./Routes/calander')

//WebSocket
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();
const app = express();

//============ Connection to database ================   
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
})
    .then(() => {
        console.log("Connected to database");
    })
    .catch((e) => console.log(e));

//============ Connection to socket ================   
io.on('connection', socket => {
    console.log('New client connected');

    socket.on('newAppointment', appointment => {
        console.log(`Message received: ${appointment}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

//Middleware
app.use(express.json())
app.use(helmet())
app.use(morgan('common'))
app.use(cors());
app.use(bodyParser.json())

//Routes
app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/business', businessRoute);
app.use('/api/calender', calenderRoute);

//Home page
app.get('/', (req, res) => {
    res.send('Hello From server of Facework')
})

const port = process.env.PORT || 5015;
// const port = 5015
app.listen(port, () => {
    console.log("Server Started with http://localhost:" + port + "/");
})