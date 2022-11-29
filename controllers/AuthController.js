const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { application } = require("express");


const JWT_SECRET = "gb32hj4rgyT^%^%R^ygahjgdfajsh7*^&*^&*T'#'@~@ddfeqgwrlkjnwefr";

const register = (req, res) => {
  var fname = req.body.fname;
  var email = req.body.email;
  var password = req.body.password;
  var newsletter = req.body.newsletter;

  if (
    !email ||
    typeof email !== "string" ||
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    ) === false
  ) {
    return res.json({ status: "error", error: "Invalid email" });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return res.json({ status: "error", error: "Invalid password" });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      res.json({
        error: err,
      });
    }

    let user = new User({
      email: email,
      password: hashedPassword,
      fname: fname,
      newsletter: newsletter,
    });

    user
      .save()
      .then((user) => {
        res.json({
          status: "ok",
          message: "User added successfully!",
        });
      })
      .catch((error) => {
        if (error.code === 11000) {
          console.log("Duplicate key");
          res.json({
            status: "error",
            error: "Email already exists!",
          });
        } else {
          console.log("Error: not duplicate key");
          res.json({
            status: "error",
            message: "An error occurred!",
            error: error,
          });
        }
      });
  });
};

const login = (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  try {
    User.findOne({ email: email }, 'password').then((user) => {
      if (user) {
        bcrypt.compare(password, user.password, function (err, result) {
          if (err) {
            res.json({
              error: err,
            });
          }
          if (result) {
            let token = jwt.sign({ id: user._id }, JWT_SECRET, {
              expiresIn: "1h",
            });
            res.cookie("token", token, { httpOnly: true, maxAge: 1000 * 60 * 60 });
            res.json({
              status: "ok",
              message: "Login successful!",
              id: user._id,
              token,
            });
          } else {
            res.json({
              status: "error",
              error: "No User found with this email or Password for the user is incorrect!",
            });
          }
        });
      } else {
        res.json({
          status: "error",
          error: "No User found with this email or Password for the user is incorrect!",
        });
      }
    });
  } catch (error) {
    res.json({
      status: "error",
      error: error,
    });
  }
};

const authUser = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.json(false);
  try {
    jwt.verify(token, JWT_SECRET, async (err, user) => {
      console.log("user", user);
      return res.json(true, user);
    });
  } catch (err) {
    return res.json(false);
  }
};

const getUser = async (req, res) => {
  console.log("getUser");
  const { token } = req.body;
  console.log("token", token);
  if (!token) return res.json(false);
  try {
    jwt.verify(token, JWT_SECRET, async (err, user) => {
      console.log("user", user);
      const userFound = await User.findOne({ _id: user.id });
      return res.json(userFound);
    });
  } catch (err) {
    return res.json(false);
  }
};



const changePassword = async (req, res) => {
  const { token, newpassword: plainTextPassword } = req.body;
  try {
  jwt.verify(token, JWT_SECRET, async (err, user) => {
    console.log("user", user);
    const hashedPassword = await bcrypt.hash(plainTextPassword, 10);
    await User.updateOne({ _id: user.id }, { $set: { password: hashedPassword } });

    res.json({
      status: "ok",
      message: "Password changed successfully!",
    });
  });
  } catch (error) {
    res.json({
      status: "error",
      error: error,
    });
  }
};

// logout doens't need method, just delete the token from the client side and keep the token expiry time short

// delete account
const deleteAccount = async (req, res) => {
  const { token } = req.body;
  try {
  jwt.verify(token, JWT_SECRET, async (err, user) => {
    console.log("user", user);
    await User.deleteOne({ _id: user.id });

    res.json({
      status: "ok",
      message: "Account deleted successfully!",
    });
  });
  } catch (error) {
    res.json({
      status: "error",
      error: error,
    });
  }
};

// forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email }); // TODO: only get values needed
    console.log("forgot password");
    if (user) {
      // TODO: send email to user with a link to reset password
      res.json({
        status: "ok",
        message: "If user exists the password reset email will have been sent successfully!",
      });
    } else {
      res.json({
        status: "ok",
        error: "If user exists the password reset email will have been sent successfully!",
      });
    }
  } catch (error) {
    res.json({
      status: "error",
      error: error,
    });
  }
};




module.exports = {
  register,
  login,
  authUser,
  getUser,
  changePassword,
  deleteAccount,
  forgotPassword,
};
