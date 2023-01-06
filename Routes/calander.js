const router = require('express').Router();
const Calender = require('../Models/calender')

require('dotenv').config();

//For Sending SMS API (Twillio)
const accountSid = 'AC6e9f3c0fbcdb78099ad021619a63b6e3'
const authToken = '11f7df5764cae7a0df472b869dbe0a51'
const client = require('twilio')(accountSid, authToken, {
    lazyLoading: true
});

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
        }

        if(req.body.userID) appointment.userID = req.body.userID;

        //Add event to list of appointments
        const afterUpdate = await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $push: { "dates": appointment } })
        //Remove hour from available hours
        await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $pull: { "availableHours": { date: req.body.date, time: req.body.time } } });

        //********************* Return this *********************** */
        // //Sending SMS to client about the appointment
        // client.messages.create({
        //     body: `שלום ${req.body.name} \n נקבע לך תור בתאריך ${req.body.date} בשעה ${req.body.time}`,
        //     to: '+972' + req.body.phone,
        //     from: '+14059934995'
        // }).then((message) => console.log(message.body));

        res.send(afterUpdate);

    } else { //Admin add more available hours
        const afterUpdate = await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $push: { "availableHours": { date: req.body.date, time: req.body.time } } })
        res.send(afterUpdate);
    }
}
)

//delete event from calender
router.delete('/delete-event', async (req, res) => {

    try {
        //delete event
        await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $pull: { "dates": { date: req.body.date, time: req.body.time } } });

        //Add to availableHours
        await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $push: { "availableHours": { date: req.body.date, time: req.body.time } } })

        //********************* Return this *********************** */
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

//Get all the events of business
router.post('/get-events', async (req, res) => {

    const events = await Calender.findOne({ businessID: req.body.businessID });
    res.send(events)
})

module.exports = router