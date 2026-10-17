import User from "../schema/userSchema.js";
import mongoose from "mongoose";

const formatUser = (user) => {
    if (!user) return user;
    const doc = user.toObject ? user.toObject() : { ...user };
    if (!doc.profilepic || doc.profilepic.includes("avatar.iran.liara.run")) {
        const name = doc.fullname || doc.username || "User";
        doc.profilepic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4a6bff&color=ffffff&bold=true`;
    }
    return doc;
};

// Get all users (excluding current logged-in user)
export const getAllUsers = async (req, res) => {
    const currentUserID = req.user?._id || req.user?._conditions?._id || req.user?.id;
    if (!currentUserID) {
        return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    try {
        const users = await User.find(
            { _id: { $ne: currentUserID } },
            "fullname username email profilepic"
        );
        const formattedUsers = users.map(formatUser);
        return res.status(200).json({ success: true, users: formattedUsers });
    } catch (error) {
        console.error("getAllUsers error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Search user by username or email
export const getUserByUsernameOrEmail = async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ success: false, message: "Query is required." });
    }

    try {
        const user = await User.findOne(
            { $or: [{ username: query }, { email: query }] },
            "fullname email username profilepic"
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({ success: true, user: formatUser(user) });
    } catch (error) {
        console.error("getUserByUsernameOrEmail error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid user ID." });
    }

    try {
        const user = await User.findById(id, "fullname email username gender profilepic");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({ success: true, user: formatUser(user) });
    } catch (error) {
        console.error("getUserById error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};