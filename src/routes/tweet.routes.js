import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  updateTweet,
  deleteTweet,
  getAllTweets,
} from "../controllers/tweet.controller.js";

const tweetRouter = Router();
tweetRouter.use(verifyJWT);

tweetRouter.route("/").post(createTweet).get(getAllTweets);
tweetRouter.route("/:tweetId").patch(updateTweet).delete(deleteTweet);


export { tweetRouter };
