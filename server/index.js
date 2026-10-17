// Import required modules
import express from "express"; // Express.js framework to create the backend server
import dotenv from "dotenv"; // dotenv is used to load environment variables from a `.env` file
import cors from "cors"; // CORS allows frontend & backend communication
import cookieParser from "cookie-parser"; // Parses cookies from incoming requests
import { createServer } from "http"; // Creates an HTTP server (needed for WebSocket support)
import { Server } from "socket.io"; // Import `Server` from `socket.io` for real-time communication

// Import custom route files
import authRoute from "./rout/authRout.js"; // Import authentication routes (login/signup)
import userRoute from "./rout/userRout.js"; // Import user-related routes (profile, users)
import callRoute from "./rout/callRout.js"; // Import call logs and history routes
import dbConnection from "./db/dbConnect.js"; // Import function to connect to MongoDB database

// ✅ Load environment variables (from `.env` file)
dotenv.config();

// 🌍 Create an Express application
const app = express();

// 🔧 Set up server port (from `.env` or default to 3000)
const PORT = process.env.PORT || 3000;

// 📡 Create an HTTP server to work with Express (needed for WebSockets)
const server = createServer(app);

// 🌍 Allowed frontend origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow all localhost / 127.0.0.1 ports in development
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
    return true;
  }
  return false;
};

// 🔧 Middleware to handle CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// 🛠 Middleware for handling JSON requests and cookies
app.use(express.json()); // Enables parsing of JSON request bodies
app.use(cookieParser()); // Enables reading cookies in HTTP requests

// 🔗 Define API routes (mount both with and without /api prefix for robust compatibility)
app.use("/api/auth", authRoute);
app.use("/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/user", userRoute);
app.use("/api/call", callRoute);
app.use("/call", callRoute);

// ✅ Test Route to check if the server is running
app.get("/ok", (req, res) => {
  res.json({ message: "Server is running!" });
});

// 🔥 Initialize Socket.io for real-time communication
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});
console.log("[SUCCESS] Socket.io initialized with CORS");

// 🟢 Store online users and active calls
let onlineUsers = []; // Array to store online users [{ userId, name, socketId }]
const activeCalls = new Map(); // Map to track ongoing calls: userId -> { with: userId, peerSocketId }

