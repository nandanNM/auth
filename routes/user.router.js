import express from "express";
import {
  deleteUserAccount,
  forgotPassword,
  forgotPasswordVerify,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  verifyUser,
} from "../controllers/user.controllers.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.get("/logout", isLoggedIn, logOutUser);
router.post("/forgetpassword", forgotPassword);
router.post("/forgetpassword/:token", forgotPasswordVerify);
router.post("/delete", isLoggedIn, deleteUserAccount);
router.get("/refresh-token", refreshAccessToken);

export default router;
