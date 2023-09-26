const router = require("express").Router();

const {
  paypal_createOrder,
  paypal_captureOrder,
} = require("../Controllers/payment.controller");

router.post("/orders", paypal_createOrder);
router.post("/orders/:orderID/capture", paypal_captureOrder);

module.exports = router;
