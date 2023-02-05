const router = require('express').Router();
const Business = require('../Models/businessDetails');
const Calender = require('../Models/calender');
const User = require('../Models/userDetails')

//Images cloud API
const cloudinary = require('cloudinary');
//Location API
const ApiKeyManager = require('@esri/arcgis-rest-request').ApiKeyManager;
const geocode = require('@esri/arcgis-rest-geocoding').geocode;

require('dotenv').config();

//Connect to cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
})

//For location API
const apiKey = 'AAPK59deace2cae94e53bbcf5811a8821134Oo-deTYayYmeeCCCei_3SsXpHWolWHqZmMY4lt8TMnqFsD1I4_JoAOZ7O8vSEO8K'
const authentication = ApiKeyManager.fromKey(apiKey);

//Add new business
router.post('/add', async (req, res) => {
    const { category, name, description,
        city, address, phone, backgroundPicture } = req.body;

    try {
        //Checks if the user already exist in database
        const oldName = await Business.findOne({ 'name': name });
        if (oldName) {
            return res.send({ status: "Business Exists" });
        }

        //Get coordination from given address
        const coordination = await geocode({
            address: address + " " + city,
            countryCode: "Israel",
            authentication,
        })

        //Create new business
        const business = await Business.create({
            category,
            name,
            description,
            gallery: [],
            reviews: [],
            city,
            address,
            coordination: coordination.candidates[0],
            phone,
            backgroundPicture
        });

        //Create new calender for business (another schema)
        const event = await Calender.create({
            businessID: business._id,
            dates: [],
            availableHours: [],
        });

        console.log("Created new business")
        res.send(business);
    } catch (error) {
        res.send({ status: "error" })
    }
})

//Delete business
router.delete('/delete', async (req, res) => {
    try {
        const { businessID, userID } = req.body
        //Delete business
        await Business.deleteOne({ _id: businessID });
        //Delete from list of user
        await User.findOneAndUpdate({ _id: userID }, { $pull: { "business": businessID } });
        //Delete calender of business
        await Calender.deleteOne({ businessID: businessID });

        res.status(200).json('business has been removed')
    } catch (err) {
        return res.status(500).json(err);
    }
})

//Update info of business
router.put('/:id', async (req, res) => {

    //Get coordination from given address
    const coordination = await geocode({
        address: req.body.address + " " + req.body.city,
        countryCode: "Israel",
        authentication,
    })
    
    try {
        const user = await Business.findByIdAndUpdate(req.params.id, {
            $set: req.body
        });

        await Business.findByIdAndUpdate(req.params.id, { coordination: coordination.candidates[0] });

        res.status(200).json('business has been updated')
    } catch (err) {
        return res.status(500).json(err);
    }
})

//Get business
router.get("/:id", async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);
        //Not necessary
        // const {username,password,updatedAt, ...other} = user._doc
        res.status(200).json(business)

    } catch (err) {
        res.status(500).json(err)
    }
})

//get all business
router.get("/", async (req, res) => {
    try {
        const allBusiness = await Business.find({ type: "name" });
        console.log("\u001b[35m" + 'Get all business' + "\u001b[0m");
        res.status(200).json(allBusiness);
    } catch (err) {
        res.status(500).json(err)
    }
})


//Add new review
router.put("/:id/reviews", async (req, res) => {
    if (req.body.userID == req.params.id) {
        try {
            //Add new review
            await Business.findByIdAndUpdate({ _id: req.params.id }, { $push: { reviews: req.body.details } })
            console.log("Added new review");
            res.send("OK - 200 ");
        } catch (err) {
            res.status(500).json(err);
        }
    }
})

//Remove review
router.delete("/:id/reviews", async (req, res) => {
    try {
        await Business.findOneAndUpdate({ _id: req.params.id }, { $pull: { "reviews": { id: req.body.id } } });
        console.log("Removed review");
        res.send("OK - 200 ");
    } catch (err) {
        res.status(500).json(err);
    }
})

//Get all reviews of business
router.get("/:id/reviews", async (req, res) => {
    try {
        const user = await Business.findById(req.params.id);
        res.status(200).json(user.reviews)
        console.log("\u001b[35m" + "Get all reviews" + "\u001b[0m");
    } catch (err) {
        res.status(500).json(err);
    }
})

//Add new picture to gallery
router.put("/:id/gallery", async (req, res) => {
    try {
        //Add new picture
        await Business.findByIdAndUpdate({ _id: req.params.id }, { $push: { gallery: req.body } })
        console.log("Added new picture");
        res.send("OK - 200 ");
    } catch (err) {
        res.status(500).json(err);
    }
})