// 📞 Handle WebSocket (Socket.io) connections
io.on("connection", (socket) => {
  console.log(`[INFO] New connection: ${socket.id}`);

  // 🔹 Emit an event to send the socket ID to the connected user
  socket.emit("me", socket.id);

  // 📡 User joins the chat system
  socket.on("join", (user) => {
    if (!user || !user.id) {
      console.warn("[WARNING] Invalid user data on join");
      return;
    }

    socket.join(user.id); // Add user to a room with their ID
    const existingIndex = onlineUsers.findIndex((u) => u.userId === user.id);

    if (existingIndex !== -1) {
      onlineUsers[existingIndex].socketId = socket.id;
      onlineUsers[existingIndex].name = user.name;
    } else {
      onlineUsers.push({
        userId: user.id,
        name: user.name,
        socketId: socket.id,
      });
    }

    io.emit("online-users", onlineUsers);
  });

  // 📞 Handle outgoing call request
  socket.on("callToUser", (data) => {
    const callee = onlineUsers.find((user) => user.userId === data.callToUserId);

    if (!callee) {
      socket.emit("userUnavailable", { message: "User is offline." });
      return;
    }

    // Check if callee is already in a call
    if (activeCalls.has(data.callToUserId)) {
      socket.emit("userBusy", { message: "User is currently in another call." });

      io.to(callee.socketId).emit("incomingCallWhileBusy", {
        from: socket.id,
        callerUserId: data.callerUserId || data.fromUserId,
        name: data.name,
        email: data.email,
        profilepic: data.profilepic,
      });
      return;
    }

    // Emit event to the callee's socket
    io.to(callee.socketId).emit("callToUser", {
      signal: data.signalData,
      from: socket.id, // Caller socket ID
      callerUserId: data.callerUserId || data.fromUserId,
      name: data.name,
      email: data.email,
      profilepic: data.profilepic,
      purpose: data.purpose || "Quick check-in & chat",
    });
  });

  // 👥 Group Video Calling & Meeting Rooms Signaling (Full-mesh multi-peer)
  socket.on("join-group-room", (data) => {
    const { roomId, roomName, callType, user: userInfo, purpose } = data;
    socket.join(roomId);

    // Get all other clients in this room
    const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
      .filter((id) => id !== socket.id);

    // Send back the list of existing users to the newly joined member
    socket.emit("all-group-users", {
      users: clientsInRoom,
      roomName,
      callType,
      purpose,
    });

    // Notify existing room members about the newly joined user
    socket.to(roomId).emit("user-joined-group", {
      callerId: socket.id,
      user: userInfo,
      callType,
      roomName,
      purpose,
    });
  });

  // Relay WebRTC handshake signal between peers in group room
  socket.on("sending-group-signal", (payload) => {
    io.to(payload.userToSignal).emit("user-joined-signal", {
      signal: payload.signal,
      callerId: payload.callerId,
      user: payload.user,
    });
  });

  socket.on("returning-group-signal", (payload) => {
    io.to(payload.callerId).emit("receiving-returned-signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  // Group room chat / test messages
  socket.on("send-group-message", (data) => {
    if (data.roomId) {
      io.to(data.roomId).emit("receive-group-message", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Group room reaction
  socket.on("send-group-reaction", (data) => {
    if (data.roomId) {
      io.to(data.roomId).emit("receive-group-reaction", data);
    }
  });

  // Leave group room
  socket.on("leave-group-room", (data) => {
    if (data.roomId) {
      socket.leave(data.roomId);
      socket.to(data.roomId).emit("user-left-group", {
        userId: data.userId,
        socketId: socket.id,
        name: data.name,
      });
    }
  });

  // 📞 Handle when a call is accepted
  socket.on("answeredCall", (data) => {
    io.to(data.to).emit("callAccepted", {
      signal: data.signal,
      from: socket.id, // Callee socket ID
    });

    const calleeUser = onlineUsers.find((u) => u.socketId === socket.id);
    const callerUser = onlineUsers.find((u) => u.socketId === data.to);

    if (calleeUser && callerUser) {
      activeCalls.set(calleeUser.userId, { with: callerUser.userId, peerSocketId: data.to });
      activeCalls.set(callerUser.userId, { with: calleeUser.userId, peerSocketId: socket.id });
    }
  });

  // ❌ Handle call rejection
  socket.on("reject-call", (data) => {
    if (data.to) {
      io.to(data.to).emit("callRejected", {
        name: data.name,
        profilepic: data.profilepic,
      });
    }
  });

  // 📴 Handle call ending
  socket.on("call-ended", (data) => {
    if (data.to) {
      io.to(data.to).emit("callEnded", {
        name: data.name,
      });
    }

    const user = onlineUsers.find((u) => u.socketId === socket.id);
    if (user) {
      const active = activeCalls.get(user.userId);
      if (active) {
        activeCalls.delete(active.with);
        activeCalls.delete(user.userId);
      }
    }
  });

  // 🎥 Handle camera & microphone status sync between peers
  socket.on("toggle-media", (data) => {
    if (data && data.to) {
      io.to(data.to).emit("peer-media-toggle", {
        type: data.type, // 'camera' | 'mic'
        enabled: data.enabled,
        from: socket.id,
      });
    }
  });

  // ✨ Handle real-time face-to-face emoji reactions
  socket.on("send-reaction", (data) => {
    if (data && data.to) {
      io.to(data.to).emit("receive-reaction", {
        reaction: data.reaction,
        name: data.name,
        from: socket.id,
      });
    }
  });

  // ❌ Handle user disconnecting from the server
  socket.on("disconnect", () => {
    const user = onlineUsers.find((u) => u.socketId === socket.id);
    if (user) {
      const active = activeCalls.get(user.userId);
      if (active) {
        if (active.peerSocketId) {
          io.to(active.peerSocketId).emit("callEnded", { name: user.name });
        }
        activeCalls.delete(active.with);
        activeCalls.delete(user.userId);
      }
    }

    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("online-users", onlineUsers);
    socket.broadcast.emit("disconnectUser", { disUser: socket.id });

    console.log(`[INFO] Disconnected: ${socket.id}`);
  });
});

// 🏁 Start the server after connecting to the database
(async () => {
  try {
    await dbConnection(); // Connect to MongoDB
    server.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
  }
})();
