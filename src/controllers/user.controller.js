import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { tokenReset } from "../models/resetTokenSchema.model.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { sendMail } from "../utils/emailConfig.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               fullname:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - email
 *               - fullname
 *               - password
 *     responses:
 *       '201':
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullname:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     coverimage:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *       '400':
 *         description: Bad request, invalid input data
 *       '409':
 *         description: Conflict, user already exists
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Something went wrong while registering the user
 */
const RegisterUser = asyncHandler(async (req, res) => {
  // get data from user (front end)
  const { username, email, fullname, password } = req.body;

  // perform validatios
  if (
    [username, email, fullname, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  //   get avatar and coverimage localfile path
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverimage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files?.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverimage[0]?.path;
  }

  //   checks if avatar is provided
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar image is required");
  }

  //   upload avatar and coverimage to cloudinary
  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverimage = await uploadToCloudinary(coverImageLocalPath);

  //   checks if avatar is uploaded
  if (!avatar) {
    throw new ApiError(400, "avatar image is not uploaded");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user created successfully"));
});

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - password
 *     responses:
 *       '200':
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         fullname:
 *                           type: string
 *                         avatar:
 *                           type: string
 *                         coverimage:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: User logged in successfully
 *       '400':
 *         description: Bad request, provide either email or username or password is missing
 *       '401':
 *         description: Unauthorized, password is incorrect
 *       '404':
 *         description: Not found, user not found
 */
const loginUser = asyncHandler(async (req, res) => {
  // get user data -> req.body
  const { email, username, password } = req.body;

  // validate if email or username is provided

  if (email && username) {
    throw new ApiError(400, "provide either email or username");
  }

  if (!password) {
    throw new ApiError(400, "password is required");
  }

  // find user by email or username
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  // check for correct password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password is incorrect");
  }

  // generate access token and refresh token

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedinUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

/**
 * @swagger
 * /api/v1/users/logout:
 *   post:
 *     summary: Logout user
 *     tags:
 *       - users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties: {}
 *                 message:
 *                   type: string
 *                   example: User logged out successfully
 */
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

/**
 * @swagger
 * /api/v1/users/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags:
 *       - users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *             required:
 *               - refreshToken
 *     responses:
 *       '200':
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *       '400':
 *         description: Bad request, unauthorized access
 *       '401':
 *         description: Unauthorized, refresh token is mismatch or user not found
 *       '500':
 *         description: Internal server error
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "unauthorized access");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedRefreshToken._id);

    if (!user) {
      throw new ApiError(401, "unauthorized access");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh Token is mismatch");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

/**
 * @swagger
 * /api/v1/users/update-password:
 *   put:
 *     summary: Update user password
 *     tags:
 *       - users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *             required:
 *               - oldPassword
 *               - newPassword
 *     responses:
 *       '200':
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties: {}
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       '400':
 *         description: Bad request, invalid old password
 *       '500':
 *         description: Internal server error
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError("invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password updated successfully"));
});

/**
 * @swagger
 * /api/v1/users/current:
 *   get:
 *     summary: Get current user
 *     tags:
 *       - users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: User fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullname:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     coverimage:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: User fetched successfully
 *       '401':
 *         description: Unauthorized, user not authenticated
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req?.user;

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user fetched successfully"));
});

/**
 * @swagger
 * /api/v1/users/update-account:
 *   put:
 *     summary: Update account details
 *     tags:
 *       - users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *             anyOf:
 *               - required:
 *                   - username
 *               - required:
 *                   - email
 *     responses:
 *       '200':
 *         description: Account details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullname:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     coverimage:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Account details updated successfully
 *       '400':
 *         description: Bad request, username or email is required
 *       '401':
 *         description: Unauthorized, user not authenticated
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  if (!username && !email) {
    throw new ApiError(404, "username or email is required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"));
});

/**
 * @swagger
 * /api/v1/users/update-avatar:
 *   put:
 *     summary: Update user avatar
 *     tags:
 *       - users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullname:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     coverimage:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Avatar updated successfully
 *       '400':
 *         description: Bad request, avatar is missing or not uploaded
 *       '401':
 *         description: Unauthorized, user not authenticated
 */
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file.path;
  if (!avatarLocalPath) {
    throw new ApiError(40, "avatar is missing");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  console.log(avatar);

  if (!avatar.url) {
    throw new ApiError(400, "API error. file not uploaded");
  }

  await deleteFromCloudinary(req.user.avatar);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

/**
 * @swagger
 * /api/v1/users/update-cover-photo:
 *   put:
 *     summary: Update user cover photo
 *     tags:
 *       - users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Cover photo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullname:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     coverimage:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Cover photo updated successfully
 *       '400':
 *         description: Bad request, cover image is missing or not uploaded
 *       '401':
 *         description: Unauthorized, user not authenticated
 */
const updateCoverPhoto = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover image is missing");
  }

  const coverImage = await uploadToCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "API error. file not uploaded");
  }

  await deleteFromCloudinary(req.user.coverimage);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverimage: coverImage.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated successfully"));
});

