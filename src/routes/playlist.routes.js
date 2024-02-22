import { Router } from "express";
import {
  createPlaylist,
  getUserPlayList,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const PlaylistRouter = Router();

PlaylistRouter.use(verifyJWT);
PlaylistRouter.route("/").post(createPlaylist);

PlaylistRouter.route("/user/:userId").get(getUserPlayList);

PlaylistRouter.route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

PlaylistRouter.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
PlaylistRouter.route("/remove/:videoId/:playlistId").patch(
  removeVideoFromPlaylist
);

export { PlaylistRouter };
