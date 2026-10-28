import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
const connectDB = async () => {
    try{
const connection=await mongoose.connect(process.env.MONGO_URI)
console.log(`MongoDB Connected: ${connection.connection.host}`);
    }
    catch(error){
        console.error(` Mongo Db connection Error: ${error.message}`);
        process.exit(1);
    }
}
export default connectDB;