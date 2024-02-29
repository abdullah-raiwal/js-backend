import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";

const getChannelVideos = asyncHandler(async (req, res) => {
  const user = req.user;

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user._id),
      },
    },
  ]);

  if (videos.length < 1) {
    return res.status(404).json(new ApiResponse(404, {}, "No videos found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const getChannelStats = asyncHandler(async (req, res) => {
  const user = req.user;

  const totalVideosViews = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user._id),
      },
    },
   {
    $group : {
        _id : "$_id",
        views : { $sum : 1 }
    }
   }
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        totalVideosViews,
        "Total videos views fetched successfully"
      )
    );
});

export { getChannelVideos, getChannelStats };
