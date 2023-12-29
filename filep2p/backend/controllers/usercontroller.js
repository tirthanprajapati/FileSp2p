import asyncHandler from "express-async-handler";
import User from "../model/UserModel.js";
import generatetoken from "../utils/generatetoken.js";

// description: Auth User/Set Token
// route: POST /api/users/auth
// @access Public

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPasswords(password))) {
    generatetoken(res, user._id);
    res.status(201).json({
      //something was created 201
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// description: Register new user
// route: POST /api/users
// @access Public

const RegisterUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExsist = await User.findOne({ email: email });
  if (userExsist) {
    res.status(400);
    throw new Error("User already exisit");
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    generatetoken(res, user._id);
    res.status(201).json({
      //something was created 201
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// description: Logout User
// route: POST /api/users/logout
// @access Public

const LogoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "User logged out" });
});

// description: Get user profile
// route: GET /api/users/porfile
// @access Private

const getUserProfile = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  };

  res.status(200).json(user);
});

// description: Update User Profile
// route: PUT /api/users/auth
// @access Public

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updateUser = await user.save();

    res.json({
      _id: updateUser._id,
      name: updateUser.name,
      email: updateUser.email,
    });
  } else {
    res.status(400);
    throw new Error("User not Found");
  }

});

export {
  authUser,
  RegisterUser,
  LogoutUser,
  getUserProfile,
  updateUserProfile,
};
