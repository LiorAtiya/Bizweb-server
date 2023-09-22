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
  getMyBusiness,
} = require("../Controllers/users.controller");

//Update personal user details
router.get("/", authenticateToken, getUserInfo);
router.post("/categoryEntry", authenticateToken, addRecordCategoryEntry);
router.get("/trainBigML", trainBigML);
router.get("/my-business", authenticateToken, getMyBusiness);
router.post("/prediction", getPredictionOfBigML);
router.put("/new-appointment", authenticateToken, addNewEvent);
router.delete("/delete-appointment", authenticateToken, deleteEvent);
router.put("/increase-quantity", authenticateToken, increaseQuantityInCart);
router.put("/decrease-quantity", authenticateToken, decreaseQuantityInCart);
router.delete(
  "/remove-product-from-cart",
  authenticateToken,
  removeProductFromCart
);
router.delete("/clear-cart", authenticateToken, clearCart);
router.put("/:id", updateUserInfo);

module.exports = router;
