const router = require('express').Router()
const User = require('../Models/userDetails')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const JWT_SECRET = "fdsfdsdcdswere()fdsfds32423fscdsf343fdfdfdfxasdggg"

//Register new user
router.post('/register', async (req, res) => {
    const { firstname, lastname, username,
        email, password } = req.body;
    
    //Encrypt password
    const encrypedPassword = await bcrypt.hash(password, 10);

    try {
        //checks if the user already exist in database
        const oldUser = await User.findOne({ 'email': email });
        if (oldUser) {
            return res.send({ status: "User Exists" });
        }

        //create new user
        const newUser = await User.create({
            firstname,
            lastname,
            username,
            email,
            password: encrypedPassword,
            business: [],
            myAppointments: [],
        });

        res.send(newUser)
    } catch (error) {
        res.send({ status: "error" })
    }
})

//Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    //checks if the user exist in database
    const user = await User.findOne({ 'email': email });
    if (!user) {
        return res.json({ error: "User Not Found" });
    }
    //Checks if the password match to encrypt password
    if (await bcrypt.compare(password, user.password)) {
        jwt.sign({ email: user.email }, JWT_SECRET);

        if (res.status(201)) {
            return res.json(user);
        } else {
            return res.json({ status: "error" });
        }
    }
    res.json({ status: "error", error: "Invalid Password" })
})

module.exports = router;