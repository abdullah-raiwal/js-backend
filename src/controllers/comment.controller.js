import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, `Invalid videoId: ${videoId}`);
  }

  try {
    const videoComments = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $sort: { createdAt: -1 }, // Optional: Sort by creation date descending
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);

    if (!videoComments) {
      return res.status(404).json(new ApiResponse(404, "no comments"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, videoComments, "comments fetched successfully")
      );
  } catch (error) {
    throw new ApiError(400, "something went wrong", error);
  }
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "videoId is required");
  }
  if (!content) {
    throw new ApiError(400, "content is required");
  }

  try {
    const comment = await Comment.create({
      content,
      video: videoId,
      owner: req.user._id,
    });

    if (!comment) {
      throw new ApiError(400, "Api error. comment not created");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "comment created successfully"));
  } catch (error) {
    throw new ApiError(400, "something went wrong", error);
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "commentId is not valid");
  }

  const comment = await Comment.findOne({ _id: commentId });
  if (!comment) {
    throw new ApiError(400, "comment not found");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "you are not the owner of this comment");
  }

  try {
    await comment.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "comment deleted successfully"));
  } catch (error) {
    throw new ApiError(400, "something went wrong", error);
  }
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.body;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "commentId is not valid");
  }

  if (!content.toString() === "") {
    throw new ApiError(400, "content is required");
  }

  const comment = await Comment.findOne({ _id: commentId });
  if (!comment) {
    throw new ApiError(400, "comment not found");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "you are not the owner of this comment");
  }

  comment.content = content;
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment updated successfully"));
});

export { getVideoComments, addComment, deleteComment, updateComment };
