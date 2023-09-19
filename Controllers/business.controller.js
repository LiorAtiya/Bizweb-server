const Business = require("../Models/businessDetails");
const Calender = require("../Models/calender");
const User = require("../Models/userDetails");
const logger = require("../Utils/logs/logger");

//Images cloud API
const cloudinary = require("cloudinary");
//Location API
const ApiKeyManager = require("@esri/arcgis-rest-request").ApiKeyManager;
const geocode = require("@esri/arcgis-rest-geocoding").geocode;

//Connect to cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

//For location API
const apiKey = process.env.LOCATION_APIKEY;
const authentication = ApiKeyManager.fromKey(apiKey);

const addNewBusiness = async (req, res) => {
  try {
    const {
      category,
      name,
      description,
      city,
      address,
      phone,
      backgroundPicture,
      tabs,
    } = req.body;

    //Checks if the user already exist in database
    const oldName = await Business.findOne({ name: name });
    if (oldName) {
      logger.error("Business Exists");
      return res.sendStatus(401);
    }

    //Get coordination from given address & city
    const coordination = await geocode({
      address: address + " " + city,
      countryCode: "Israel",
      authentication,
    });

    //Create new business
    const business = await Business.create({
      category,
      name,
      description,
      gallery: [],
      reviews: [],
      shop: [],
      city,
      address,
      coordination: coordination.candidates[0],
      phone,
      backgroundPicture,
      tabs: tabs,
    });

    //Create new calender for business (another schema)
    await Calender.create({
      businessID: business._id,
      dates: [],
      availableHours: [],
    });

    //Add new business to list of user
    await User.findByIdAndUpdate(
      { _id: req.user._id },
      { $push: { business: business._id } }
    );

    logger.info(`Created new business: ${business._id}`);
    return res.sendStatus(200);
  } catch (error) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Delete business
const deleteBusiness = async (req, res) => {
  try {
    const { businessID } = req.body;

    const business = await Business.findOne({ _id: businessID });

    if (!business) {
      logger.error("Business doesn't exists");
      return res.sendStatus(404);
    }

    //Delete all pictures of business
    business.gallery.forEach(async (pic) => {
      await cloudinary.uploader.destroy(pic.id);
      logger.info(`Picture id: ${pic.id} was deleted`);
    });

    //Delete background picture of business
    await cloudinary.uploader.destroy(business.backgroundPicture.id);
    logger.info(
      `Background picture id: ${business.backgroundPicture.id} was deleted`
    );

    //Delete business
    await Business.deleteOne({ _id: businessID });
    //Delete from list of user
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { business: businessID.toString() } }
    );
    //Delete calender of business
    await Calender.deleteOne({ businessID: businessID });

    logger.info(`Business: ${businessID} deleted`);
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Update info of business
const updateDetailsBusiness = async (req, res) => {
  try {
    //Get coordination from given address
    const coordination = await geocode({
      address: req.body.address + " " + req.body.city,
      countryCode: "Israel",
      authentication,
    });

    req.body.coordination = coordination.candidates[0];

    if (req.body.prevBackgroundPicture.id !== req.body.backgroundPicture) {
      await cloudinary.uploader.destroy(req.body.prevBackgroundPicture.id);
    }

    const user = await Business.findByIdAndUpdate(req.params.id, {
      $set: req.body,
    });

    // await Business.findByIdAndUpdate(req.params.id, {
    //   coordination: coordination.candidates[0],
    // });

    logger.info(`business - ${req.body.name} has been updated`);
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Get business
const getInfoBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    logger.info(`Get info business: ${business._id}`);
    return res.status(200).json(business);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//get all business
const getAllBusiness = async (req, res) => {
  try {
    const allBusiness = await Business.find({ type: "name" });

    logger.info(`Get all business`);
    return res.status(200).json(allBusiness);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Add new review
const addNewReview = async (req, res) => {
  try {
    //Add new review
    await Business.findByIdAndUpdate(
      { _id: req.params.id },
      { $push: { reviews: req.body.details } }
    );

    logger.info(`Added new review to business: ${req.params.id}`);
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Remove review
const deleteReview = async (req, res) => {
  try {
    await Business.findOneAndUpdate(
      { _id: req.params.id },
      { $pull: { reviews: { id: req.body.id } } }
    );

    logger.info(`Removed review from business: ${req.params.id}`);
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Get all reviews of business
const getAllReviews = async (req, res) => {
  try {
    const user = await Business.findById(req.params.id);

    logger.info(`Get all reviews of business: ${req.params.id}`);
    return res.status(200).json(user.reviews);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Add new product to shop
const addProductToShop = async (req, res) => {
  try {
    //Add new product
    await Business.findByIdAndUpdate(
      { _id: req.params.id },
      { $push: { shop: req.body } }
    );

    logger.info(`Added new product to shop of business: ${req.params.id}`);
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Remove product from shop
const removeProductFromShop = async (req, res) => {
  try {
    await Business.findOneAndUpdate(
      { _id: req.params.id },
      { $pull: { shop: { id: req.body.productID } } }
    );

    logger.info(
      `Removed product: ${req.body.productID} from shop: ${req.params.id}`
    );
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Get shop of business
const getShop = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    logger.info(`Get shop of business: ${req.params.id}`);
    return res.status(200).json(business.shop);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Get gallery of business
const getGallery = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    logger.info(`Get gallery of business: ${req.params.id}`);
    return res.status(200).json(business.gallery);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Add new picture to gallery
const addNewPictureToGallery = async (req, res) => {
  try {
    //Add new picture
    await Business.findByIdAndUpdate(
      { _id: req.params.id },
      { $push: { gallery: req.body } }
    );
    logger.info(`Added new picture to business: ${req.params.id}`);
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Remove picture from gallery
const removePictureFromGallery = async (req, res) => {
  try {
    //Remove from cloudinary
    await cloudinary.uploader.destroy(req.body.id);
    //Remove from mongodb
    await Business.findOneAndUpdate(
      { _id: req.params.id },
      { $pull: { gallery: { id: req.body.id } } }
    );
    logger.info(`Removed picture id: ${req.body.id}`);
    return res.sendStatus(200);
  } catch (error) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Update background picture of business
const updateBackgroundPicture = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    //Remove from cloudinary
    await cloudinary.uploader.destroy(business.backgroundPicture.id);

    await Business.findByIdAndUpdate(
      { _id: req.params.id },
      { backgroundPicture: req.body.backgroundPicture }
    );

    logger.info(`Updated background picture of business: ${req.params.id}`);
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Get the top 5 business
const getTopFive = async (req, res) => {
  try {
    const allBusiness = await Business.find({ type: "name" });
    const mapSpecificValue = allBusiness.map((business) => {
      const {
        _id,
        gallery,
        city,
        address,
        coordination,
        phone,
        createdAt,
        updatedAt,
        __v,
        ...other
      } = business._doc;

      other.totalStars = 0;
      other.reviews.forEach((review) => (other.totalStars += review.stars));

      return other;
    });

    //Sort business by total stars
    const sortByTotalStars = mapSpecificValue.slice(0);
    sortByTotalStars.sort(function (a, b) {
      return b.totalStars - a.totalStars;
    });

    //Get the top 5 business
    const top5 = sortByTotalStars.slice(0, 5);

    logger.info(`Get top 5 business`);
    return res.status(200).json(top5);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//Get business with the nearest available appointment
const quickAppointment = async (req, res) => {
  try {
    const { category, city } = req.body;

    const allBusiness = await Business.find({ type: "name" });
    //filter business by category & city
    const filteredBusiness = allBusiness.filter((busi) => {
      return busi.category === category && busi.city === city;
    });

    //Get calender of filtered business
    const allCalenders = await Calender.find({ type: "businessID" });
    const filteredCalendersBusiness = filteredBusiness.map((busi) => {
      return allCalenders.find(
        (item) => item.businessID === busi._id.toString()
      );
    });

    // Get current time (+2 for server of railway.app)
    let min, hours, currentTime;
    if (new Date().getHours() + 2 < 10) {
      hours = "0" + (new Date().getHours() + 2);
    } else {
      hours = new Date().getHours() + 2;
    }
    if (new Date().getMinutes() < 10) {
      min = "0" + new Date().getMinutes();
    } else {
      min = new Date().getMinutes();
    }
    currentTime = hours + ":" + min;

    //Parse time to int
    currentTime =
      currentTime.split(":").reduce(function (seconds, v) {
        return +v + seconds * 60;
      }, 0) / 60;

    //Get current date
    let currentDate =
      new Date().getDate() +
      "/" +
      (new Date().getMonth() + 1) +
      "/" +
      new Date().getFullYear();

    currentDate = parseInt(
      currentDate.split("/").reduce(function (first, second) {
        return second + first;
      }, "")
    );

    let earliest = [];
    filteredCalendersBusiness.forEach((calender) => {
      calender.availableHours.forEach((hour) => {
        //Parse time to int
        let availableHour =
          hour.time.split(":").reduce(function (seconds, v) {
            return +v + seconds * 60;
          }, 0) / 60;

        //Parse date to int
        let parseDate = parseInt(
          hour.date.split("/").reduce(function (first, second) {
            return second + first;
          }, "")
        );

        //Checks that the date or time has not exceeded the current time
        if (
          parseDate > currentDate ||
          (parseDate === currentDate && availableHour - currentTime > 0)
        ) {
          let earliestDate;

          if (earliest.length != 0) {
            earliestDate = parseInt(
              earliest[1].date.split("/").reduce(function (first, second) {
                return second + first;
              }, "")
            );
          }

          if (earliest.length === 0) {
            const tempEarliest = [calender, hour];
            earliest = tempEarliest;
          } else if (earliestDate - currentDate >= parseDate - currentDate) {
            //Check earliest date
            let earliestTime =
              earliest[1].time.split(":").reduce(function (seconds, v) {
                return +v + seconds * 60;
              }, 0) / 60;

            if (availableHour - currentTime < earliestTime - currentTime) {
              earliest = [calender, hour];
            }
          }
        }
      });
    });

    const business = await Business.findOne({ _id: earliest[0].businessID });
    earliest[0] = business;

    logger.info(
      `Get the nearest free appointment according to filters - category: ${category} and city: ${city}`
    );
    return res.status(200).json(earliest);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

module.exports = {
  addNewBusiness,
  deleteBusiness,
  updateDetailsBusiness,
  getInfoBusiness,
  getAllBusiness,
  addNewReview,
  deleteReview,
  getAllReviews,
  addProductToShop,
  removeProductFromShop,
  getShop,
  addNewPictureToGallery,
  removePictureFromGallery,
  getGallery,
  updateBackgroundPicture,
  getTopFive,
  quickAppointment,
};
