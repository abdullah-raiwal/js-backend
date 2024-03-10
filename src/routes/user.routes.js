import { Router } from "express";
import {
  RegisterUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverPhoto,
  getChannelProfile,
  getWatchHistory,
  passwordResetMail,
  resetPassword,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRoutes = Router();

userRoutes.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  RegisterUser
);
userRoutes.route("/login").post(loginUser);
userRoutes.route("/logout").post(verifyJWT, logoutUser);
userRoutes.route("/refresh-token").post(refreshAccessToken)
userRoutes.route("/update-password").post(verifyJWT, updatePassword);
userRoutes.route("/current-user").get(verifyJWT, getCurrentUser);
userRoutes.route("/update-account-details").patch(verifyJWT, updateAccountDetails);
userRoutes.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
userRoutes.route("/update-cover-photo").patch(verifyJWT, upload.single("coverimage"), updateCoverPhoto);
userRoutes.route("/channel/:username").get(verifyJWT, getChannelProfile);
userRoutes.route("/get-watch-history").get(verifyJWT, getWatchHistory);
userRoutes.route("/reset-password").post(passwordResetMail);
userRoutes.route("/reset-password/:userId/:token").post(resetPassword)

export { userRoutes };
