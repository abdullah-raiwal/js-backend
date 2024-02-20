import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  toggleSubscription,
  getChannelSubscribers,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";

const SubscriptionRouter = Router();
SubscriptionRouter.use(verifyJWT);

SubscriptionRouter.route("/channel/:channelId")
  .post(toggleSubscription)
  .get(getChannelSubscribers);

SubscriptionRouter.route("/user").get(getSubscribedChannels);

export { SubscriptionRouter };
