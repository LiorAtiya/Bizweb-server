const User = require("../Models/userDetails");
const CategoryEntries = require("../Models/categoryEntries");
const BigML = require("../Models/bml");
const logger = require("../Utils/logs/logger");
const bcrypt = require("bcryptjs");

//Update personal user details
const updateUserInfo = async (req, res) => {
  if (req.body.userId == req.params.id) {
    //Update password
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      //NEED TO CHECK WHY ITS REPLACE BODY INSTEAD UPDATE
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account");
  }
};

const getUserInfo = async (req, res) => {
  try {
    //Not necessary
    const user = await User.findOne({ email: req.user.email });
    const { password, updatedAt, createdAt, ...other } = user._doc;
    logger.info(`Get user info of ${other.email}`);

    return res.status(200).json(other);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Add new record of category entry
const addRecordCategoryEntry = async (req, res) => {
  try {
    const oldUser = await User.findOne({ email: req.user.email });
    if (!oldUser) {
      logger.error(`Email: ${req.user.email} not exist`);
      return res.sendStatus(404);
    }

    const { firstname, lastname, username, email } = req.user;
    const { category } = req.body;

    //create new record
    await CategoryEntries.create({
      firstname,
      lastname,
      username,
      email,
      category,
    });

    logger.info(`Add new record of category entry - ${category}`);

    return res.status(200);
  } catch (error) {
    logger.error(error);
    return res.sendStatus(500);
  }
};

const trainBigML = async (req, res) => {
  try {
    await BigML.createModel();
    logger.info(`Train & Create new model in bigML`);

    res.status(200);
  } catch (error) {
    logger.error(error);
    res.sendStatus(500);
  }
};

const getPredictionOfBigML = async (req, res) => {
  try {
    var result = await BigML.predictAll(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(err);
  }
};

//Add appointment
const addNewEvent = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      { _id: req.params.id },
      { $push: { myAppointments: req.body } }
    );

    const user = await User.findOne({ _id: req.params.id });
    logger.info(`A new appointment to registered user: ${req.body.userID}`);

    return res.json(user);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Delete appointment
const deleteEvent = async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.params.id },
      {
        $pull: {
          myAppointments: {
            id: req.body.eventID,
          },
        },
      }
    );
    logger.info(
      `Remove event ${req.body.eventID} from list of user ${req.params.id}`
    );
    const user = await User.findOne({ _id: req.params.id });

    return res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
};

//Add/Increase new product to cart
const increaseQuantityInCart = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id });
    const itemIndex = user.myShoppingCart.findIndex(
      (item) => item.id === req.body.id
    );
    if (itemIndex >= 0) {
      user.myShoppingCart[itemIndex].quantity += 1;
      const afterChange = user.myShoppingCart[itemIndex].quantity;
      const query = { _id: req.user._id, "myShoppingCart.id": req.body.id };
      const updateDocument = {
        $set: { "myShoppingCart.$.quantity": afterChange },
      };
      await User.updateOne(query, updateDocument);

      logger.info(`Increased product: ${req.body.id} to cart`);
    } else {
      await User.findByIdAndUpdate(
        { _id: req.user._id },
        { $push: { myShoppingCart: req.body } }
      );
      logger.info(`Added new product: ${req.body.id} to cart`);
    }

    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Decrease product from my cart
const decreaseQuantityInCart = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id });
    const itemIndex = user.myShoppingCart.findIndex(
      (item) => item.id === req.body.id
    );
    if (user.myShoppingCart[itemIndex].quantity > 1) {
      user.myShoppingCart[itemIndex].quantity -= 1;
      const afterChange = user.myShoppingCart[itemIndex].quantity;
      const query = { _id: req.user._id, "myShoppingCart.id": req.body.id };
      const updateDocument = {
        $set: { "myShoppingCart.$.quantity": afterChange },
      };
      await User.updateOne(query, updateDocument);
      logger.info(`Decreased product: ${req.body.id} from cart`);
    } else {
      await User.findByIdAndUpdate(
        { _id: req.user._id },
        { $pull: { myShoppingCart: req.body } }
      );
      logger.info(`Removed product: ${req.body.id} from cart`);
    }
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Remove product from my cart
const removeProductFromCart = async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { myShoppingCart: { id: req.body.productID } } }
    );
    logger.info(
      `Remove product: ${req.body.productID} from cart of user: ${req.user._id}`
    );
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Clear my cart
const clearCart = async (req, res) => {
  try {
    await User.findByIdAndUpdate({ _id: req.user._id }, { myShoppingCart: [] });
    
    logger.info(`Clear cart of user: ${req.user._id}`);
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

// //delete user
// router.delete('/:id', async (req, res) => {
//     if (req.body.userId == req.params.id) {
//         try {
//             //NEED TO CHECK WHY ITS REPLACE BODY INSTEAD UPDATE
//             const user = await User.findByIdAndDelete(req.params.id)
//             res.status(200).json('Account has been deleted')
//         } catch (err) {
//             return res.status(500).json(err);
//         }
//     } else {
//         return res.status(403).json('You can deleted only your account');
//     }
// })

module.exports = {
  updateUserInfo,
  getUserInfo,
  addRecordCategoryEntry,
  trainBigML,
  getPredictionOfBigML,
  addNewEvent,
  deleteEvent,
  increaseQuantityInCart,
  decreaseQuantityInCart,
  removeProductFromCart,
  clearCart,
};
