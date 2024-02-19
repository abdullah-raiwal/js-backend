import { Router } from "express";
import {
  publishVideo,
  getVideoById,
  getAllVideos,
  deleteVideo,
  updateVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const videoRoutes = Router();
videoRoutes.use(verifyJWT);

videoRoutes
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videofile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishVideo
  );

videoRoutes
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

export { videoRoutes };
