import jwt from "jsonwebtoken";
import Session from "../model/sessions.model.js";
import { createTokens } from "../controllers/user.controllers.js";

export const isLoggedIn = async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }
    const isTokenExpired = jwt.decode(accessToken).exp < Date.now() / 1000;
    if (isTokenExpired) {
      const decodedRefreshToken = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await createTokens(decodedRefreshToken.userId);
      const session = await Session.findOneAndUpdate(
        { user: decodedRefreshToken.userId },
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          refreshTokenExpire: Date.now() + 30 * 24 * 60 * 60 * 1000,
        },
        { new: true, upsert: true }
      );
      if (!session) {
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });
      next();
    } else {
      const decodedValue = jwt.verify(
        accessToken,
        process.env.JWT_ACCESS_SECRET
      );
      console.log("decodedValue,", decodedValue);
      req.userId = decodedValue;
      next();
    }
  } catch (error) {
    console.log("Auth middleware failure", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
