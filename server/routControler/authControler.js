import User from "../schema/userSchema.js";
import bcrypt from "bcryptjs";
import jwtToken from "../utils/jwtToken.js";

export const SignUp = async (req, res) => {
    try {
        const { fullname, username, email, password, gender, profilepic } = req.body;

        if (!fullname || !username || !email || !password || !gender) {
            return res.status(400).json({ success: false, message: "Please fill in all required fields" });
        }

        const user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ success: false, message: "Username already exists" });
        }

        const emailpresent = await User.findOne({ email });
        if (emailpresent) {
            return res.status(400).json({ success: false, message: "Email is already registered" });
        }

        const hashPassword = bcrypt.hashSync(password, 10);
        const defaultProfilePic =
            profilepic ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname || username)}&background=4a6bff&color=ffffff&bold=true`;

        const newUser = new User({
            fullname,
            username,
            email,
            password: hashPassword,
            gender,
            profilepic: defaultProfilePic
        });

        await newUser.save();
        const token = jwtToken(newUser._id, res);

        return res.status(201).json({
            success: true,
            _id: newUser._id,
            fullname: newUser.fullname,
            username: newUser.username,
            profilepic: newUser.profilepic,
            email: newUser.email,
            token,
            message: "Account created successfully"
        });
    } catch (error) {
        console.error("SignUp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create account"
        });
    }
};

export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Email does not exist. Please register." });
        }

        const comparePassword = bcrypt.compareSync(password, user.password || "");
        if (!comparePassword) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        const token = jwtToken(user._id, res);
        const userProfilePic =
            user.profilepic && !user.profilepic.includes("avatar.iran.liara.run")
                ? user.profilepic
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || user.username)}&background=4a6bff&color=ffffff&bold=true`;

        return res.status(200).json({
            success: true,
            _id: user._id,
            fullname: user.fullname,
            username: user.username,
            profilepic: userProfilePic,
            email: user.email,
            token,
            message: "Successfully logged in"
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to log in"
        });
    }
};

export const LogOut = async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('jwt', {
            path: '/',
            httpOnly: true,
            sameSite: isProduction ? 'none' : 'lax',
            secure: isProduction,
        });
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("LogOut error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to log out"
        });
    }
};