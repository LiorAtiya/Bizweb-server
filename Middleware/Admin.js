const jwt = require("jsonwebtoken");
const logger = require("../Utils/logs/logger");

async function checkAdminBusiness(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(` `)[1];

    if (!token) {
      logger.error("Invalid Token");
      return res.sendStatus(500);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
      if (err) {
        logger.error(err);
        return res.sendStatus(500);
      }

      if (data.user.business.includes(req.params.id)) {
        logger.info("Authorized user");
        next();
      } else {
        logger.error("Unauthorized user");
        return res.sendStatus(500);
      }
    });
  } catch (err) {
    logger.error(err);
    return res.status(500);
  }
}

module.exports = { checkAdminBusiness };
