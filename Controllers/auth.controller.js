const User = require("../Models/userDetails");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const logger = require("../Utils/logs/logger");

//Register new user
const register = async (req, res) => {

  try {
    const { firstname, lastname, username, email, password } = req.body;

    //Encrypt password
    const encrypedPassword = await bcrypt.hash(password, 10);
    //checks if the user already exist in database
    const oldUser = await User.findOne({ email: email });
    if (oldUser) {
      logger.error(`user Exists - Email: ${email}`);
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

    logger.info(`Registered new user - Email: ${email}`);
    return res.send(newUser);
  } catch (error) {
    logger.error(error);
    return res.sendStatus(500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //checks if the user exist in database
    const user = await User.findOne({ email: email });
    if (!user) {
      logger.error(`Email: ${email} Not Found`);
      return res.sendStatus(403);
    }
    //Checks if the password match to encrypt password
    if (await bcrypt.compare(password, user.password)) {
      const accessToken = jwt.sign({ user: user }, process.env.JWT_SECRET);
      logger.info(`Login Email: ${email} was successful`);

      return res.status(200).json({ accessToken: accessToken });
    }
    logger.error("Invalid Password");
    return res.sendStatus(403);
  } catch (error) {
    logger.error(error);
    return res.sendStatus(500);
  }
};

//Fast Login user (Facebook / Google)
const fastLogin = async (req, res) => {
  try {
    const { first_name, last_name, email } = req.user;
    //checks if the user exist in database
    const user = await User.findOne({ email: email });

    if (!user) {
      //create new user
      const newUser = await User.create({
        firstname: first_name,
        lastname: last_name,
        username: "user" + Math.floor(Date.now() + Math.random()),
        email,
        password: "",
        business: [],
        myAppointments: [],
      });

      logger.info(`New User: ${email} was registered`);

      const { password, updatedAt, createdAt, ...other } = newUser._doc;
      return res.send(other);
    } else {
      const { password, updatedAt, createdAt, ...other } = user._doc;
      logger.info(`Login Email: ${other.email} was successful`);
      return res.send(other);
    }
  } catch (error) {
    logger.error(error);
    return res.sendStatus(500);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res.sendStatus(404);
    }
    const secret = process.env.JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "5m",
    });

    const link = `https://bizweb-israel.netlify.app/resetpassword/${oldUser._id}/${token}}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.PASSWORD_USER,
      },
    });

    const info = await transporter.sendMail({
      from: {
        name: "Bizweb Israel",
        address: "bizwebisrael@gmail.com",
      }, // sender address
      to: [email], // list of receivers
      subject: "Password Reset", // Subject line
      text: `Enter to link for reset the password \n${link}`, // plain text body
    });

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
};

const resetPassword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.sendStatus(404);
  }
  const secret = process.env.JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    const encrypedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encrypedPassword,
        },
      }
    );
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
};

module.exports = { register, login, fastLogin, forgotPassword, resetPassword };
