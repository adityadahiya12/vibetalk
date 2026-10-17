import { io } from "socket.io-client";

let socket;

const socketUrl = import.meta.env.VITE_API_SOCKET_URL || "http://localhost:3000";

const getSocket = () => {
    if (!socket) {
        socket = io(socketUrl, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });
    }
    return socket;
};

const setSocket = () => {
    if (socket) {
        try {
            socket.disconnect();
        } catch {
            // ignore
        }
    }
    socket = null;
};

export default {
    getSocket,
    setSocket,
};