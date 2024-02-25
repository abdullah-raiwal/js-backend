import { Router } from "express";
import {
  addComment,
  updateComment,
  deleteComment,
  getVideoComments,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const commentRouter = Router();
commentRouter.use(verifyJWT);

commentRouter.route("/:videoId").post(addComment).get(getVideoComments);
commentRouter.route("/c/").delete(deleteComment).patch(updateComment);

export { commentRouter };
