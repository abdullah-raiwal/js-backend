import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getChannelVideos,
  getChannelStats,
} from "../controllers/dashboard.controller.js";

const dashboardRouter = Router();
dashboardRouter.use(verifyJWT);

dashboardRouter.route("/videos").get(getChannelVideos);
dashboardRouter.route("/stats").get(getChannelStats);

export { dashboardRouter };
