import User from "../model/user.model.js";
import crypto from "crypto";
import { sendEmail } from "../utils/email.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Session from "../model/sessions.model.js";

// create tokens funcation
async function createTokens(user) {
  const accessToken = await jwt.sign(
    { userId: user._id },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    }
  );
  const refreshToken = await jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "30d",
    }
  );

  return { accessToken, refreshToken };
}

const registerUser = async (req, res) => {
  //get user data
  //validate user data
  //check user exists or not
  //create user
  //create token
  // save db token
  // email
  // send res ok
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User exists",
        success: false,
      });
    }
    const user = await User.create({
      name,
      email,
      password,
    });
    if (!user) {
      return res.status(400).json({
        message: "User not created",
        success: false,
      });
    }
    const token = crypto.randomBytes(64).toLocaleString("hex");
    user.verifyToken = token;
    await user.save();
    const emailText = `Please verify your email Id : ${process.env.BASE_URL}/api/v1/user/verify/${token}`;
    const emailRes = await sendEmail(email, "verify your email", emailText);
    if (emailRes) {
      console.log(emailRes);
    }
    return res.status(200).json({
      message: "User created",
      success: true,
      data: {
        name,
        email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Somethings want wrong",
      success: false,
    });
  }
};
const verifyUser = async (req, res) => {
  // get token
  // find in db
  // set verified to true
  // token
  // send res
  const { token } = req.params;
  try {
    const user = await User.findOne({ verifyToken: token });
    if (!user) {
      return res.status(400).json({
        message: "Token Invalied",
        success: false,
      });
    }
    user.isVerified = true;
    user.verifyToken = undefined;
    await user.save();
    return res.status(200).json({
      message: "verified",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Somethings want wrong",
      success: false,
    });
  }
};

const loginUser = async (req, res) => {
  //get user data
  // verify user data
  // db find
  // email veryfay nhi hmm to ak email farsa send kar data
  //password
  //jwt save
  // sand res 200
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(300).json({
      message: "All fields are required ",
      success: false,
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User not exist",
        success: false,
      });
    }
    if (!user.isVerified && user.verifyToken) {
      const emailText = `Please verify your email Id : ${process.env.BASE_URL}/api/v1/user/verify/${user.verifyToken}`;
      const emailRes = await sendEmail(email, "verify your email", emailText);
      if (emailRes) {
        console.log(emailRes);
      }
      return res.status(300).json({
        message: "Email verify tto login",
        success: false,
      });
    }
    const isCurrectPassword = await bcrypt.compare(password, user.password);
    if (!isCurrectPassword) {
      return res.status(300).json({
        message: "Password wrong",
        success: false,
      });
    }

    const { accessToken, refreshToken } = await createTokens(user);
    const newSession = await Session.create({
      user: user._id,
      accessToken,
      refreshToken,
      refreshTokenExpire: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
    if (!newSession) {
      return res.status(400).json({
        message: "Session not created",
        success: false,
      });
    }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (in milliseconds)
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000,
    });
    return res.status(200).json({
      message: "done",
      data: {
        id: user._id,
        accessToken,
        refreshToken,
      },
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Somethings want wrong",
      success: false,
    });
  }
};

const logOutUser = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await Session.findOneAndDelete({ refreshToken });
      res.clearCookie("refreshToken");
      return res.status(200).json({
        message: "Done",
        success: true,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Somethings want wrong",
      success: false,
    });
  }
};

const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token not found",
      success: false,
    });
  }
  try {
    const session = await Session.findOne({ refreshToken });
    if (!session) {
      return res.status(400).json({
        message:
          "Session not found in database with this refresh token Please login again",
        success: false,
      });
    }
    if (session.refreshTokenExpire < Date.now()) {
      return res.status(400).json({
        message: "Session expire Please login again",
        success: false,
      });
    }
    const { accessToken } = await createTokens(session.user);
    session.accessToken = accessToken;
    await session.save();
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000,
    });
    return res.status(200).json({
      message: "Done",
      data: {
        accessToken,
      },
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Somethings want wrong",
      success: false,
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(300).json({
      message: "email not found",
      success: false,
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(300).json({
        message: "User not found",
        success: false,
      });
    }
    const token = crypto.randomBytes(64).toString("hex");
    user.forgotPasswordToken = token;
    user.forgotPasswordTokenExpire = Date.now() + 10 * 60 * 1000;
    await user.save();
    const emailText = `Please verify your email Id with in 10 min : ${process.env.BASE_URL}/api/v1/user/verifytoken/${token}`;
    const emailRes = await sendEmail(
      email,
      "verify your email to change your password",
      emailText
    );
    if (emailRes) {
      console.log("done", emailRes);
    }
    return res.status(200).json({
      message: "email send check inbox",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Somethings want wrong",
      success: false,
    });
  }
};
const forgotPasswordVerify = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!token || !password) {
    return res.status(400).json({
      message: "tokent and password required",
      success: false,
    });
  }
  try {
    const user = await User.findOne({
      forgotPasswordToken: token,
    });
    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }
    if (user.forgotPasswordTokenExpire < Date.now()) {
      return res.status(400).json({
        message: "Token expire",
        success: false,
      });
    }
    user.password = password;
    user.forgotPasswordToken = null;
    user.forgotPasswordTokenExpire = null;
    user.save();
    return res.status(200).json({
      message: "ALl done",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Somethings want wrong",
      success: false,
    });
  }
};
const deleteUserAccount = async (req, res) => {
  const userId = req.userId;
  const { email, password } = req.body;
  if (!userId || !email || !password) {
    return res.status(400).json({
      message: "all data nead",
      success: false,
    });
  }

  const user = await User.findOne({ _id: userId });
  if (!user) {
    return res.status(400).json({
      message: "User not found",
      success: false,
    });
  }
  const isCurrectPassword = await bcrypt.compare(password, user.password);
  if (!isCurrectPassword) {
    return res.status(400).json({
      message: "Vai tu sahi nhi hmm",
      success: false,
    });
  }
  await User.findOneAndDelete({ email });
  return res.status(200).json({
    message: "Done",
    success: true,
  });
};
export {
  registerUser,
  verifyUser,
  loginUser,
  logOutUser,
  forgotPassword,
  forgotPasswordVerify,
  deleteUserAccount,
  refreshAccessToken,
};
