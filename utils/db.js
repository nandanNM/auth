import mongoose from "mongoose";

export default function connectDB() {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then((res) => {
      console.log("Connect to DB");
      // console.log("res", res);
    })
    .catch((err) => {
      console.log("Connection faild:", err);
    });
}
