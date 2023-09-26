const { createOrder, captureOrder } = require("../Models/paypalAPI");
const logger = require("../Utils/logs/logger");

const paypal_createOrder = async (req, res) => {
  try {
    // use the cart information passed from the front-end to calculate the order amount detals
    const { products } = req.body;
    const { jsonResponse, httpStatusCode } = await createOrder(products);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    logger.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
};

const paypal_captureOrder = async (req, res) => {
  try {
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    logger.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
};

module.exports = {
  paypal_createOrder,
  paypal_captureOrder,
};
