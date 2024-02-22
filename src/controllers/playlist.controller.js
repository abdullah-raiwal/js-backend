import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";

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
