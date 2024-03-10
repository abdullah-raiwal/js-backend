import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";

/**
 * @swagger
 * /api/v1/comment/{videoId}:
 *   get:
 *     summary: Get comments for a specific video
 *     tags:
 *       - comment
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         description: The ID of the video
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         description: The page number (default is 1)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         description: The maximum number of comments per page (default is 10)
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Comments fetched successfully
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
 *                   example: Comments fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       '400':
 *         description: Bad request or something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       '404':
 *         description: No comments found for the video
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
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

/**
 * @swagger
 * /api/v1/comment/{videoId}:
 *   post:
 *     summary: Add a new comment to a video
 *     tags:
 *       - comment
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         description: The ID of the video
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the comment
 *     responses:
 *       '200':
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       '400':
 *         description: Bad request or something went wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /api/v1/comment/c:
 *   delete:
 *     summary: Delete a comment
 *     tags:
 *       - comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commentId:
 *                 type: string
 *                 description: The ID of the comment to be deleted
 *     responses:
 *       '200':
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       '400':
 *         description: Bad request, comment not found, or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @swagger
 * /api/v1/comment/c:
 *   put:
 *     summary: Update a comment
 *     tags:
 *       - comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commentId:
 *                 type: string
 *                 description: The ID of the comment to be updated
 *               content:
 *                 type: string
 *                 description: The updated content of the comment
 *     responses:
 *       '200':
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       '400':
 *         description: Bad request, comment not found, unauthorized, or invalid content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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
