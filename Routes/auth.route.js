const router = require("express").Router();
const { authenticateToken } = require("../Middleware/Auth");

const {
  register,
  login,
  fastLogin,
  forgotPassword,
  resetPassword,
} = require("../Controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.get("/fast-login", authenticateToken, fastLogin); //Facebook / Google
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:id/:token", resetPassword);
module.exports = router;
