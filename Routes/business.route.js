const router = require("express").Router();
const { checkAdminBusiness } = require("../Middleware/Admin");
const { authenticateToken } = require("../Middleware/Auth");

const {
  addNewBusiness,
  deleteBusiness,
  updateDetailsBusiness,
  getInfoBusiness,
  getAllBusiness,
  addNewReview,
  deleteReview,
  getAllReviews,
  addProductToShop,
  removeProductFromShop,
  getShop,
  addNewPictureToGallery,
  removePictureFromGallery,
  getGallery,
  updateBackgroundPicture,
  getTopFive,
  quickAppointment,
} = require("../Controllers/business.controller");

router.post("/add", authenticateToken, addNewBusiness);
router.delete("/delete", authenticateToken, deleteBusiness);
router.put("/:id", checkAdminBusiness, updateDetailsBusiness);
router.get("/:id", getInfoBusiness);
router.get("/", getAllBusiness);
router.put("/:id/reviews", addNewReview);
router.delete("/:id/reviews", deleteReview);
router.get("/:id/reviews", getAllReviews);
router.put("/:id/shop", addProductToShop);
router.delete("/:id/shop", removeProductFromShop);
router.get("/:id/shop", getShop);
router.put("/:id/gallery", addNewPictureToGallery);
router.delete("/:id/gallery", removePictureFromGallery);
router.get("/:id/gallery", getGallery);
router.put("/:id/background", updateBackgroundPicture);
router.get("/home/top5", getTopFive);
router.post("/home/quickappointment", quickAppointment);

module.exports = router;