//Remove picture from gallery
router.delete("/:id/gallery", async (req, res) => {
    try {
        //Remove from cloudinary
        await cloudinary.uploader.destroy(req.body.id);
        //Remove from mongodb
        await Business.findOneAndUpdate({ _id: req.params.id }, { $pull: { "gallery": { id: req.body.id } } });
        console.log("Removed picture");
        res.status(200).send();
    } catch (error) {
        res.status(400).send();
    }
})

//Get gallery of business
router.get("/:id/gallery", async (req, res) => {
    try {
        const user = await Business.findById(req.params.id);
        res.status(200).json(user.gallery)
        console.log("\u001b[35m" + "Get gallery" + "\u001b[0m");
    } catch (err) {
        res.status(500).json(err);
    }
})

//Update background picture of business
router.put("/:id/background", async (req, res) => {
    try {
        await Business.findByIdAndUpdate({ _id: req.params.id }, { backgroundPicture: req.body.backgroundPicture })
        console.log("Updated background picture");
        res.status(200).json();
    } catch (err) {
        res.status(500).json(err);
    }
})

//Get the top 5 business
router.get("/home/top5", async (req, res) => {
    try {
        const allBusiness = await Business.find({ type: "name" });
        const mapSpecificValue = allBusiness.map(business => {
            const { _id, gallery, city, address,
                coordination, phone, createdAt,
                updatedAt, __v, ...other } = business._doc

            other.totalStars = 0;
            other.reviews.forEach(review => other.totalStars += review.stars);

            return other;
        })

        //Sort business by total stars
        const sortByTotalStars = mapSpecificValue.slice(0);
        sortByTotalStars.sort(function (a, b) {
            return b.totalStars - a.totalStars;
        });

        //Get the top 5 business
        const top5 = sortByTotalStars.slice(0, 5);
        res.status(200).json(top5);

    } catch (err) {
        res.status(500).json(err);
    }
})

//Get business with the nearest available appointment
router.post("/home/quickappointment", async (req, res) => {
    try {
        const { category, city } = req.body;

        const allBusiness = await Business.find({ type: "name" });
        //filter business by category & city
        const filteredBusiness = allBusiness.filter(busi => {
            return busi.category === category && busi.city === city;
        })

        //Get calender of filtered business
        const allCalenders = await Calender.find({ type: "businessID" });
        const filteredCalendersBusiness = filteredBusiness.map(busi => {
            return allCalenders.find(item => item.businessID === busi._id.toString());
        });

        // Get current time (+2 for server of railway.app)
        let min, hours, currentTime;
        if ((new Date().getHours() + 2) < 10) {
            hours = '0' + (new Date().getHours() + 2)
        } else {
            hours = (new Date().getHours() + 2)
        }
        if (new Date().getMinutes() < 10) {
            min = '0' + new Date().getMinutes()
        } else {
            min = new Date().getMinutes()
        }
        currentTime = hours + ":" + min;

        //Parse time to int
        currentTime = currentTime.split(':').reduce(function (seconds, v) {
            return + v + seconds * 60;
        }, 0) / 60;


        //Get current date
        let currentDate = new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear()

        currentDate = parseInt(currentDate.split('/').reduce(function (first, second) {
            return second + first;
        }, ""));

        let earliest = [];
        filteredCalendersBusiness.forEach(calender => {
            calender.availableHours.forEach(hour => {

                //Parse time to int
                let availableHour = hour.time.split(':').reduce(function (seconds, v) {
                    return + v + seconds * 60;
                }, 0) / 60;

                //Parse date to int
                let parseDate = parseInt(hour.date.split('/').reduce(function (first, second) {
                    return second + first;
                }, ""));

                //Checks that the date or time has not exceeded the current time
                if ((parseDate > currentDate) ||
                    ((parseDate === currentDate) && (availableHour - currentTime > 0))) {

                    let earliestDate;

                    if (earliest.length != 0) {
                        earliestDate = parseInt(earliest[1].date.split('/').reduce(function (first, second) {
                            return second + first;
                        }, ""));
                    }

                    if (earliest.length === 0) {
                        const tempEarliest = [calender, hour];
                        earliest = tempEarliest;

                    } else if ((earliestDate - currentDate) >= (parseDate - currentDate)) //Check earliest date
                    {
                        let earliestTime = earliest[1].time.split(':').reduce(function (seconds, v) {
                            return + v + seconds * 60;
                        }, 0) / 60;

                        if ((availableHour - currentTime) < (earliestTime - currentTime)) {
                            earliest = [calender, hour];
                        }
                    }
                }
            })
        })

        const business = await Business.findOne({ '_id': earliest[0].businessID });
        earliest[0] = business;

        res.status(200).json(earliest);
    } catch (err) {
        res.status(500).json(err);
    }
})

module.exports = router;