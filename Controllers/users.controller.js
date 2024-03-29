const User = require("../Models/userDetails");
const Business = require("../Models/businessDetails");
const CategoryEntries = require("../Models/categoryEntries");
const BigML = require("../Models/bml");
const logger = require("../Utils/logs/logger");
const bcrypt = require("bcryptjs");

//Update personal user details
const updateUserInfo = async (req, res) => {
  try {
    //Update password
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    //NEED TO CHECK WHY ITS REPLACE BODY INSTEAD UPDATE
    const user = await User.findByIdAndUpdate(req.params.id, {
      $set: req.body,
    });

    logger.info(`Account has been updated`);
    return res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    return res.sendStatus(500);
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

const getMyBusiness = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    const allBusiness = await Business.find({}).exec();

    let filteredBusiness = [];

    user.business.forEach((id) => {
      const business = allBusiness.find((busi) => {
        return busi._id.toString() === id;
      });

      if (business !== undefined) {
        filteredBusiness.push(business);
      }
    });

    logger.info(`Get business of user: ${req.user.email}`);

    return res.status(200).json(filteredBusiness);
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

    return res.status(200);
  } catch (error) {
    logger.error(error);
    res.sendStatus(500);
  }
};

const getPredictionOfBigML = async (req, res) => {
  try {
    var result = await BigML.predictAll(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500);
  }
};

//Add appointment
const addNewEvent = async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { email: req.user.email },
      { $push: { myAppointments: req.body } }
    );

    const user = await User.findOne({ email: req.user.email });
    logger.info(`A new appointment to registered user: ${req.user.email}`);

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
      { email: req.user.email },
      {
        $pull: {
          myAppointments: {
            eventID: req.body.eventID,
          },
        },
      }
    );
    logger.info(
      `Remove event ${req.body.eventID} from list of user ${req.user.email}`
    );
    const user = await User.findOne({ email: req.user.email });

    return res.json(user);
  } catch (err) {
    return res.status(500);
  }
};

//Add/Increase new product to cart
const increaseQuantityInCart = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    const itemIndex = user.myShoppingCart.findIndex(
      (item) => item.id === req.body.id
    );

    if (itemIndex >= 0) {
      user.myShoppingCart[itemIndex].quantity += 1;
      const afterChange = user.myShoppingCart[itemIndex].quantity;
      const query = { email: req.user.email, "myShoppingCart.id": req.body.id };
      const updateDocument = {
        $set: { "myShoppingCart.$.quantity": afterChange },
      };
      await User.updateOne(query, updateDocument);

      logger.info(`Increased product: ${req.body.id} to cart`);
    } else {
      await User.findOneAndUpdate(
        { email: req.user.email },
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
    const user = await User.findOne({ email: req.user.email });
    const itemIndex = user.myShoppingCart.findIndex(
      (item) => item.id === req.body.id
    );
    if (user.myShoppingCart[itemIndex].quantity > 1) {
      user.myShoppingCart[itemIndex].quantity -= 1;
      const afterChange = user.myShoppingCart[itemIndex].quantity;
      const query = { email: req.user.email, "myShoppingCart.id": req.body.id };
      const updateDocument = {
        $set: { "myShoppingCart.$.quantity": afterChange },
      };
      await User.updateOne(query, updateDocument);
      logger.info(`Decreased product: ${req.body.id} from cart`);
    } else {
      await User.findOneAndUpdate(
        { email: req.user.email },
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
      { email: req.user.email },
      { $pull: { myShoppingCart: { id: req.body.productID } } }
    );
    logger.info(
      `Remove product: ${req.body.productID} from cart of user: ${req.user.email}`
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
    await User.findOneAndUpdate({ email: req.user.email }, { myShoppingCart: [] });

    logger.info(`Clear cart of user: ${req.user.email}`);
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
  getMyBusiness,
};
