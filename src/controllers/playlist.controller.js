import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";

/**
 * @swagger
 * /api/v1/playlist/:
 *   post:
 *     summary: Create a new playlist
 *     tags:
 *       - playlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the playlist
 *                 example: My Playlist
 *               description:
 *                 type: string
 *                 description: Description of the playlist
 *                 example: Collection of favorite songs
 *     responses:
 *       '201':
 *         description: Playlist created successfully
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
 *                       example: 60bc68aeb3d8b40015c863b5
 *                     name:
 *                       type: string
 *                       example: My Playlist
 *                     description:
 *                       type: string
 *                       example: Collection of favorite songs
 *                     owner:
 *                       type: string
 *                       example: 60bc68aeb3d8b40015c863b6
 *       '400':
 *         description: Bad request, name and description are required
 */
const createPlaylist = asyncHandler(async (req, res) => {
  const user = req.user;
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "name and description are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: user._id,
  });

  if (!playlist) {
    throw new ApiError(400, "Api Error. playlist not created");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, playlist, "playlist created successfully"));
});

/**
 * @swagger
 * /api/v1/playlist/user/{userId}:
 *   get:
 *     summary: Get playlists of a specific user
 *     tags:
 *       - playlist
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose playlists are to be retrieved
 *     responses:
 *       '200':
 *         description: Playlists found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60bc68aeb3d8b40015c863b5
 *                       name:
 *                         type: string
 *                         example: My Playlist
 *                       description:
 *                         type: string
 *                         example: Collection of favorite songs
 *                       videos:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: 60bc68aeb3d8b40015c863b6
 *       '400':
 *         description: Bad request, userId is not valid or playlist not found
 */
const getUserPlayList = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userId is not valid.");
  }

  const playlist = await Playlist.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    { $project: { _id: 1, name: 1, description: 1, videos: 1 } },
  ]);

  if (!playlist) {
    throw new ApiError(400, "Api Error. playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist found successfully"));
});

/**
 * @swagger
 * /api/v1/playlist/{playlistId}:
 *   get:
 *     summary: Get a playlist by its ID
 *     tags:
 *       - playlist
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the playlist to retrieve
 *     responses:
 *       '200':
 *         description: Playlist found successfully
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
 *                       example: 60bc68aeb3d8b40015c863b5
 *                     name:
 *                       type: string
 *                       example: My Playlist
 *                     description:
 *                       type: string
 *                       example: Collection of favorite songs
 *                     videos:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: 60bc68aeb3d8b40015c863b6
 *       '400':
 *         description: Bad request, playlistId is not valid or playlist not found
 */
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlistId is not valid.");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Api Error. playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist found successfully"));
});

/**
 * @swagger
 * /api/v1/playlist/add/{videoId}/{playlistId}:
 *   post:
 *     summary: Add a video to a playlist
 *     tags:
 *       - playlist
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the playlist to add the video to
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the video to add to the playlist
 *     responses:
 *       '200':
 *         description: Video added to playlist successfully
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
 *                       example: 60bc68aeb3d8b40015c863b5
 *                     name:
 *                       type: string
 *                       example: My Playlist
 *                     description:
 *                       type: string
 *                       example: Collection of favorite songs
 *                     videos:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: 60bc68aeb3d8b40015c863b6
 *       '400':
 *         description: Bad request, videoId or playlistId is not valid, video or playlist not found, or video already in playlist
 */
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "videoId or playlistId is not valid.");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Api Error. video not found");
  }
  const playList = await Playlist.findById(playlistId);

  if (!playList) {
    throw new ApiError(400, "Api Error. playlist not found");
  }

  if (playList.videos.includes(video._id)) {
    throw new ApiError(400, "Api Error. video already in playlist");
  }

  playList.videos.push(video._id);
  await playList.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, playList, "video added to playlist successfully")
    );
});

/**
 * @swagger
 * /api/v1/playlist/remove/{videoId}/{playlistId}:
 *   delete:
 *     summary: Remove a video from a playlist
 *     tags:
 *       - playlist
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the playlist to remove the video from
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the video to remove from the playlist
 *     responses:
 *       '200':
 *         description: Video removed from playlist successfully
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
 *                       example: 60bc68aeb3d8b40015c863b5
 *                     name:
 *                       type: string
 *                       example: My Playlist
 *                     description:
 *                       type: string
 *                       example: Collection of favorite songs
 *                     videos:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: 60bc68aeb3d8b40015c863b6
 *       '400':
 *         description: Bad request, videoId or playlistId is not valid, video or playlist not found, or video not in playlist
 */
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "videoId or playlistId is not valid.");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Api Error. video not found");
  }
  const playList = await Playlist.findById(playlistId);
  if (!playList) {
    throw new ApiError(400, "Api Error. playlist not found");
  }

  if (!playList.videos.includes(video._id)) {
    throw new ApiError(400, "Api Error. video not in playlist");
  }

  playList.videos.pull(video._id);
  await playList.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, playList, "video removed from playlist successfully")
    );
});

/**
 * @swagger
 * /api/v1/playlist/{playlistId}:
 *   put:
 *     summary: Update a playlist
 *     tags:
 *       - playlist
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the playlist to update
 *       - in: body
 *         name: body
 *         required: true
 *         description: Playlist name and description to update
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             description:
 *               type: string
 *     responses:
 *       '200':
 *         description: Playlist updated successfully
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
 *                       example: 60bc68aeb3d8b40015c863b5
 *                     name:
 *                       type: string
 *                       example: My Playlist
 *                     description:
 *                       type: string
 *                       example: Collection of favorite songs
 *       '400':
 *         description: Bad request, playlistId is not valid or playlist not found
 */
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlistId is not valid.");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Api Error. playlist not found");
  }

  Object.assign(playlist, {
    name: name ?? playlist.name,
    description: description ?? playlist.description,
  });

  try {
    await playlist.save();
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "playlist updated successfully"));
  } catch (error) {
    throw new ApiError(400, "Api Error. playlist not updated");
  }
});

/**
 * @swagger
 * /api/v1/playlist/{playlistId}:
 *   delete:
 *     summary: Delete a playlist
 *     tags:
 *       - playlist
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the playlist to delete
 *     responses:
 *       '200':
 *         description: Playlist deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Playlist deleted successfully
 *       '404':
 *         description: Playlist not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Api Error. Playlist not found
 *       '403':
 *         description: Forbidden, user is not the owner of the playlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are not the owner of this playlist
 *       '400':
 *         description: Bad request, playlistId is not valid
 */
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const user = req.user;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlistId is not valid.");
  }

  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res
        .status(404)
        .json(new ApiResponse(404, "Api Error. playlist not found"));
    }

    if (playlist.owner.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this playlist" });
    }

    const result = await Playlist.deleteOne({ _id: playlistId });

    console.log("Delete result:", result);

    res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    // Handle database or other errors more gracefully
    res.status(500).json({ message: "Error deleting playlist" });
  }
});

export {
  createPlaylist,
  getUserPlayList,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
};