/**
 * @swagger
 * /api/v1/users/channel/{username}:
 *   get:
 *     summary: Get channel profile
 *     tags:
 *       - users
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: Username of the channel to fetch profile
 *     responses:
 *       '200':
 *         description: Channel profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     fullname:
 *                       type: string
 *                     username:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     coverimage:
 *                       type: string
 *                     subscribersCount:
 *                       type: number
 *                     channelSubscribedToCount:
 *                       type: number
 *                     isSubscribed:
 *                       type: boolean
 *                 message:
 *                   type: string
 *                   example: Channel profile fetched successfully
 *       '400':
 *         description: Bad request, username is required
 *       '404':
 *         description: Not found, channel not found
 */
const getChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is required");
  }

  // first find channel by username

  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        avatar: 1,
        coverimage: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "channel profile fetched successfully")
    );
});

/**
 * @swagger
 * /api/v1/users/watch-history:
 *   get:
 *     summary: Get user's watch history
 *     tags:
 *       - users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Watch history fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullname:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     watchHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           owner:
 *                             type: object
 *                             properties:
 *                               username:
 *                                 type: string
 *                               fullname:
 *                                 type: string
 *                               avatar:
 *                                 type: string
 *                 message:
 *                   type: string
 *                   example: Watch history fetched successfully
 *       '404':
 *         description: Not found, user not found
 */
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchhistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "watch history fetched successfully"));
});

/**
 * @swagger
 * /api/v1/users/password-reset-mail:
 *   post:
 *     summary: Send password reset email
 *     tags:
 *       - users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *     responses:
 *       '200':
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: string
 *                   example: "Password reset mail has been sent"
 *                 message:
 *                   type: string
 *                   example: "Password reset mail has been sent to <user_email>"
 *       '400':
 *         description: Bad request, email required
 *       '404':
 *         description: Not found, user not found
 */
const passwordResetMail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log(req.body);

  if (!email) {
    throw new ApiError(404, "email required");
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "user not found"));
    }

    const token = randomBytes(32).toString("hex");
    console.log("token", token);

    const resetLink = `${process.env.BASE_URL}/password-reset/${user._id}/${token}`;
    console.log("resetLink", resetLink);

    await tokenReset.create({ userId: user._id, token });

    console.log(process.env);
    await sendMail(user.email, "password reset link", resetLink);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          `password reset mail has been send to ${user.email}`
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(400, "Api error", error);
  }
});

/**
 * @swagger
 * /api/v1/users/reset-password/{userId}/{token}:
 *   put:
 *     summary: Reset user password
 *     tags:
 *       - users
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID for password reset
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token for password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *             required:
 *               - password
 *     responses:
 *       '200':
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data: {}
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       '400':
 *         description: Bad request, API error occurred
 *       '404':
 *         description: Not found, user or token not found
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { userId, token } = req.params;
  const { password } = req.body;

  if (!userId && !token) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "userId or token is required"));
  }
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "user not found"));
    }

    const resetToken = await tokenReset.findOne({ userId: userId, token });
    if (!resetToken) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "token not found or invalid token"));
    }

    user.password = password;
    await user.save({ validateBeforeSave: false });
    await tokenReset.deleteOne({ userId: userId, token });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "password updated successfully"));
  } catch (error) {
    throw new ApiError(400, "Api error", error);
  }
});

export {
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
};
