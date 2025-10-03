import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const totalVideos = await Video.countDocuments({owner: req?.user?._id, isPublished: true});
    const totalSubscribers = await Subscription.countDocuments({channel: req?.user?._id});
    const totalViewsAggregate = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req?.user?._id),
                isPublished: true
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {$sum: "$views"}
            }
        }
    ]);
    const totalViews = totalViewsAggregate[0]?.totalViews || 0;

    const totalLikesAggregate = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $match: {
                "videoDetails.owner": new mongoose.Types.ObjectId(req?.user?._id)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: {$sum: 1}
            }
        }
    ]);
    const totalLikes = totalLikesAggregate[0]?.totalLikes || 0;

    res.status(200).json(new ApiResponse(200,{
          totalVideos,
        totalSubscribers,
        totalViews,
        totalLikes
    },"Channel stats fetched successfully"))     
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const videos = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req?.user?._id),
                isPublished:true
            },

        }
    ])

    res.status(200).json(new ApiResponse(200,videos,"All Videos"))
})

export {
    getChannelStats, 
    getChannelVideos
    }