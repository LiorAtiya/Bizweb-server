const router = require('express').Router();
const Business = require('../Models/businessDetails');
const Calender = require('../Models/calender');
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

//Add business
router.post('/add', async (req, res) => {
    const { category, name, description,
        city, address, phone, backgroundPicture } = req.body;

    try {
        //checks if the user already exist in database
        const oldName = await Business.findOne({ 'name': name });
        if (oldName) {
            return res.send({ status: "Business Exists" });
        }
    
        const coordination = await geocode({
            address: address + " " + city,
            // postal: 38103,
            countryCode: "Israel",
            authentication,
        })

        //create new business
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

        //create new calender for business
        const event = await Calender.create({
            // _id: businessID,
            businessID: business._id,
            dates: [],
            availableHours: [],
        });
        console.log(business);
        res.send(business);
    } catch (error) {
        res.send({ status: "error" })
    }
})

//Update info of business
router.put('/:id', async (req, res) => {
    if (req.body.userId == req.params.id) {
        try {
            //NEED TO CHECK WHY ITS REPLACE BODY INSTEAD UPDATE
            const user = await Business.findByIdAndUpdate(req.params.id, {
                $set: req.body
            });
            res.status(200).json('business has been updated')
        } catch (err) {
            return res.status(500).json(err);
        }
    } else {
        return res.status(403).json('You can update only your business');
    }
})

//Update background picture of business
router.put("/:id/background", async (req, res) => {
        try {
            await Business.findByIdAndUpdate({ _id: req.params.id }, { backgroundPicture: req.body.backgroundPicture })
            console.log("Added new review");
            res.status(200).json();
        } catch (err) {
            res.status(500).json(err);
        }
})

//get one business
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
        console.log("Removed new review");
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
        console.log("Get all reviews");
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

//Remove image from gallery
router.delete("/:id/gallery", async (req, res) => {
    try {
        //Remove from cloudinary
        await cloudinary.uploader.destroy(req.body.id);
        //Remove from mongodb
        await Business.findOneAndUpdate({ _id: req.params.id }, { $pull: { "gallery": { id: req.body.id } } });
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
        console.log("Get gallery");
    } catch (err) {
        res.status(500).json(err);
    }
})

module.exports = router;