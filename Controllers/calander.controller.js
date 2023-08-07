const Calender = require("../Models/calender");
const logger = require("../Utils/logs/logger");

// //For Sending SMS API (Twillio)
// const accountSid = process.env.TWILLIO_ACCOUNTSID
// const authToken = process.env.TWILLIO_AUTHTOKEN
// const client = require('twilio')(accountSid, authToken, {
//     lazyLoading: true
// });

//Create new event in the calender
const createNewEvent = async (req, res) => {
  try {
    //Add event to list of appointments
    await Calender.findOneAndUpdate(
      { businessID: req.body.businessID },
      { $push: { dates: req.body } }
    );
    //Remove hour from available hours
    await Calender.findOneAndUpdate(
      { businessID: req.body.businessID },
      {
        $pull: { availableHours: { date: req.body.date, time: req.body.time } },
      }
    );

    // //Sending SMS to client about the appointment
    // client.messages.create({
    //     body: `שלום ${req.body.name} \n נקבע לך תור בתאריך ${req.body.date} בשעה ${req.body.time}`,
    //     to: '+972' + req.body.phone,
    //     from: '+14059934995'
    // }).then((message) => console.log(message.body));

    logger.info(
      `A new appointment was made by: ${req.body.name} at ${req.body.date} | ${req.body.time}`
    );
    return res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    return res.sendStatus(500);
  }
};

const addAvailableHours = async (req, res) => {
  try {
    await Calender.findOneAndUpdate(
      { businessID: req.body.businessID },
      { $push: { availableHours: req.body } }
    );
    logger.info(`A new avilable hour at ${req.body.date} | ${req.body.time}`);
    return res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    return res.sendStatus(500);
  }
};

//delete event from calender
const deleteEvent = async (req, res) => {
  try {
    //delete event
    await Calender.findOneAndUpdate(
      { businessID: req.body.businessID },
      { $pull: { dates: { id: req.body.eventID } } }
    );

    // //Sending SMS to client about the appointment
    // client.messages.create({
    //     body: `שלום ${req.body.name} \n התבטל לך תור בתאריך ${req.body.date} בשעה ${req.body.time}`,
    //     to: '+972' + req.body.phone,
    //     from: '+14059934995'
    // }).then((message) => console.log(message.body));

    logger.info(`Remove event: ${req.body.eventID}`);
    return res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
};

//delete expired events from calender
const deleteExpiredEvents = async (req, res) => {
  // // Get current hour (localhost)
  // let min, hours, currentTime;
  // if ((new Date().getHours()) < 10) {
  //     hours = '0' + (new Date().getHours())
  // } else {
  //     hours = (new Date().getHours())
  // }

  // Get current hour (+2 for server of railway.app)
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
  validityTime =
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
  validityDate = parseInt(
    currentDate.split("/").reduce(function (first, second) {
      return second + first;
    }, "")
  );

  //Remove hour from available hours
  const events = await Calender.findOneAndUpdate(
    { businessID: req.body.businessID },
    {
      $pull: {
        availableHours: {
          expiredDate: { $lte: validityDate },
          expiredTime: { $lt: validityTime },
        },
      },
    }
  );
  //Remove from list of appointments
  await Calender.findOneAndUpdate(
    { businessID: req.body.businessID },
    {
      $pull: {
        dates: {
          expiredDate: { $lte: validityDate },
          expiredTime: { $lt: validityTime },
        },
      },
    }
  );
  res.status(200).json(events);
};

//Get all the events of business
const getAllEvents = async (req, res) => {
  const events = await Calender.findOne({ businessID: req.body.businessID });
  console.log("\u001b[35m" + "Get calender" + "\u001b[0m");
  res.send(events);
};

module.exports = {
  createNewEvent,
  addAvailableHours,
  deleteEvent,
  deleteExpiredEvents,
  getAllEvents,
};
