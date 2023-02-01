const router = require('express').Router();
const Calender = require('../Models/calender')
//WebSocket
const http = require('http');
const socketIo = require('socket.io');

require('dotenv').config();

//For Sending SMS API (Twillio)
const accountSid = 'AC6e9f3c0fbcdb78099ad021619a63b6e3'
const authToken = '96f87975ef3724144edc05d18e6443cf'
const client = require('twilio')(accountSid, authToken, {
    lazyLoading: true
});

const server = http.createServer(app);
const io = socketIo(server);

//============ Connection to socket ================   
io.on('connection', socket => {
    console.log('New client connected');

    socket.on('newAppointment', async appointment => {
        //client made an appointment
        if (appointment.busy) {

            const newAppointment = {
                date: appointment.date,
                time: appointment.time,
                busy: appointment.busy,
                name: appointment.name,
                phone: appointment.phone,
                comments: appointment.comments,
                expiredTime: appointment.expiredTime,
                expiredDate: appointment.expiredDate
            }

            if (appointment.userID) newAppointment.userID = appointment.userID;

            //Add event to list of appointments
            const afterUpdate = await Calender.findOneAndUpdate({ businessID: appointment.businessID }, { $push: { "dates": newAppointment } })
            //Remove hour from available hours
            await Calender.findOneAndUpdate({ businessID: appointment.businessID }, { $pull: { "availableHours": { date: appointment.date, time: appointment.time } } });

            // //Sending SMS to client about the appointment
            // client.messages.create({
            //     body: `שלום ${req.body.name} \n נקבע לך תור בתאריך ${req.body.date} בשעה ${req.body.time}`,
            //     to: '+972' + req.body.phone,
            //     from: '+14059934995'
            // }).then((message) => console.log(message.body));

            //Update live in the client side
            socket.emit('updatedAppointmentsList', afterUpdate);

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
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
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
            expiredTime: req.body.expiredTime,
            expiredDate: req.body.expiredDate
        }

        if (req.body.userID) appointment.userID = req.body.userID;

        //Add event to list of appointments
        const afterUpdate = await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $push: { "dates": appointment } })
        //Remove hour from available hours
        await Calender.findOneAndUpdate({ businessID: req.body.businessID }, { $pull: { "availableHours": { date: req.body.date, time: req.body.time } } });

        //Sending SMS to client about the appointment
        client.messages.create({
            body: `שלום ${req.body.name} \n נקבע לך תור בתאריך ${req.body.date} בשעה ${req.body.time}`,
            to: '+972' + req.body.phone,
            from: '+14059934995'
        }).then((message) => console.log(message.body));

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

        //Sending SMS to client about the appointment
        client.messages.create({
            body: `שלום ${req.body.name} \n התבטל לך תור בתאריך ${req.body.date} בשעה ${req.body.time}`,
            to: '+972' + req.body.phone,
            from: '+14059934995'
        }).then((message) => console.log(message.body));

        console.log(req.body);
        return res.json(req.body);
    } catch (err) {
        res.status(500).json(err);
    }

    res.send("Delete event & add to availableHours");
})

//delete expired events from calender
router.delete('/delete-expired-events', async (req, res) => {

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
    res.send(events)
})

module.exports = router