import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @swagger
 * /api/v1/tweet/:
 *   post:
 *     summary: Create a new tweet
 *     tags:
 *       - tweet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *             required:
 *               - content
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Tweet created successfully
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
 *                     owner:
 *                       type: string
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Tweet created successfully
 *       '400':
 *         description: Bad request, tweet content is required
 */
const createTweet = asyncHandler(async (req, res) => {
  const user = req.user;
  const { content } = req.body;

  console.log("req body :", req.body);

  if (!content) {
    throw new ApiError(400, "tweet content is required");
  }

  const tweet = await Tweet.create({
    owner: user._id,
    content,
  });

  if (!tweet) {
    throw new ApiError(400, "Api error. tweet not created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet created successfully"));
});

/**
 * @swagger
 * /api/v1/tweet/:
 *   get:
 *     summary: Get all tweets of the authenticated user
 *     tags:
 *       - tweet
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: List of tweets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID of the tweet
 *                   content:
 *                     type: string
 *                     description: Content of the tweet
 *                   owner:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: ID of the tweet owner
 *                       username:
 *                         type: string
 *                         description: Username of the tweet owner
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Date and time when the tweet was created
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Date and time when the tweet was last updated
 *       '400':
 *         description: Bad request, tweets not found or API error
 */
const getAllTweets = asyncHandler(async (req, res) => {
  const user = req.user;

  const userTweets = await Tweet.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(user._id) }, // Match tweets owned by the user
    },
    {
      $lookup: {
        from: "users", // Assuming your users collection is named "users"
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner", // Deconstruct the owner array
    },
    {
      $project: {
        _id: 1,
        content: 1,
        owner: {
          _id: "$owner._id",
          username: "$owner.username",
        },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!userTweets) {
    throw new ApiError(400, "Api error. tweets not found");
  }

  return res.status(200).json(userTweets);
});

/**
 * @swagger
 * /api/v1/tweets/{tweetId}:
 *   put:
 *     summary: Update a tweet
 *     tags:
 *       - tweet
 *     parameters:
 *       - in: path
 *         name: tweetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the tweet to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *             required:
 *               - content
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Tweet updated successfully
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
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Tweet updated successfully
 *       '400':
 *         description: Bad request, tweet content is required or tweetId is missing
 */
const updateTweet = asyncHandler(async (req, res) => {
  const user = req.body;
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content) {
    throw new ApiError(400, "tweet content is required");
  }
  if (!tweetId) {
    throw new ApiError(400, "tweetId is required");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content,
    },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(400, "Api error. tweet not updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated successfully"));
});

/**
 * @swagger
 * /api/v1/tweets/{tweetId}:
 *   delete:
 *     summary: Delete a tweet
 *     tags:
 *       - tweet
 *     parameters:
 *       - in: path
 *         name: tweetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the tweet to delete
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Tweet deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Tweet deleted successfully
 *       '400':
 *         description: Bad request, tweetId is missing or API error
 */
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "tweetId is required");
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);
  if (!tweet) {
    throw new ApiError(400, "Api error. tweet not deleted");
  }
  return res.status(200).json(200, "tweet deleted successfully");
});

export { createTweet, getAllTweets, updateTweet, deleteTweet };
