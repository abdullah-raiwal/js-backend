import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";

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
