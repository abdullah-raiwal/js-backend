import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "videoId is not valid");
  }

  try {
    let like;

    like = await Like.findOne({
      video: videoId,
      likedBy: user._id,
    });

    if (!like) {
      like = await Like.create({
        video: videoId,
        likedBy: user._id,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, like, "like created successfully"));
    } else {
      const response = await like.deleteOne();
      console.log("response", response);

      return res
        .status(200)
        .json(new ApiResponse(200, like, "like deleted successfully"));
    }
  } catch (error) {
    throw new ApiError(400, "something went wrong", error);
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const user = req.user;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "commentId is not valid");
  }

  try {
    let like;

    like = await Like.findOne({
      comment: commentId,
      likedBy: user._id,
    });

    if (!like) {
      like = await Like.create({
        comment: commentId,
        likedBy: user._id,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, like, "like created successfully"));
    } else {
      await like.deleteOne();
      return res
        .status(200)
        .json(new ApiResponse(200, like, "like deleted successfully"));
    }
  } catch (error) {
    throw new ApiError(400, "something went wrong", error);
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const user = req.user;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "tweetId is not valid");
  }

  try {
    let like;

    like = await Like.findOne({
      tweet: tweetId,
      likedBy: user._id,
    });

    if (!like) {
      like = await Like.create({
        tweet: tweetId,
        likedBy: user._id,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, like, "like created successfully"));
    } else {
      await like.deleteOne();
      return res
        .status(200)
        .ApiError(new ApiResponse(200, like, "like deleted successfully"));
    }
  } catch (error) {
    throw new ApiError(400, "something went wrong", error);
  }
});

const getAllLikedVideos = asyncHandler(async (req, res) => {
  const user = req.user;

  try {
    const LikedVideos = await Like.aggregate([
      {
        $match: { likedBy: new mongoose.Types.ObjectId(user._id) },
      },
      {
        $project: {
          _id: 0,
          video: 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(200, LikedVideos, "liked videos fetched successfully")
      );
  } catch (error) {
    throw new ApiError(400, "something went wrong", error);
  }
});

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getAllLikedVideos,
};
