const jwt = require("jsonwebtoken");
const logger = require("../Utils/logs/logger");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(` `)[1];

    if (!token) {
      logger.error("Invalid Token");
      return res.sendStatus(401);
    }

    if (token.length === 1173) {
      //Google Login

      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GG_APP_ID,
      });
      const payload = ticket.getPayload();
      const user = {
        first_name: payload.given_name,
        last_name: payload.family_name,
        email: payload.email,
      };

      logger.info("Token Verefied");
      req.user = user;
      next();

    } else if (token.length <= 200) {
      //Facebook Login
      await axios
        .get(`https://graph.facebook.com/v17.0/me?access_token=${token}`)
        .then((res) => {
          axios
            .get(
              `https://graph.facebook.com/v17.0/${res.data.id}?fields=id,first_name,last_name,email&access_token=${token}`
            )
            .then((res) => {
              logger.info("Token Verefied");
              req.user = res.data;
              next();
            })
            .catch();
        })
        .catch();
    } else {
      jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
        if (err) {
          logger.error(err);
          return res.sendStatus(403);
        }

        logger.info("Token Verefied");
        req.user = data.user;
        next();
      });
    }
  } catch (err) {
    logger.error(err);
    return res.sendStatus(500);
  }
}

module.exports = { authenticateToken };
