import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: process.env.NODEMAILER_PORT,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.NODEMAILER_USERNAME,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export async function sendEmail(email, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_SENDER_EMAIL, // sender address
      to: email, // list of receivers
      subject,
      text,
    });
    return info;
  } catch (error) {
    console.error("Email send faild", error);
  }
}
