const router = require("express").Router();
const { authenticateToken } = require("../Middleware/Auth");
const {
  createNewEvent,
  addAvailableHours,
  deleteEvent,
  deleteExpiredEvents,
  getAllEvents,
} = require("../Controllers/calander.controller");

router.post("/create-event", createNewEvent);
router.post("/add-hours", authenticateToken, addAvailableHours);
router.delete("/delete-event", authenticateToken, deleteEvent);
router.delete("/delete-expired-events", deleteExpiredEvents);
router.post("/get-events", getAllEvents);

module.exports = router;
