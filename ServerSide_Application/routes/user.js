const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const SALT_ROUNDS = 10;

// POST /user/register
router.post("/register", async (req, res) => {
  const db = req.db;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete: email and password are required.",
    });
  }

  try {
    const existingUser = await db("users").where({ email }).first();
    if (existingUser) {
      return res.status(409).json({
        error: true,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await db("users").insert({
      email: email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User created",
    });
  } catch (err) {
    console.error("Error during /user/register:", err);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

// POST /user/login
router.post("/login", async (req, res) => {
  const db = req.db;
  const { email, password, longExpiry} = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete: email and password are required.",
    });
  }

  try {
    const user = await db("users").where({ email }).first();
    if (!user) {
      return res.status(401).json({
        error: true,
        message: "Invalid email or password",
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        error: true,
        message: "Invalid email or password",
      });
    }

    const bearerExp = longExpiry ? 60 * 60 * 24 * 365 : 600;
    const refreshExp = longExpiry ? 60 * 60 * 24 * 365 : 86400;

    const bearertoken = jwt.sign(
      { email: user.email, type: "Bearer" },
      JWT_SECRET,
      { expiresIn: bearerExp }
    );

    const refreshToken = jwt.sign(
      { email: user.email, type: "Refresh" },
      JWT_SECRET,
      { expiresIn: refreshExp }
    );
    await db("users")
      .where({ email })
      .update({ refresh_token: refreshToken });

    return res.status(200).json({
      bearerToken: {
        token: bearertoken,
        token_type: "Bearer",
        expires_in: bearerExp,
      },
      refreshToken: {
        token: refreshToken,
        token_type: "Refresh",
        expires_in: refreshExp,
      },
    });
  } catch (err) {
    console.error("Error during /user/login:", err);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

router.post("/refresh", async (req, res) => {
  const db = req.db;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete, refresh token required",
    });
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const email = decoded.email;
    if (decoded.type !== "Refresh") {
      return res.status(401).json({
        error: true,
        message: "Invalid token type",
      });
    }

    
    const user = await db("users").where({ email }).first();

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({
        error: true,
        message: "Invalid or reused refresh token",
      });
    }
    await db("users").where({ email }).update({ refresh_token: "" });

    const bearerExpiresIn = 600;
    const refreshExpiresIn = 86400;

    const newBearerToken = jwt.sign(
      { email: email, type: "Bearer" },
      JWT_SECRET,
      { expiresIn: bearerExpiresIn }
    );

    const newrefreshToken = jwt.sign(
      { email: email, type: "Refresh" },
      JWT_SECRET,
      { expiresIn: refreshExpiresIn }
    );

    await db("users")
      .where({ email })
      .update({ refresh_token: newrefreshToken });

    return res.status(200).json({
      bearerToken: {
        token: newBearerToken,
        token_type: "Bearer",
        expires_in: bearerExpiresIn,
      },
      refreshToken: {
        token: newrefreshToken,
        token_type: "Refresh",
        expires_in: refreshExpiresIn,
      },
    });
  } catch (err) {
    if (err.name == "TokenExpiredError" || err.name == "JsonWebTokenError") {
      return res.status(401).json({
        error: true,
        message: "Invalid JWT token",
      });
    }
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

router.post("/logout", async (req, res) => {
  const db = req.db;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete, refresh token required",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const email = decoded.email;
    const user = await db("users").where({ email }).first();

    if (user.refresh_token !== refreshToken) {
      return res.status(401).json({
        error: true,
        message:"JWT token has expired",
      });
    }
    await db("users").where({ email }).update({ refresh_token: "" });

    return res.status(200).json({
      error: false,
      message: "Token successfully invalidated",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError")
      return res.status(401).json({
        error: true,
        message:"Invalid JWT token",
      });
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});
//get user/{email}/profile
router.get("/:email/profile", async (req, res) => {
  const db = req.db;
  const authHeader = req.headers["authorization"];
  const { email } = req.params;
  let isValid = false;
  let decoded;

  if (!email) {
    return res.status(400).json({
      error: true,
      message: "Address not found",
    });
  }

  try {
    const user = await db("users")
      .select("email", "firstName", "lastName", "dob", "address")
      .where("email", email)
      .first();

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    if (authHeader) {
      if (!authHeader.startsWith("Bearer")) {
        return res.status(401).json({
          error: true,
          message: "Authorization header is malformed",
        });
      }

      const bearerToken = authHeader.split(" ")[1];

      try {
        decoded = jwt.verify(bearerToken, JWT_SECRET);
        if (decoded.email === email) {
          isValid = true;
        }
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            error: true,
            message: "Invalid JWT token",
          });
        } else if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            error: true,
            message: "Invalid JWT token",
          });
        }
      }
    }

    return res.status(200).json({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      ...(isValid && {
        dob: user.dob,
        address: user.address,
      }),
    });
  } catch (err) {
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

//POST user/{email}/profile
router.put("/:email/profile", async (req, res) => {
  const db = req.db;
  const authHeader = req.headers["authorization"];
  const { firstName, lastName, dob, address } = req.body;
  let decoded;
  const {email} = req.params

  if (!firstName || !lastName || !dob || !address) {
    return res.status(400).json({
      error: true,
      message:
        "Request body incomplete: firstName, lastName, dob and address are required.",
    });
  }


  if(typeof firstName !== "string"|| 
    typeof lastName !== "string" ||
    typeof dob !== "string" ||
    typeof address !== "string"
  ){
    return res.status(400).json({
      error : true,
      message: "Request body invalid: firstName, lastName and address must be strings only."
    })
  }

  const isValidDOB = /^\d{4}-\d{2}-\d{2}$/.test(dob);

  if(!isValidDOB){
    return res.status(400).json({
      error : true,
      message :  "Invalid input: dob must be a real date in format YYYY-MM-DD."
    })
  }

  const dobDate = new Date(dob);
  const today = new Date();
  const minDate = new Date("1900-01-01");

  const isValidDate = (
    /^\d{4}-\d{2}-\d{2}$/.test(dob) &&             
    !isNaN(dobDate.getTime()) &&                   
    dob === dobDate.toISOString().slice(0, 10) &&  
    dobDate <= today &&
    dobDate >= minDate                        
  );

  if(dobDate > today){
    return res.status(400).json({
      error: true,
      message : "Invalid input: dob must be a date in the past."
    })
  }

  if(dobDate < minDate){
    return res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real past date in format YYYY-MM-DD."
    })
  }

  if (!isValidDate) {
    return res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
    });
  }


  if (authHeader) {
    if (!authHeader.startsWith("Bearer")) {
      return res.status(401).json({
        error: true,
        message: "Authorization header is malformed",
      });
    }
  }
  try {
    const bearerToken = authHeader.split(" ")[1];
    decoded = jwt.verify(bearerToken, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: true,
        message: "Invalid JWT token",
      });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: true,
        message: "Invalid JWT token",
      });
    }
  }
  if(!decoded){
      return res.status(401).json({
        "error": true,
        "message": "Authorization header ('Bearer token') not found"
      })
    };

  if(decoded.email != email){
    return res.status(403).json(
      {
        "error": true,
        "message": "Forbidden"
      }
    )
  };

  try {
    const user = await db("users")
    .where('email', email)
    .first();

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    await db('users')
    .where('email', email)
    .update({
    firstName,
    lastName,
    dob,
    address});

    const updatedUser = await db('users')
    .select('email', "firstName", "lastName", 'dob', "address")
    .where('email', email)
    .first();

    const plainUser = {
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      dob: new Date(updatedUser.dob).toISOString().slice(0, 10),
      address: updatedUser.address
    };
    
    return res.status(200).json(plainUser);

    
  }
  catch (err) {
  console.error("Error during profile update:", err);
  return res.status(500).json({
    error: true,
    message: "Internal server error",
  });
}
});
module.exports = router;
