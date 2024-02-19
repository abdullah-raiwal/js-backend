import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const extractPublicId = (fileUrl) => {
  const regex = /\/([^/]+)\.(jpg|mp4)$/;
  const match = fileUrl.match(regex);
  const publicId = match ? match[1] : null;

  return publicId;
};

const getAllVideos = asyncHandler(async (req, res) => {
  // this functions get all videos that logged in searched for.

  const { page = 1, limit = 10, query, sortBy, sortType } = req.query;
  let aggregationPipeline = [];

  // matching query parameters with video title or description
  if (query) {
    aggregationPipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }

  // setting sorting options
  if (sortBy && sortType) {
    let sort = {};
    sort[sortBy] = sortType === "desc" ? -1 : 1;
    aggregationPipeline.push({ $sort: sort });
  }

  // adding pagination
  aggregationPipeline.push({
    $facet: {
      paginatedResults: [{ $skip: limit * (page - 1) }, { $limit: limit }],
      totalCount: [{ $count: "count" }],
    },
  });

  const results = await Video.aggregate(aggregationPipeline);
  const paginatedResults = results[0]?.paginatedResults;
  const totalCount = results[0].totalCount[0]?.count;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { paginatedResults, totalCount },
        "videos retrieved successfully"
      )
    );
});

const publishVideo = asyncHandler(async (req, res) => {
  // getting user, video path and other req params
  const user = req.user;
  const videoLocalPath = req.files?.videofile[0]?.path;

  let thumbnailLocalPath;
  if (
    req.files &&
    Array.isArray(req.files?.thumbnail) &&
    req.files?.thumbnail?.length > 0
  ) {
    thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  }

  const { title, description } = req.body;

  //   validating inputs
  if (!title || !description) {
    throw new ApiError(400, "title and description are required");
  }

  if (!videoLocalPath) {
    throw new ApiError(400, "video is missing");
  }

  //   upload video to cloudinary
  const uploadedVideo = await uploadToCloudinary(videoLocalPath);

  if (!uploadedVideo) {
    throw new ApiError(400, "API error. file not uploaded");
  }

  var thumbnail = "";

  if (!thumbnailLocalPath) {
    thumbnail = uploadedVideo.url.replace(".mp4", ".jpg");
  } else {
    const thumbnailFile = await uploadToCloudinary(thumbnailLocalPath);
    thumbnail = thumbnailFile.url;
  }

  //   create video model and saves to mongo db
  const video = await Video.create({
    videofile: uploadedVideo.url,
    thumbnail: thumbnail,
    owner: user._id,
    title,
    description,
    duration: uploadedVideo.duration,
    ispublished: true,
  });

  if (!video) {
    throw new ApiError("something went wrong when uploading video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video uploaded - TEST RUN"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  const video = await Video.findById({ _id: videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }
  // search for video using videoid in Video collection
  const video = await Video.findById({ _id: videoId });
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  // get video thumbnail and videourl
  const thumbnailId = extractPublicId(video.thumbnail);
  const videofileId = extractPublicId(video.videofile);

  let deletedThumbnail;
  let deletedVideo;

  // check if thumbnail and video file have same public id, means video start frame and thumbnail are same
  if (thumbnailId === videofileId) {
    deletedVideo = await deleteFromCloudinary(videofileId, "video");
    if (deletedVideo.result !== "ok") {
      throw new ApiError(400, "API error. file not properly deleted");
    }
  } else {
    deletedVideo = await deleteFromCloudinary(videofileId, "video");
    deletedThumbnail = await deleteFromCloudinary(thumbnailId, "image");

    if (deletedVideo.result !== "ok" || deletedThumbnail.result !== "ok") {
      throw new ApiError(400, "API error. files not properly deleted");
    }
  }

  // delete video from mongo db
  const deletedVideoDoc = await Video.findByIdAndDelete({ _id: videoId });
  if (!deletedVideoDoc) {
    throw new ApiError(400, "API error. video not deleted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "video deleted successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  
  let thumbNailLocalPath;
  if (req.file && req.file.path) {
    thumbNailLocalPath = req.file.path;
  }

  if([title, description, thumbNailLocalPath].some((field) =>field.trim() === "")) {
    throw new ApiError(400, "atleast provide one of title, description or thumbnail");
  }

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  const video = await Video.findById({ _id: videoId });
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (thumbNailLocalPath) {
    const oldThumbnail = video.thumbnail;
    const newThumbnail = await uploadToCloudinary(thumbNailLocalPath);
    video.thumbnail = newThumbnail.url;
    await deleteFromCloudinary(oldThumbnail);
  }

  if (title) video.title = title;
  if (description) video.description = description;

  const updatedVideo = await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video updated successfully"));
});

export { publishVideo, getVideoById, getAllVideos, deleteVideo, updateVideo };
