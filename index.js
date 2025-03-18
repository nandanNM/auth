import express from "express";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRouter from "./routes/user.router.js";
import cookieParser from "cookie-parser";
const app = express();
dotenv.config();

const port = process.env.PORT || 3000;

connectDB();
app.use(express.json());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use("/api/v1/user", userRouter);

app.get("/", (req, res) => {
  console.log(res);
  // console.log(req);
  return res.send("Hello World! chaiCode 🤗");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
