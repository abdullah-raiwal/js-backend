import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

/**
 * @swagger
 * /api/v1/subscription/channel/{channelId}:
 *   post:
 *     summary: Toggle subscription to a channel
 *     tags:
 *       - subscription
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the channel to subscribe/unsubscribe
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Subscription status toggled successfully
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
 *                       description: ID of the subscription document
 *                     subscriber:
 *                       type: string
 *                       description: ID of the subscribing user
 *                     channel:
 *                       type: string
 *                       description: ID of the channel being subscribed/unsubscribed
 *                 message:
 *                   type: string
 *                   example: Subscription status toggled successfully
 *       '400':
 *         description: Bad request, channelId is required or user tries to subscribe to themselves
 */
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const user = req.user;

  if (channelId === user._id) {
    throw new ApiError(400, "you cannot subscribe to yourself");
  }

  if (!channelId) {
    throw new ApiError(400, "channelId is required");
  }

  // check if subscription doc exists -> match doc with channelId and user._id (subscriber)
  let subscription;
  subscription = await Subscription.findOne({
    subscriber: user._id,
    channel: channelId,
  });

  if (!subscription) {
    // create new subscription doc
    subscription = await Subscription.create({
      subscriber: user._id,
      channel: channelId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, subscription, "subscription created successfully")
      );
  } else {
    // delete subscription doc
    await subscription.deleteOne();

    return res
      .status(200)
      .json(
        new ApiResponse(200, subscription, "subscription deleted successfully")
      );
  }
});

/**
 * @swagger
 * /api/v1/subscription/channel/{channelId}:
 *   get:
 *     summary: Get subscribers of a channel
 *     tags:
 *       - subscription
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the channel whose subscribers are to be fetched
 *     responses:
 *       '200':
 *         description: Subscribers fetched successfully
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
 *                       username:
 *                         type: string
 *                         example: john_doe
 *                       _id:
 *                         type: string
 *                         example: 5fd5a9e8c7bffd3474997f45
 *       '400':
 *         description: Bad request, channelId is missing
 *       '404':
 *         description: No subscribers found for the channel
 */
const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  console.log(channelId);
  if (!channelId) {
    throw new ApiError(400, "channelId is required");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        "subscriberDetails.username": 1,
        _id: 1,
      },
    },
  ]);

  if (!subscribers) {
    throw new ApiError(404, "no subscribers found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "subscribers fetched successfully")
    );
});

/**
 * @swagger
 * /api/v1/subscription/channel/user:
 *   get:
 *     summary: Get channels subscribed by the user
 *     tags:
 *       - subscription
 *     responses:
 *       '200':
 *         description: Subscriptions fetched successfully
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
 *                       username:
 *                         type: string
 *                         example: john_doe
 *                       fullname:
 *                         type: string
 *                         example: John Doe
 *                       subscriberCount:
 *                         type: number
 *                         example: 10
 *       '400':
 *         description: Bad request, no subscriptions found
 */
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const user = req.user;

  const channelSubscribed = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(user._id) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
      },
    },
    {
      $unwind: "$channelDetails",
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "channel",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $project: {
        "channelDetails.username": 1,
        "channelDetails.fullname": 1,
        subscriberCount: { $size: "$subscribers" },
        _id: 0,
      },
    },
  ]);

  if (!channelSubscribed) {
    throw new ApiError(400, "no subscriptions found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelSubscribed,
        "subscriptions fetched successfully"
      )
    );
});

export { toggleSubscription, getChannelSubscribers, getSubscribedChannels };
