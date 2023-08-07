const router = require("express").Router();
const { authenticateToken } = require("../Middleware/Auth");

const {
  updateUserInfo,
  getUserInfo,
  addRecordCategoryEntry,
  trainBigML,
  getPredictionOfBigML,
  addNewEvent,
  deleteEvent,
  increaseQuantityInCart,
  decreaseQuantityInCart,
  removeProductFromCart,
  clearCart,
} = require("../Controllers/users.controller");

//Update personal user details
router.put("/:id", updateUserInfo);
router.get("/", authenticateToken, getUserInfo);
router.post("/categoryEntry",authenticateToken, addRecordCategoryEntry);
router.get("/trainBigML", trainBigML);
router.post("/prediction", getPredictionOfBigML);
router.put("/:id/newappointment", addNewEvent);
router.delete("/:id/delete-appointment", deleteEvent);
router.put("/increase-quantity", authenticateToken, increaseQuantityInCart);
router.put("/decrease-quantity", authenticateToken, decreaseQuantityInCart);
router.delete("/remove-product-from-cart", authenticateToken ,removeProductFromCart);
router.delete("/clear-cart",authenticateToken, clearCart);

module.exports = router;
