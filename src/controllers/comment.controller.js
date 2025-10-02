import mongoose, { Aggregate } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const comments =await Comment.aggregate([
        {$match:{video:new mongoose.Types.ObjectId(videoId)},
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {
                $project:{
                    username:1,
                    avatar:1
                }
            }
            ]
        }
    },
    {
        $unwind:"$owner"
    },
    {
        $sort:{createdAt:-1}
    },
    {
        $skip:(parseInt(page)-1)*parseInt(limit)
    },
    {$limit:parseInt(limit)}
    ])

    const totalComments = await Comment.countDocuments({video:videoId});
    const totalPages =Math.ceil( totalComments/parseInt(limit));

    res.status(200).json(new ApiResponse(200,{comments,totalComments,page:parseInt(page),limit:parseInt(limit),totalPages}))
   
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    if(!content || content.trim()===""){
        throw new ApiError(400, "Comment content is required")
    }

     const comment = await Comment.create({content:content.trim(),video:videoId,owner:req?.user?._id});
    const createdComment = await Comment.aggregate([
        {
            $match:{_id:new mongoose.Types.ObjectId(comment._id)}
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$owner"
        }
    ])
        res.status(201).json(new ApiResponse(201,{comment:createdComment[0]},"comment added"))
})




const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;

    if(!content){
       throw new ApiError(400,"content is required");
    }

   const updatedComment = await Comment.findOneAndUpdate({_id:commentId,owner:req?.user?._id},{
        $set:{
            content:content
        }
    },{new:true})

    if(!updatedComment){
   throw new ApiError(404,"comment not found")
}

res.status(200).json(new ApiResponse(200,updatedComment,"Comment updated"))

})



const deletedComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    const deletedComment = await Comment.findOneAndDelete({_id:commentId,owner:req?.user?._id});
    if(!deletedComment){
        throw new ApiError(404,"comment not found to delete")
    }

    res.status(200).json(new ApiResponse(200,deletedComment,"Comment deleted"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deletedComment
    }
