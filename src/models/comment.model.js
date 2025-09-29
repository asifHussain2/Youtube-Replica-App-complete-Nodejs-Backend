import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content:{type:String,required:true},
    owner:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    video:{type:mongoose.Schema.Types.ObjectId,ref:"Video",required:true},      
},{timestamps:true});


export const Comment = mongoose.model("Comment",commentSchema);
commentSchema.plugin(mongooseAggregatePaginate);