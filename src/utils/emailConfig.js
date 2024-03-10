import * as dotenv from "dotenv";
dotenv.config();
import { createTransport } from "nodemailer";
const transport = createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendMail = async (to, subject, resetLink) => {
  try {
    const mailres = await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      text: `
                 you have requested a password for your account
                 ${resetLink}
             `,
    });
    return mailres;
  } catch (error) {
    throw new Error(error.message);
  }
};

export { sendMail };
