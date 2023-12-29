import express from "express";
import  { protect }  from "../middleware/authMiddleware.js";
const router = express.Router();

import { authUser,
    RegisterUser,
    LogoutUser,
    getUserProfile,
    updateUserProfile } from "../controllers/usercontroller.js";

router.post("/", RegisterUser);
router.post("/auth", authUser);
router.post("/logout", LogoutUser);
router.route("/profile").get(protect,getUserProfile).put(protect,updateUserProfile);

export default router;
