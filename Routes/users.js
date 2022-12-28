const router = require('express').Router()
const User = require('../Models/userDetails')
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

//get user
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        //Not necessary
        const { username, password, updatedAt, ...other } = user._doc
        res.status(200).json(other)
    } catch (err) {
        res.status(500).json(err)
    }
})

//Add new business
router.put("/:id/business", async (req, res) => {
    if (req.body.userID == req.params.id) {
        const { business } = req.body;
        try {
            await User.findByIdAndUpdate({ _id: req.params.id }, { $push: { business: business } })
            const user = await User.findById(req.params.id);
            // console.log(user);
            res.status(200).json(user);
        } catch (err) {
            res.status(500).json(err);
        }
    } else {

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
        await User.findOneAndUpdate({ _id: req.params.id }, { $pull: { "myAppointments": { id: req.body.id } } });
        console.log("Removed appointment");
        const user = await User.findOne({ '_id': req.params.id });
        console.log(user);
        return res.json(user);
    } catch (err) {
        res.status(500).json(err);
    }
})

module.exports = router;