const router = require('express').Router()
const User = require('../Models/userDetails')
const CategoryEntries = require('../Models/categoryEntries');
const BigML = require("../Models/bml");

const bcrypt = require('bcryptjs')

//Update personal user details
router.put('/:id', async (req, res) => {
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
                $set: req.body
            });
            res.status(200).json('Account has been updated')
        } catch (err) {
            return res.status(500).json(err);
        }
    } else {
        return res.status(403).json('You can update only your account');
    }
})

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

//Get user
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        //Not necessary
        const { password, updatedAt, ...other } = user._doc
        res.status(200).json(other)
    } catch (err) {
        res.status(500).json(err)
    }
})

//Add new record of category entry
router.post("/:id/categoryEntry", async (req, res) => {
    const { firstname, lastname, username,
        email, category } = req.body;

    try {
        //create new record
        const newRecord = await CategoryEntries.create({
            firstname,
            lastname,
            username,
            email,
            category,
        });

        res.status(200).json(newRecord);
    } catch (error) {
        res.status(500).json(err);
    }
})

router.get("/:id/trainBigML", async (req, res) => {

    try {
        var recordsFound = await BigML.createModel();
        res.status(200).json(recordsFound);
    } catch (error) {
        res.status(500).json(err);
    }
})

router.post("/:id/prediction", async (req, res) => {
    try {
        var result = await BigML.predictAll(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(err);
    }
})

//Add new business to list of user
router.put("/:id/business", async (req, res) => {
    const { business } = req.body;
    try {
        await User.findByIdAndUpdate({ _id: req.params.id }, { $push: { business: business } })
        const user = await User.findById(req.params.id);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
})

//Add appointment
router.put("/:id/newappointment", async (req, res) => {
    const appointment = {
        businessID: req.body.businessID,
        name: req.body.businessName,
        phone: req.body.phone,
        date: req.body.date,
        time: req.body.time
    }
    try {
        await User.findByIdAndUpdate({ _id: req.params.id }, { $push: { myAppointments: appointment } })
        console.log("Added new appointment");
        const user = await User.findOne({ '_id': req.params.id });
        return res.json(user);
    } catch (err) {
        res.status(500).json(err);
    }
})

//Delete appointment
router.delete("/:id/delete-appointment", async (req, res) => {
    try {
        await User.findOneAndUpdate({ _id: req.params.id }, { $pull: { "myAppointments": { id: req.body.id, date: req.body.date, time: req.body.time } } });
        console.log("Removed appointment");
        const user = await User.findOne({ '_id': req.params.id });

        return res.json(user);
    } catch (err) {
        res.status(500).json(err);
    }
})

//Add/Increase new product to cart
router.put("/:id/increase-quantity", async (req, res) => {
    try {
        const user = await User.findOne({ '_id': req.params.id });
        const itemIndex = user.myShoppingCart.findIndex((item) => item.id === req.body.id);
        if (itemIndex >= 0) {
            user.myShoppingCart[itemIndex].quantity += 1;
            const afterChange = user.myShoppingCart[itemIndex].quantity;
            const query = { '_id': req.params.id, "myShoppingCart.id": req.body.id };
            const updateDocument = {
                $set: { "myShoppingCart.$.quantity": afterChange }
            };
            const result = await User.updateOne(query, updateDocument);

            console.log("\u001b[35m" + "increased product to cart" + "\u001b[0m");
        } else {
            await User.findByIdAndUpdate({ _id: req.params.id }, { $push: { myShoppingCart: req.body } })
            console.log("\u001b[35m" + "Added new product to cart" + "\u001b[0m");
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
})

//Decrease product from my cart
router.put("/:id/decrease-quantity", async (req, res) => {
    try {
        const user = await User.findOne({ '_id': req.params.id });
        const itemIndex = user.myShoppingCart.findIndex((item) => item.id === req.body.id);
        if (user.myShoppingCart[itemIndex].quantity > 1) {
            user.myShoppingCart[itemIndex].quantity -= 1;
            const afterChange = user.myShoppingCart[itemIndex].quantity;
            const query = { '_id': req.params.id, "myShoppingCart.id": req.body.id };
            const updateDocument = {
                $set: { "myShoppingCart.$.quantity": afterChange }
            };
            const result = await User.updateOne(query, updateDocument);

            console.log("\u001b[35m" + "decreased product from cart" + "\u001b[0m");
        } else {
            await User.findByIdAndUpdate({ _id: req.params.id }, { $pull: { myShoppingCart: req.body } })
            console.log("\u001b[35m" + "Removed product from cart" + "\u001b[0m");
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
})

//Remove product from my cart
router.delete("/:id/remove-product-from-cart", async (req, res) => {
    try {
        await User.findOneAndUpdate({ _id: req.params.id }, { $pull: { "myShoppingCart": { id: req.body.productID } } });
        console.log("\u001b[35m" + "Remove product from cart" + "\u001b[0m");
        res.status(200)
    } catch (err) {
        res.status(500).json(err);
    }
})

//Clear my cart
router.delete("/:id/clear-cart", async (req, res) => {
    try {
        await User.findByIdAndUpdate({ _id: req.params.id }, { myShoppingCart: [] })
        console.log("\u001b[35m" + "Clear cart" + "\u001b[0m");
        res.status(200)
    } catch (err) {
        res.status(500).json(err);
    }
})

module.exports = router;