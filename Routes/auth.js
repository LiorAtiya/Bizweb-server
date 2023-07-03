const router = require('express').Router()
const User = require('../Models/userDetails')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const JWT_SECRET = "fdsfdsdcdswere()fdsfds32423fscdsf343fdfdfdfxasdggg"
const nodemailer = require('nodemailer');

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

//Fast Login user (Facebook / Google)
router.post('/fast-login', async (req, res) => {
    const { firstname, lastname, username,
        email } = req.body;

    try {
        //checks if the user exist in database
        const user = await User.findOne({ 'email': email });

        if (!user) {
            console.log('test4')
            //create new user
            const newUser = await User.create({
                firstname,
                lastname,
                username,
                email,
                password: '',
                business: [],
                myAppointments: [],
            });

            res.send(newUser)
        } else {
            res.send(user)
        }

    } catch (error) {
        res.status(500).json(error);
    }

})

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body
    try {
        const oldUser = await User.findOne({ email });
        if (!oldUser) {
            return res.sendStatus(404)
        }
        const secret = JWT_SECRET + oldUser.password
        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
            expiresIn: '5m',
        })

        const link = `https://bizweb-israel.netlify.app/resetpassword/${oldUser._id}/${token}}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host:'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'bizwebisrael@gmail.com',
                pass: 'smihyerujkuurmwe'
            }
        });

        const info = await transporter.sendMail({
            from: {
                name: 'Bizweb Israel',
                address:'bizwebisrael@gmail.com'
            }, // sender address
            to: [email], // list of receivers
            subject: "Password Reset", // Subject line
            text: `Enter the password reset link \n${link}`, // plain text body
        });

        return res.sendStatus(200)

    } catch (error) {
        console.log(error)
        return res.sendStatus(500)
    }
})

// router.get('/reset-password/:id/:token', async (req, res) => {
//     const { id, token } = req.params;
//     const oldUser = await User.findOne({ _id: id })
//     if (!oldUser) {
//         return res.sendStatus(404)
//     }
//     const secret = JWT_SECRET + oldUser.password
//     try {
//         const verify = jwt.verify(token, secret);
//         res.render('index', { email: verify.email, status: 'Not Verified' })

//     } catch (error) {
//         return res.send('Not Verified')

//     }
// })

router.post('/reset-password/:id/:token', async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;
    const oldUser = await User.findOne({ _id: id })
    if (!oldUser) {
        return res.sendStatus(404)
    }
    const secret = JWT_SECRET + oldUser.password
    try {
        const verify = jwt.verify(token, secret);
        const encrypedPassword = await bcrypt.hash(password, 10)
        await User.updateOne(
            {
                _id: id,
            },
            {
                $set: {
                    password: encrypedPassword
                }
            }
        );
        return res.sendStatus(200)

    } catch (error) {
        console.log(error)
        return res.sendStatus(500)
    }
})
module.exports = router;