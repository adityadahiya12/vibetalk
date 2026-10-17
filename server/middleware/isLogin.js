import jwt from 'jsonwebtoken';
import User from '../schema/userSchema.js';

const isLogin = async (req, res, next) => {
    try {
        const token =
            req.cookies?.jwt ||
            req.headers?.cookie?.split("; ").find((cookie) => cookie.startsWith("jwt="))?.split("=")[1] ||
            req.headers?.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ success: false, message: "User Unauthorized" });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        if (!decode || !decode.userId) {
            return res.status(401).json({ success: false, message: "User Unauthorized - Invalid Token" });
        }

        const user = await User.findById(decode.userId).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log(`error in isLogin middleware: ${error.message}`);
        res.status(401).json({
            success: false,
            message: error.message || "Unauthorized"
        });
    }
};

export default isLogin;