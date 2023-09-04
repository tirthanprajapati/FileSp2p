import express from "express";
const router = express.Router();

import { authUser,
    RegisterUser,
    LogoutUser,
    getUserProfile,
    updateUserProfile } from "../controllers/usercontroller.js";

router.post("/", RegisterUser);
router.post("/auth", authUser);
router.post("/logout", LogoutUser);
router.route("/profile").get(getUserProfile).put(updateUserProfile);

export default router;
