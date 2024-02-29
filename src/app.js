import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

// configure cors policies. this is to make sure our backend only communicates with specfic frontend
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// configure json limit. as we can get data as json from front-end we need to config this
app.use(express.json({ limit: "16kb" }));
// configure urls. as we will get data from urls too.
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// config for static files like public folder we created
app.use(express.static("public"));
// config for cookie parser to do crud on user cookies
app.use(cookieParser());

import { userRoutes } from "./routes/user.routes.js";
import { videoRoutes } from "./routes/video.routes.js";
import { tweetRouter } from "./routes/tweet.routes.js";
import { SubscriptionRouter } from "./routes/subscription.routes.js";
import { PlaylistRouter } from "./routes/playlist.routes.js";
import { likeRouter } from "./routes/like.routes.js";
import { commentRouter } from "./routes/comment.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/video", videoRoutes);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/subscriptions", SubscriptionRouter);
app.use("/api/v1/playlist", PlaylistRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.get("/api/v1", (req, res) => {
  res.status(200).json({
    message: "api is working",
  });
});

export { app };
