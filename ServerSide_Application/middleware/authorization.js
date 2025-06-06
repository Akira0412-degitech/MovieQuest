const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  if (!("authorization" in req.headers) ||
      !req.headers.authorization.match(/^Bearer /)) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found"
    });
    
  }

  const token = req.headers.authorization.replace(/^Bearer /, "");

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({ error: true, message: "JWT token has expired" });
    } else {
      return res.status(401).json({ error: true, message: "Invalid JWT token" });
    }
  }

  next();
};
