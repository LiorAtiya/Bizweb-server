const router = require('express').Router();
const Calender = require('../Models/calender')

require('dotenv').config();

// //For Sending SMS API (Twillio)
// const accountSid = process.env.TWILLIO_ACCOUNTSID
// const authToken = process.env.TWILLIO_AUTHTOKEN
// const client = require('twilio')(accountSid, authToken, {
//     lazyLoading: true
// });

//Create new event in the calender
router.post('/create-event', async (req, res) => {
    // const { businessID, date, time,busy, name, phone, comments } = req.body;

    //client made an appointment
    if (req.body.busy) {

        const appointment = {
            date: req.body.date,
            time: req.body.time,
            busy: req.body.busy,
            name: req.body.name,
            phone: req.body.phone,
            comments: req.body.comments,
            expiredTime: req.body.expiredTime,
            expiredDate: req.body.expiredDate
        }

        if (req.body.userID) appointment.userID = req.body.userID;

        //Add event to list of appointments
        const afterUpdate = await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $push: { "dates": appointment } })
        //Remove hour from available hours
        await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $pull: { "availableHours": { date: req.body.date, time: req.body.time } } });

        // //Sending SMS to client about the appointment
        // client.messages.create({
        //     body: `שלום ${req.body.name} \n נקבע לך תור בתאריך ${req.body.date} בשעה ${req.body.time}`,
        //     to: '+972' + req.body.phone,
        //     from: '+14059934995'
        // }).then((message) => console.log(message.body));

        res.send(afterUpdate);

    } else { //Admin add more available hours

        const appointment = {
            date: req.body.date,
            time: req.body.time,
            expiredTime: req.body.expiredTime,
            expiredDate: req.body.expiredDate
        }
        const afterUpdate = await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $push: { "availableHours": appointment } })
        res.send(afterUpdate);
    }
}
)

//delete event from calender
router.delete('/delete-event', async (req, res) => {

    try {
        //delete event
        await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $pull: { "dates": { date: req.body.date, time: req.body.time } } });

        // //Sending SMS to client about the appointment
        // client.messages.create({
        //     body: `שלום ${req.body.name} \n התבטל לך תור בתאריך ${req.body.date} בשעה ${req.body.time}`,
        //     to: '+972' + req.body.phone,
        //     from: '+14059934995'
        // }).then((message) => console.log(message.body));

        console.log(req.body);
        return res.json(req.body);
    } catch (err) {
        res.status(500).json(err);
    }

    res.send("Delete event & add to availableHours");
})

//delete expired events from calender
router.delete('/delete-expired-events', async (req, res) => {

    // // Get current hour (localhost)
    // let min, hours, currentTime;
    // if ((new Date().getHours()) < 10) {
    //     hours = '0' + (new Date().getHours())
    // } else {
    //     hours = (new Date().getHours())
    // }

    // Get current hour (+2 for server of railway.app)
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
    validityTime = currentTime.split(':').reduce(function (seconds, v) {
        return + v + seconds * 60;
    }, 0) / 60;

    //Get current date
    let currentDate = new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear()
    validityDate = parseInt(currentDate.split('/').reduce(function (first, second) {
        return second + first;
    }, ""));

    //Remove hour from available hours
    const events = await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $pull: { "availableHours": { expiredDate: { $lte: validityDate }, expiredTime: { $lt: validityTime } } } });
    //Remove from list of appointments
    await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $pull: { "dates": { expiredDate: { $lte: validityDate }, expiredTime: { $lt: validityTime } } } });
    res.status(200).json(events);
})

//Get all the events of business
router.post('/get-events', async (req, res) => {

    const events = await Calender.findOne({ businessID: req.body.businessID });
    console.log("\u001b[35m" + "Get calender" + "\u001b[0m");
    res.send(events)
})

module.exports = router