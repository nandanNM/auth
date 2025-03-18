import jwt from "jsonwebtoken";

export const isLoggedIn = (req, res, next) => {
  try {
    const { accessToken } = req.cookies;
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }
    const decodedValue = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    req.userId = decodedValue;
    next();
  } catch (error) {
    console.log("Auth middleware failure");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
