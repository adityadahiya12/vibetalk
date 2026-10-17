import CallLog from "../schema/callLogSchema.js";

// Log a call (saved when a call ends or is rejected/missed)
export const createCallLog = async (req, res) => {
  try {
    const currentUserID = req.user?._id || req.user?.id;
    if (!currentUserID) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const {
      calleeId,
      participants,
      callType = "direct",
      roomName,
      purpose = "Catch up & Vibe",
      status = "completed",
      duration = 0,
      startedAt,
    } = req.body;

    const log = await CallLog.create({
      caller: currentUserID,
      callee: calleeId || undefined,
      participants: Array.isArray(participants) ? participants : [],
      callType,
      roomName: roomName || (callType.includes("group") ? "VibeTalk Room" : ""),
      purpose: purpose?.slice(0, 150) || "Catch up & Vibe",
      status,
      duration: Number(duration) || 0,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      endedAt: new Date(),
    });

    const populatedLog = await CallLog.findById(log._id)
      .populate("caller", "fullname username profilepic email")
      .populate("callee", "fullname username profilepic email")
      .populate("participants", "fullname username profilepic email");

    return res.status(201).json({ success: true, log: populatedLog });
  } catch (error) {
    console.error("createCallLog error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch call history for current user (calls made, received, or group meetings participated in)
export const getMyCallHistory = async (req, res) => {
  try {
    const currentUserID = req.user?._id || req.user?.id;
    if (!currentUserID) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const logs = await CallLog.find({
      $or: [
        { caller: currentUserID },
        { callee: currentUserID },
        { participants: currentUserID },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("caller", "fullname username profilepic email")
      .populate("callee", "fullname username profilepic email")
      .populate("participants", "fullname username profilepic email");

    return res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("getMyCallHistory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
