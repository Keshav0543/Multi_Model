import mongoose from "mongoose";
const {Schema}=mongoose;

const UserSchema=new Schema({
    EmailId:{
        type:String,
        required:true,
    },

    Password:{
        type:String,
        required:true,
    },

    userId:{
        type:String,
        required:true
    }

},{timestamps:true});

const userschema=mongoose.model("userschema",UserSchema);

export default userschema;