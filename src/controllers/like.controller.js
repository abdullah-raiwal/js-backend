import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";

/**
 * @swagger
 * /api/v1/like/toggle/v/{videoId}:
 *   post:
 *     summary: Toggle like on a video
 *     tags:
 *       - like
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the video to like/unlike
 *     responses:
 *       '200':
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Like created successfully or Like deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The ID of the like
 *                     video:
 *                       type: string
 *                       description: The ID of the video liked
 *                     likedBy:
 *                       type: string
 *                       description: The ID of the user who liked the video
 *       '400':
 *         description: Bad request, videoId is not valid
 */
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

/**
 * @swagger
 * /api/v1/like/toggle/c/{commentId}:
 *   post:
 *     summary: Toggle like on a comment
 *     tags:
 *       - like
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to like/unlike
 *     responses:
 *       '200':
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Like created successfully or Like deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The ID of the like
 *                     comment:
 *                       type: string
 *                       description: The ID of the comment liked
 *                     likedBy:
 *                       type: string
 *                       description: The ID of the user who liked the comment
 *       '400':
 *         description: Bad request, commentId is not valid
 */
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

/**
 * @swagger
 * /api/v1/like/toggle/t/{tweetId}:
 *   post:
 *     summary: Toggle like on a tweet
 *     tags:
 *       - like
 *     parameters:
 *       - in: path
 *         name: tweetId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tweet to like/unlike
 *     responses:
 *       '200':
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Like created successfully or Like deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The ID of the like
 *                     tweet:
 *                       type: string
 *                       description: The ID of the tweet liked
 *                     likedBy:
 *                       type: string
 *                       description: The ID of the user who liked the tweet
 *       '400':
 *         description: Bad request, tweetId is not valid
 */
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

/**
 * @swagger
 * /api/v1/like/videos:
 *   get:
 *     summary: Get all videos liked by the user
 *     tags:
 *       - like
 *     responses:
 *       '200':
 *         description: Liked videos fetched successfully
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
 *                   example: Liked videos fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       video:
 *                         type: string
 *                         description: The ID of the liked video
 *       '400':
 *         description: Bad request or something went wrong
 */
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
