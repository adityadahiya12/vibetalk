import React, { useEffect, useRef, useState, useCallback } from 'react';
import socketInstance from '../components/socketio/VideoCallSocket';
import {
  FaBars,
  FaTimes,
  FaPhoneAlt,
  FaMicrophone,
  FaVideo,
  FaVideoSlash,
  FaMicrophoneSlash,
  FaExpand,
  FaCompress,
  FaColumns,
  FaSmile,
  FaUsers,
  FaHistory,
  FaPlus,
  FaPaperPlane,
  FaBriefcase,
  FaHeart,
  FaInfoCircle,
  FaCheckCircle,
  FaClock,
  FaUserFriends,
  FaDesktop,
  FaRegCopy
} from "react-icons/fa";
import { FaPhoneSlash } from "react-icons/fa6";
import Lottie from "lottie-react";
import { Howl } from "howler";
import wavingAnimation from "../../assets/waving.json";
import apiClient from "../../apiClient";
import { useUser } from '../../context/UserContextApi';
import { RiLogoutBoxLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import Peer from 'simple-peer';

// Cyber Color Palette
const cyberColors = {
  electricBlue: '#4a6bff',
  neonCyan: '#00f5d4',
  deepMidnight: '#0a0f2e',
  softGlitch: '#8a9eff',
  cyberWhite: '#f0f4ff',
  pulsePink: '#ff3e9d',
  cyberPurple: '#8a2be2',
  emergencyRed: '#ff3a3a',
  emerald: '#10b981',
  glassBg: 'rgba(10, 15, 46, 0.85)',
  glassBorder: 'rgba(138, 158, 255, 0.25)',
};

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" }
];

const EMOJI_LIST = ["❤️", "", "", "", "", "", "", "✨"];

// Subcomponent for each peer's video feed in a group call
const GroupPeerVideo = ({ peer, peerInfo, isSpeaking }) => {
  const ref = useRef(null);

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
        ref.current.play().catch(() => {});
      }
    });
  }, [peer]);

  const name = peerInfo?.fullname || peerInfo?.username || "Participant";
  const avatar = peerInfo?.profilepic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4a6bff&color=ffffff&bold=true`;

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500/30 shadow-lg flex items-center justify-center group">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-xs">
        <img src={avatar} alt={name} className="w-5 h-5 rounded-full object-cover" />
        <span className="font-bold text-white truncate max-w-[120px]">{name}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, updateUser } = useUser();
  const navigate = useNavigate();

  // Navigation tab state: 'directory' | 'groups' | 'history'
  const [activeTab, setActiveTab] = useState('directory');

  // Directory State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOnline, setUserOnline] = useState([]);
  const [me, setMe] = useState("");
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);

  // 1-Line Pre-call Purpose / Test message
  const [callPurpose, setCallPurpose] = useState("Catch up & discuss updates");
  const [incomingCallPurpose, setIncomingCallPurpose] = useState("");

  // 1-on-1 Call State
  const [callerWating, setCallerWating] = useState(false);
  const [reciveCall, setReciveCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callRejectedPopUp, setCallRejectedPopUp] = useState(false);
  const [rejectorData, setCallrejectorData] = useState(null);

  // Group Call State (Family & Professional Meetings)
  const [isInGroupCall, setIsInGroupCall] = useState(false);
  const [currentGroupRoom, setCurrentGroupRoom] = useState(null); // { id, name, type, purpose }
  const [groupPeers, setGroupPeers] = useState([]); // [{ peerId, peer, peerInfo }]
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupType, setNewGroupType] = useState('group-family'); // 'group-family' | 'group-professional'
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPurpose, setNewGroupPurpose] = useState('');
  const [joinRoomIdInput, setJoinRoomIdInput] = useState('');

  // Group in-call chat
  const [groupMessages, setGroupMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Call History State
  const [callHistory, setCallHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Media Streams State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Screen Sharing State
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef(null);

  // Camera & Mic Controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [peerCamOn, setPeerCamOn] = useState(true);
  const [peerMicOn, setPeerMicOn] = useState(true);

  // Layout & Interaction
  const [viewMode, setViewMode] = useState('split');
  const [pipPosition, setPipPosition] = useState('bottom-right');
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

  // Refs
  const myVideo = useRef(null);
  const groupMyVideo = useRef(null);
  const reciverVideo = useRef(null);
  const connectionRef = useRef(null);
  const streamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const currentPeerSocketIdRef = useRef(null);
  const ringtoneRef = useRef(null);
  const callTimerRef = useRef(null);
  const callContainerRef = useRef(null);
  const peersRef = useRef([]); // for group peer tracking
  const callStartTimeRef = useRef(null);

  // Initialize ringtone
  useEffect(() => {
    ringtoneRef.current = new Howl({
      src: ["/ringtone.mp3"],
      loop: true,
      volume: 1.0,
    });

    return () => {
      ringtoneRef.current?.stop();
    };
  }, []);

  const playRingtone = useCallback(() => {
    try {
      ringtoneRef.current?.play();
    } catch {
      // Audio autoplay policy ignored
    }
  }, []);

  const stopRingtone = useCallback(() => {
    try {
      ringtoneRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  const socket = socketInstance.getSocket();

  // Call duration counter
  useEffect(() => {
    if (callAccepted || isInGroupCall) {
      setCallDuration(0);
      callStartTimeRef.current = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
      callStartTimeRef.current = null;
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [callAccepted, isInGroupCall]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Save Call Log to Database via Backend API
  const logCallSummary = useCallback(async (params) => {
    try {
      await apiClient.post('/call/log', {
        calleeId: params.calleeId,
        participants: params.participants || [],
        callType: params.callType || 'direct',
        roomName: params.roomName || '',
        purpose: params.purpose || 'General conversation',
        status: params.status || 'completed',
        duration: params.duration || 0,
        startedAt: params.startedAt || new Date(),
      });
    } catch (err) {
      console.warn("Could not save call log:", err.message);
    }
  }, []);

  // Fetch Call History
  const fetchCallHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await apiClient.get('/call/history');
      if (res.data?.success && Array.isArray(res.data.logs)) {
        setCallHistory(res.data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch call history", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchCallHistory();
    }
  }, [activeTab, fetchCallHistory]);

  // Safe Media Stream Cleanup
  const endCallCleanup = useCallback((logDetails = null) => {
    stopRingtone();

    if (logDetails) {
      logCallSummary(logDetails);
    }

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    // Stop active screen sharing stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch { /* ignore */ }
      });
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch { /* ignore */ }
      });
      streamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch { /* ignore */ }
      });
      remoteStreamRef.current = null;
    }

    if (reciverVideo.current) {
      reciverVideo.current.srcObject = null;
    }

    if (myVideo.current) {
      myVideo.current.srcObject = null;
    }

    if (groupMyVideo.current) {
      groupMyVideo.current.srcObject = null;
    }

    if (connectionRef.current) {
      try { connectionRef.current.destroy(); } catch { /* ignore */ }
      connectionRef.current = null;
    }

    // Cleanup all group peer connections
    if (peersRef.current.length > 0) {
      peersRef.current.forEach((p) => {
        try { p.peer.destroy(); } catch { /* ignore */ }
      });
      peersRef.current = [];
    }

    currentPeerSocketIdRef.current = null;
    setGroupPeers([]);
    setIsInGroupCall(false);
    setCurrentGroupRoom(null);
    setGroupMessages([]);
    setCallerWating(false);
    setLocalStream(null);
    setRemoteStream(null);
    setReciveCall(false);
    setCallAccepted(false);
    setSelectedUser(null);
    setCaller(null);
    setCallerSignal(null);
    setCallerName("");
    setIncomingCallPurpose("");
    setIsMicOn(true);
    setIsCamOn(true);
    setPeerCamOn(true);
    setPeerMicOn(true);
    setShowEmojiPicker(false);
    setShowChatPanel(false);
  }, [stopRingtone, logCallSummary]);

  // Synchronize local video stream with myVideo ref (1-on-1)
  useEffect(() => {
    if (myVideo.current && streamRef.current) {
      if (myVideo.current.srcObject !== streamRef.current) {
        myVideo.current.srcObject = streamRef.current;
      }
      myVideo.current.play().catch(() => {});
    }
  }, [localStream, callAccepted, callerWating, selectedUser, reciveCall, viewMode]);

  // Synchronize local video stream in group mode
  useEffect(() => {
    if (groupMyVideo.current && streamRef.current) {
      if (groupMyVideo.current.srcObject !== streamRef.current) {
        groupMyVideo.current.srcObject = streamRef.current;
      }
      groupMyVideo.current.play().catch(() => {});
    }
  }, [localStream, isInGroupCall]);

  // Synchronize remote video stream with reciverVideo ref
  useEffect(() => {
    if (reciverVideo.current && remoteStreamRef.current) {
      if (reciverVideo.current.srcObject !== remoteStreamRef.current) {
        reciverVideo.current.srcObject = remoteStreamRef.current;
      }
      reciverVideo.current.play().catch(() => {});
    }
  }, [remoteStream, callAccepted, callerWating, viewMode]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      callContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Request user camera & microphone stream
  const obtainMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setLocalStream(stream);

      stream.getAudioTracks().forEach((t) => (t.enabled = true));
      stream.getVideoTracks().forEach((t) => (t.enabled = true));
      setIsMicOn(true);
      setIsCamOn(true);

      return stream;
    } catch (error) {
      console.error("Camera/Mic access error:", error);
      throw error;
    }
  };

  // Screen Sharing Toggle Handler
  const toggleScreenShare = async () => {
    if (!streamRef.current) return;

    if (isScreenSharing) {
      // STOP SCREEN SHARING - SWITCH BACK TO WEBCAM
      try {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
        }

        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });

        const newVideoTrack = camStream.getVideoTracks()[0];
        const oldVideoTrack = streamRef.current.getVideoTracks()[0];

        if (oldVideoTrack) {
          streamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        streamRef.current.addTrack(newVideoTrack);

        // Replace track on 1-on-1 peer connection
        if (connectionRef.current && oldVideoTrack) {
          try {
            connectionRef.current.replaceTrack(oldVideoTrack, newVideoTrack, streamRef.current);
          } catch (e) {
            console.warn("Peer replaceTrack warning:", e);
          }
        }

        // Replace track on all group peers
        peersRef.current.forEach((p) => {
          if (p.peer && oldVideoTrack) {
            try {
              p.peer.replaceTrack(oldVideoTrack, newVideoTrack, streamRef.current);
            } catch (e) {
              console.warn("Group peer replaceTrack warning:", e);
            }
          }
        });

        setIsCamOn(true);
        setIsScreenSharing(false);

        // Update local video element
        if (myVideo.current) {
          myVideo.current.srcObject = streamRef.current;
        }
        if (groupMyVideo.current) {
          groupMyVideo.current.srcObject = streamRef.current;
        }
      } catch (err) {
        console.error("Failed to revert to camera:", err);
      }
    } else {
      // START SCREEN SHARING
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const oldVideoTrack = streamRef.current.getVideoTracks()[0];

        if (oldVideoTrack) {
          streamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        streamRef.current.addTrack(screenTrack);

        // Replace track on 1-on-1 peer
        if (connectionRef.current && oldVideoTrack) {
          try {
            connectionRef.current.replaceTrack(oldVideoTrack, screenTrack, streamRef.current);
          } catch (e) {
            console.warn("Peer replaceTrack warning:", e);
          }
        }

        // Replace track on all group peers
        peersRef.current.forEach((p) => {
          if (p.peer && oldVideoTrack) {
            try {
              p.peer.replaceTrack(oldVideoTrack, screenTrack, streamRef.current);
            } catch (e) {
              console.warn("Group peer replaceTrack warning:", e);
            }
          }
        });

        setIsCamOn(true);
        setIsScreenSharing(true);

        // Update local video element
        if (myVideo.current) {
          myVideo.current.srcObject = streamRef.current;
        }
        if (groupMyVideo.current) {
          groupMyVideo.current.srcObject = streamRef.current;
        }

        // Handle native browser 'Stop sharing' bar
        screenTrack.onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.warn("Screen share cancelled or not allowed:", err);
      }
    }
  };

  // Socket Events Setup
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      if (socket.id) setMe(socket.id);
      if (user) {
        socket.emit("join", { id: user._id, name: user.username });
      }
    };

    if (socket.id) setMe(socket.id);
    if (user) {
      socket.emit("join", { id: user._id, name: user.username });
    }

    socket.on("connect", onConnect);
    socket.on("me", (id) => setMe(id));

    // Incoming 1-on-1 Call with Purpose Test Msg
    socket.on("callToUser", (data) => {
      setReciveCall(true);
      setCaller(data);
      setCallerName(data.name);
      setCallerSignal(data.signal);
      setIncomingCallPurpose(data.purpose || "Quick check-in & chat");
      currentPeerSocketIdRef.current = data.from;
      playRingtone();
    });

    socket.on("callRejected", (data) => {
      setCallRejectedPopUp(true);
      setCallrejectorData(data);
      stopRingtone();
    });

    socket.on("callEnded", (data) => {
      stopRingtone();
      endCallCleanup();
    });

    socket.on("userUnavailable", (data) => {
      alert(data.message || "User is not available.");
      endCallCleanup();
    });

    socket.on("userBusy", (data) => {
      alert(data.message || "User is currently in another call.");
      endCallCleanup();
    });

    socket.on("online-users", (onlineUsers) => {
      setUserOnline(onlineUsers);
    });

    socket.on("peer-media-toggle", (data) => {
      if (data.type === 'camera') {
        setPeerCamOn(Boolean(data.enabled));
      } else if (data.type === 'mic') {
        setPeerMicOn(Boolean(data.enabled));
      }
    });

    socket.on("receive-reaction", (data) => {
      const id = Date.now() + Math.random();
      setReactions((prev) => [...prev, { id, emoji: data.reaction, name: data.name }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    });

    // GROUP WEBRTC SIGNALING HANDLERS
    // 1. Newly joined user receives existing user list in group room
    socket.on("all-group-users", ({ users: existingUsers, roomName, callType, purpose }) => {
      const newPeers = [];
      existingUsers.forEach((socketId) => {
        if (!streamRef.current) return;
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: streamRef.current,
          config: { iceServers: STUN_SERVERS },
        });

        peer.on("signal", (signal) => {
          socket.emit("sending-group-signal", {
            userToSignal: socketId,
            callerId: socket.id,
            signal,
            user: {
              _id: user?._id,
              username: user?.username,
              fullname: user?.fullname,
              profilepic: user?.profilepic,
            },
          });
        });

        const peerObj = {
          peerId: socketId,
          peer,
          peerInfo: null,
        };
        peersRef.current.push(peerObj);
        newPeers.push(peerObj);
      });
      setGroupPeers(newPeers);
    });

    // 2. Existing user receives connection request from newcomer
    socket.on("user-joined-signal", ({ signal, callerId, user: joinedUserInfo }) => {
      if (!streamRef.current) return;
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: streamRef.current,
        config: { iceServers: STUN_SERVERS },
      });

      peer.on("signal", (sig) => {
        socket.emit("returning-group-signal", {
          signal: sig,
          callerId,
        });
      });

      peer.signal(signal);

      const peerObj = {
        peerId: callerId,
        peer,
        peerInfo: joinedUserInfo,
      };

      peersRef.current.push(peerObj);
      setGroupPeers((prev) => [...prev, peerObj]);
    });

    // 3. Newcomer receives returned signal from existing user
    socket.on("receiving-returned-signal", ({ signal, id }) => {
      const item = peersRef.current.find((p) => p.peerId === id);
      if (item) {
        item.peer.signal(signal);
      }
    });

    // 4. Participant left group room
    socket.on("user-left-group", ({ socketId, name }) => {
      const item = peersRef.current.find((p) => p.peerId === socketId);
      if (item) {
        item.peer.destroy();
      }
      peersRef.current = peersRef.current.filter((p) => p.peerId !== socketId);
      setGroupPeers((prev) => prev.filter((p) => p.peerId !== socketId));
    });

    // 5. Group in-call chat message
    socket.on("receive-group-message", (msg) => {
      setGroupMessages((prev) => [...prev, msg]);
    });

    // 6. Group reaction
    socket.on("receive-group-reaction", (data) => {
      const id = Date.now() + Math.random();
      setReactions((prev) => [...prev, { id, emoji: data.reaction, name: data.name }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("me");
      socket.off("callToUser");
      socket.off("callRejected");
      socket.off("callEnded");
      socket.off("userUnavailable");
      socket.off("userBusy");
      socket.off("online-users");
      socket.off("peer-media-toggle");
      socket.off("receive-reaction");
      socket.off("all-group-users");
      socket.off("user-joined-signal");
      socket.off("receiving-returned-signal");
      socket.off("user-left-group");
      socket.off("receive-group-message");
      socket.off("receive-group-reaction");
    };
  }, [user, socket, endCallCleanup, playRingtone, stopRingtone]);

  // Start outgoing 1-on-1 video call
  const startCall = async () => {
    if (!modalUser) return;

    try {
      const currentStream = await obtainMediaStream();

      setCallRejectedPopUp(false);
      setIsSidebarOpen(false);
      setCallerWating(true);
      setSelectedUser(modalUser._id);
      currentPeerSocketIdRef.current = modalUser._id;

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream,
        config: { iceServers: STUN_SERVERS }
      });

      peer.on("error", (err) => {
        console.error("Caller peer error:", err);
      });

      peer.on("signal", (data) => {
        socket.emit("callToUser", {
          callToUserId: modalUser._id,
          signalData: data,
          from: socket.id || me,
          name: user?.fullname || user?.username || "Caller",
          email: user?.email,
          profilepic: user?.profilepic,
          purpose: callPurpose.trim() || "Catch up & discuss updates",
        });
      });

      peer.on("stream", (remStream) => {
        remoteStreamRef.current = remStream;
        setRemoteStream(remStream);
      });

      socket.once("callAccepted", (data) => {
        setCallRejectedPopUp(false);
        setCallAccepted(true);
        setCallerWating(false);
        currentPeerSocketIdRef.current = data.from;
        setCaller(data.from);
        peer.signal(data.signal);
      });

      connectionRef.current = peer;
      setShowUserDetailModal(false);
    } catch (error) {
      alert("Could not access camera or microphone. Please check browser permissions.");
      setCallerWating(false);
      setSelectedUser(null);
    }
  };

  // Accept incoming 1-on-1 call
  const handelacceptCall = async () => {
    stopRingtone();
    if (!caller) return;

    try {
      const currentStream = await obtainMediaStream();

      setCallAccepted(true);
      setReciveCall(true);
      setCallerWating(false);
      setIsSidebarOpen(false);
      currentPeerSocketIdRef.current = caller.from;

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream,
        config: { iceServers: STUN_SERVERS }
      });

      peer.on("error", (err) => {
        console.error("Callee peer error:", err);
      });

      peer.on("signal", (data) => {
        socket.emit("answeredCall", {
          signal: data,
          from: socket.id || me,
          to: caller.from,
        });
      });

      peer.on("stream", (remStream) => {
        remoteStreamRef.current = remStream;
        setRemoteStream(remStream);
      });

      if (callerSignal) {
        peer.signal(callerSignal);
      }
      connectionRef.current = peer;
    } catch (error) {
      alert("Could not access camera or microphone. Please check permissions.");
      endCallCleanup();
    }
  };

  // Reject incoming call
  const handelrejectCall = () => {
    stopRingtone();
    setCallerWating(false);
    setReciveCall(false);
    setCallAccepted(false);

    if (caller?.from) {
      socket.emit("reject-call", {
        to: caller.from,
        name: user?.username || "User",
        profilepic: user?.profilepic,
      });
    }

    logCallSummary({
      calleeId: user?._id,
      callType: 'direct',
      purpose: incomingCallPurpose || 'Check-in',
      status: 'rejected',
      duration: 0,
    });

    endCallCleanup();
  };

  // End active 1-on-1 call
  const handelendCall = () => {
    stopRingtone();

    const target = currentPeerSocketIdRef.current || (typeof caller === 'object' ? caller?.from : caller) || selectedUser;
    if (target) {
      socket.emit("call-ended", {
        to: target,
        name: user?.username || "User",
      });
    }

    const logDetails = {
      calleeId: modalUser?._id || (typeof caller === 'object' ? caller?.callerUserId : null),
      callType: 'direct',
      purpose: callPurpose || incomingCallPurpose || 'Direct call',
      status: 'completed',
      duration: callDuration,
    };

    endCallCleanup(logDetails);
  };

  // ==================== GROUP CALL WORKFLOWS ====================
  // Create / Join a Group Room (Family or Professional Meeting)
  const joinGroupRoom = async (roomId, roomName, type, purpose) => {
    if (callAccepted || reciveCall || callerWating || isInGroupCall) {
      alert("Please end your existing call before joining a new room.");
      return;
    }

    try {
      const currentStream = await obtainMediaStream();
      setIsSidebarOpen(false);
      setIsInGroupCall(true);
      setCurrentGroupRoom({
        id: roomId,
        name: roomName || (type === 'group-professional' ? "Professional Meeting" : "Family Gathering"),
        type,
        purpose: purpose || "Team Collaboration & Sync",
      });

      socket.emit("join-group-room", {
        roomId,
        roomName: roomName || (type === 'group-professional' ? "Professional Meeting" : "Family Gathering"),
        callType: type,
        purpose: purpose || "Collaboration",
        user: {
          _id: user?._id,
          username: user?.username,
          fullname: user?.fullname,
          profilepic: user?.profilepic,
        },
      });

      setShowGroupModal(false);
      setNewGroupName("");
      setNewGroupPurpose("");
    } catch (err) {
      alert("Camera or Microphone access required for group meetings.");
      setIsInGroupCall(false);
    }
  };

  const handleCreateGroupRoom = () => {
    const roomId = 'room-' + Math.random().toString(36).substring(2, 9);
    const finalName = newGroupName.trim() || (newGroupType === 'group-professional' ? "Board & Strategy Sync" : "Sunday Family Hangout");
    const finalPurpose = newGroupPurpose.trim() || "Discuss project roadmap & weekly goals";
    joinGroupRoom(roomId, finalName, newGroupType, finalPurpose);
  };

  const handleJoinExistingRoom = () => {
    if (!joinRoomIdInput.trim()) {
      alert("Please enter a valid Room Code");
      return;
    }
    const cleanId = joinRoomIdInput.trim().toLowerCase();
    joinGroupRoom(cleanId, `Room ${cleanId}`, 'group-professional', "Scheduled Meeting");
    setJoinRoomIdInput('');
  };

  // Leave Group Room
  const leaveGroupRoom = () => {
    if (currentGroupRoom) {
      socket.emit("leave-group-room", {
        roomId: currentGroupRoom.id,
        userId: user?._id,
        name: user?.fullname || user?.username,
      });

      logCallSummary({
        callType: currentGroupRoom.type,
        roomName: currentGroupRoom.name,
        purpose: currentGroupRoom.purpose,
        status: 'completed',
        duration: callDuration,
      });
    }

    endCallCleanup();
  };

  // Send In-Room Chat / Test Message
  const sendGroupChatMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !currentGroupRoom) return;

    const msgPayload = {
      roomId: currentGroupRoom.id,
      senderId: user?._id,
      senderName: user?.fullname || user?.username || "You",
      senderAvatar: getUserAvatar(user),
      text: chatInput.trim(),
    };

    socket.emit("send-group-message", msgPayload);
    setChatInput('');
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = !audioTrack.enabled;
        audioTrack.enabled = nextState;
        setIsMicOn(nextState);

        const target = currentPeerSocketIdRef.current || (typeof caller === 'object' ? caller?.from : caller);
        if (target) {
          socket.emit("toggle-media", {
            to: target,
            type: "mic",
            enabled: nextState,
          });
        }
      }
    }
  };

  // Toggle Camera
  const toggleCam = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !videoTrack.enabled;
        videoTrack.enabled = nextState;
        setIsCamOn(nextState);

        const target = currentPeerSocketIdRef.current || (typeof caller === 'object' ? caller?.from : caller);
        if (target) {
          socket.emit("toggle-media", {
            to: target,
            type: "camera",
            enabled: nextState,
          });
        }
      }
    }
  };

  // Send Reaction
  const sendReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [...prev, { id, emoji, name: "You" }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);

    if (isInGroupCall && currentGroupRoom) {
      socket.emit("send-group-reaction", {
        roomId: currentGroupRoom.id,
        reaction: emoji,
        name: user?.fullname || user?.username || "Participant",
      });
    } else {
      const target = currentPeerSocketIdRef.current || (typeof caller === 'object' ? caller?.from : caller);
      if (target) {
        socket.emit("send-reaction", {
          to: target,
          reaction: emoji,
          name: user?.fullname || user?.username || "Friend",
        });
      }
    }
    setShowEmojiPicker(false);
  };

  const allusers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/user');
      if (response.data.success !== false && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    allusers();
  }, []);

  const isOnlineUser = (userId) => userOnline.some((u) => u.userId === userId);

  const handelSelectedUser = (userId) => {
    if (callAccepted || reciveCall || callerWating || isInGroupCall) {
      alert("You must end the current call before starting a new one.");
      return;
    }
    const selected = users.find((u) => u._id === userId);
    setModalUser(selected);
    setShowUserDetailModal(true);
  };

  const filteredUsers = users.filter((u) =>
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.fullname && u.fullname.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getUserAvatar = (u) => {
    if (u?.profilepic && !u.profilepic.includes("avatar.iran.liara.run")) {
      return u.profilepic;
    }
    const name = u?.fullname || u?.username || u?.name || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4a6bff&color=ffffff&bold=true`;
  };

  const handleLogout = async () => {
    if (callAccepted || reciveCall || callerWating || isInGroupCall) {
      alert("You must end the call before logging out.");
      return;
    }
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error("Logout request error:", error);
    } finally {
      if (socket) {
        socket.off("disconnect");
        socket.disconnect();
      }
      socketInstance.setSocket();
      updateUser(null);
      navigate('/login');
    }
  };

  // Modern Cyber Theme Styles
  const cyberStyles = {
    mainContainer: {
      background: `linear-gradient(135deg, ${cyberColors.deepMidnight} 0%, #10163a 50%, #1a1f4a 100%)`,
      minHeight: '100vh',
      color: cyberColors.cyberWhite,
    },
    sidebar: {
      background: `linear-gradient(180deg, rgba(16, 22, 58, 0.95) 0%, rgba(10, 15, 46, 0.98) 100%)`,
      backdropFilter: 'blur(16px)',
      borderRight: `1px solid ${cyberColors.glassBorder}`,
      color: cyberColors.cyberWhite,
    },
    userCard: {
      background: 'rgba(74, 107, 255, 0.08)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(138, 158, 255, 0.18)',
      borderRadius: '14px',
      transition: 'all 0.25s ease',
    },
    selectedUserCard: {
      background: `linear-gradient(90deg, ${cyberColors.electricBlue}, ${cyberColors.neonCyan})`,
      color: cyberColors.deepMidnight,
      boxShadow: '0 4px 20px rgba(0, 245, 212, 0.3)',
    },
    buttonPrimary: {
      background: `linear-gradient(90deg, ${cyberColors.electricBlue}, ${cyberColors.neonCyan})`,
      color: cyberColors.deepMidnight,
      fontWeight: 'bold',
      boxShadow: '0 4px 15px rgba(74, 107, 255, 0.4)',
    },
    buttonSecondary: {
      background: 'rgba(255, 255, 255, 0.08)',
      color: cyberColors.cyberWhite,
      border: `1px solid rgba(138, 158, 255, 0.3)`,
    },
    modal: {
      background: cyberColors.deepMidnight,
      border: `1px solid ${cyberColors.neonCyan}`,
      borderRadius: '20px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 245, 212, 0.2)',
    },
    welcomeCard: {
      background: 'rgba(74, 107, 255, 0.08)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(138, 158, 255, 0.2)',
      borderRadius: '20px',
    },
    gradientText: {
      background: `linear-gradient(90deg, ${cyberColors.neonCyan}, ${cyberColors.electricBlue})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
  };

  const peerDisplayName = callerName || modalUser?.fullname || modalUser?.username || "Friend";
  const peerAvatarData = typeof caller === 'object' ? caller : modalUser;

  return (
    <div style={cyberStyles.mainContainer} className="flex min-h-screen relative overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={cyberStyles.sidebar}
        className={`w-80 h-full p-4 space-y-3 fixed z-40 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-2xl font-black tracking-wider" style={cyberStyles.gradientText}>
              VibeTalk
            </h1>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              PRO
            </span>
          </div>
          <button
            type="button"
            className="md:hidden text-white/70 hover:text-white transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Navigation Tabs (Contacts, Group Calls, Call History) */}
        <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-indigo-200 hover:text-white'
            }`}
          >
            <FaUserFriends size={12} />
            <span>Friends</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-indigo-200 hover:text-white'
            }`}
          >
            <FaUsers size={12} />
            <span>Rooms</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-indigo-200 hover:text-white'
            }`}
          >
            <FaHistory size={11} />
            <span>History</span>
          </button>
        </div>

        {/* TAB 1: USER DIRECTORY & 1-ON-1 CALLS */}
        {activeTab === 'directory' && (
          <>
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search friends & teammates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(138, 158, 255, 0.25)',
                  color: cyberColors.cyberWhite,
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-cyan-400 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <div className="text-[11px] uppercase tracking-wider text-cyan-400/80 font-bold px-1 mb-1">
                Contacts ({filteredUsers.length})
              </div>
              {loading && (
                <div className="text-center text-xs text-cyan-300/60 py-6">Loading directory...</div>
              )}
              {!loading && filteredUsers.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-6">No users found</div>
              )}
              {filteredUsers.map((item) => {
                const online = isOnlineUser(item._id);
                const isSelected = selectedUser === item._id;

                return (
                  <div
                    key={item._id}
                    style={{
                      ...cyberStyles.userCard,
                      ...(isSelected ? cyberStyles.selectedUserCard : {}),
                      cursor: 'pointer',
                    }}
                    className="p-2.5 rounded-xl transition-all duration-200 hover:border-cyan-400/50 hover:shadow-lg group flex items-center justify-between"
                    onClick={() => handelSelectedUser(item._id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={getUserAvatar(item)}
                          alt={`${item.username}'s profile`}
                          className="w-9 h-9 rounded-full border border-indigo-400/40 object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/default-avatar.svg";
                          }}
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-midnight ${
                            online ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs truncate">
                          {item.fullname || item.username}
                        </span>
                        <span className="text-[10px] opacity-60 truncate">
                          {online ? "🟢 Active now" : "Offline"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      title="Initiate VibeTalk Video Call"
                      className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 opacity-80 group-hover:opacity-100 hover:bg-cyan-500/40 transition-all flex-shrink-0"
                    >
                      <FaVideo size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: GROUP VIDEO ROOMS (Family & Professional Meetings) */}
        {activeTab === 'groups' && (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => setShowGroupModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <FaPlus size={11} /> Create Meeting / Family Room
            </button>

            {/* Quick Room Code Join */}
            <div className="p-3 rounded-xl bg-white/5 border border-indigo-400/20 space-y-2">
              <label className="text-[11px] font-bold text-cyan-300 block">
                Enter Room Code to Join
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. room-fam123"
                  value={joinRoomIdInput}
                  onChange={(e) => setJoinRoomIdInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-indigo-400/30 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleJoinExistingRoom}
                  className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs hover:bg-cyan-300 cursor-pointer"
                >
                  Join
                </button>
              </div>
            </div>

            {/* Quick Demo Pre-configured Rooms */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                Instant Vibe Spaces
              </div>

              {/* Family Room Card */}
              <div
                onClick={() => joinGroupRoom('vibetalk-family-lounge', 'Family Living Room', 'group-family', 'Weekend family catchup & bonding')}
                className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 hover:border-pink-400 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400"><FaHeart size={12} /></span>
                    <span className="font-bold text-xs text-white">Family Living Room</span>
                  </div>
                  <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">Family</span>
                </div>
                <p className="text-[11px] text-pink-200/80 mb-2">Purpose: Weekend family catchup & casual bonding</p>
                <div className="text-[10px] text-pink-300 font-semibold group-hover:underline flex items-center gap-1">
                  <FaVideo size={10} /> Click to Enter Room &rarr;
                </div>
              </div>

              {/* Professional Meeting Room Card */}
              <div
                onClick={() => joinGroupRoom('vibetalk-work-standup', 'Executive Sprint & Standup', 'group-professional', 'Sprint review and project milestone blockers')}
                className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400"><FaBriefcase size={12} /></span>
                    <span className="font-bold text-xs text-white">Executive Sprint & Standup</span>
                  </div>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">Pro Meet</span>
                </div>
                <p className="text-[11px] text-cyan-200/80 mb-2">Purpose: Sprint review & milestone planning</p>
                <div className="text-[10px] text-cyan-300 font-semibold group-hover:underline flex items-center gap-1">
                  <FaVideo size={10} /> Click to Enter Room &rarr;
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CALL HISTORY */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-cyan-400/80 font-bold px-1 mb-1">
              <span>Recent Calls</span>
              <button
                type="button"
                onClick={fetchCallHistory}
                className="text-[10px] text-indigo-300 hover:text-cyan-300 cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {loadingHistory && (
              <div className="text-center text-xs text-cyan-300/60 py-6">Loading call history...</div>
            )}

            {!loadingHistory && callHistory.length === 0 && (
              <div className="text-center text-xs text-gray-400 py-6">
                No past calls recorded yet. Make a call to view history!
              </div>
            )}

            {callHistory.map((log) => {
              const isCaller = log.caller?._id === user?._id;
              const otherPerson = isCaller ? log.callee : log.caller;
              const displayName = log.roomName || otherPerson?.fullname || otherPerson?.username || "VibeTalk User";
              const dateStr = new Date(log.startedAt || log.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log._id}
                  className="p-3 rounded-xl bg-white/5 border border-indigo-400/15 hover:border-cyan-400/40 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg ${
                        log.callType.includes('professional')
                          ? 'bg-blue-500/20 text-blue-400'
                          : log.callType.includes('family')
                          ? 'bg-pink-500/20 text-pink-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {log.callType.includes('professional') ? <FaBriefcase size={11} /> : log.callType.includes('family') ? <FaHeart size={11} /> : <FaVideo size={11} />}
                      </div>
                      <span className="font-bold text-xs text-white truncate max-w-[140px]">
                        {displayName}
                      </span>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      log.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : log.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {log.status}
                    </span>
                  </div>

                  {/* 1-Line Test Msg / Purpose of Call */}
                  {log.purpose && (
                    <div className="text-[11px] text-cyan-200/90 italic bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/30 truncate">
                      Purpose: "{log.purpose}"
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <FaClock size={9} /> {dateStr}
                    </span>
                    <span className="font-mono text-cyan-300">
                      {formatDuration(log.duration || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Current User & Logout Footer */}
        {user && (
          <div className="pt-3 border-t border-indigo-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={getUserAvatar(user)}
                alt="My profile"
                className="w-9 h-9 rounded-full border border-cyan-400/50 object-cover"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs truncate text-cyan-200">{user.fullname || user.username}</span>
                <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <RiLogoutBoxLine size={18} />
            </button>
          </div>
        )}
      </aside>

      {/* Main View Area */}
      <main className="flex-1 min-h-screen md:ml-80 flex flex-col relative overflow-hidden">
        {/* ============================================================== */}
        {/* CASE A: GROUP VIDEO CALL ROOM (Family or Professional Meeting) */}
        {/* ============================================================== */}
        {isInGroupCall && currentGroupRoom ? (
          <div
            ref={callContainerRef}
            className="relative w-full h-screen bg-slate-950 flex flex-col justify-between overflow-hidden select-none"
          >
            {/* Top Bar Header */}
            <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="md:hidden text-xl text-white/80 hover:text-white"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <FaBars />
                </button>
                <div className="flex items-center gap-2.5 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-cyan-300">
                    {formatDuration(callDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-400/20 text-xs text-indigo-200">
                  <span className="p-1 rounded bg-cyan-500/20 text-cyan-300">
                    {currentGroupRoom.type === 'group-professional' ? <FaBriefcase size={11} /> : <FaHeart size={11} />}
                  </span>
                  <span className="font-bold text-white">{currentGroupRoom.name}</span>
                  <span className="text-gray-400">({groupPeers.length + 1} in room)</span>
                </div>
                {/* 1-Line Purpose Pill */}
                <div className="hidden lg:flex items-center gap-1.5 bg-cyan-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/30 text-xs text-cyan-200">
                  <FaInfoCircle size={11} className="text-cyan-400 flex-shrink-0" />
                  <span className="truncate max-w-sm font-medium">Purpose: {currentGroupRoom.purpose}</span>
                </div>
              </div>

              {/* Right Controls: Room Code, Chat Toggle & Fullscreen */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentGroupRoom.id);
                    setCopiedRoomCode(true);
                    setTimeout(() => setCopiedRoomCode(false), 2000);
                  }}
                  className="hidden sm:flex items-center gap-1.5 bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-cyan-300 cursor-pointer transition-all"
                  title="Click to copy Room Code"
                >
                  <FaRegCopy size={11} />
                  <span>{copiedRoomCode ? "Copied!" : `Room: ${currentGroupRoom.id}`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowChatPanel(!showChatPanel)}
                  className={`p-2 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
                    showChatPanel
                      ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                      : 'bg-black/40 border-indigo-400/30 text-cyan-300 hover:border-cyan-400'
                  }`}
                  title="Toggle In-Call Chat & Test Messages"
                >
                  <FaPaperPlane size={13} />
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-indigo-400/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
                </button>
              </div>
            </div>

            {/* Reaction Particles Float Layer */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {reactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-5xl opacity-90 drop-shadow-[0_0_15px_rgba(0,245,212,0.8)]"
                  style={{
                    animation: 'floatUp 2.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                  }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* Group Video Grid + Chat Drawer */}
            <div className="flex-1 w-full h-full flex pt-16 pb-24 px-4 gap-4 overflow-hidden">
              {/* Dynamic Video Grid */}
              <div className="flex-1 h-full overflow-y-auto">
                <div className={`w-full h-full grid gap-4 items-center justify-center ${
                  groupPeers.length === 0
                    ? 'grid-cols-1 max-w-2xl mx-auto'
                    : groupPeers.length === 1
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : groupPeers.length <= 3
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
                    : 'grid-cols-2 lg:grid-cols-3'
                }`}>
                  {/* Local Self Video Feed */}
                  <div className="relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-cyan-500/40 shadow-lg flex items-center justify-center">
                    <video
                      ref={groupMyVideo}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
                        isCamOn ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {!isCamOn && (
                      <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                        <img
                          src={getUserAvatar(user)}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full border-2 border-cyan-400 mb-2 object-cover"
                        />
                        <span className="text-xs text-cyan-300 font-bold">{user?.fullname || user?.username} (You)</span>
                        <span className="text-[10px] text-gray-400">Camera Off</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-xs">
                      <span className="font-bold text-cyan-300">{isScreenSharing ? "Your Screen" : "You (Self)"}</span>
                      {!isMicOn && (
                        <span className="flex items-center gap-1 text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded text-[10px]">
                          <FaMicrophoneSlash size={9} /> Muted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remote Group Peers */}
                  {groupPeers.map((item) => (
                    <GroupPeerVideo
                      key={item.peerId}
                      peer={item.peer}
                      peerInfo={item.peerInfo}
                    />
                  ))}
                </div>
              </div>

              {/* In-Call Real-time Chat & Test Messages Drawer */}
              {showChatPanel && (
                <div className="w-80 h-full rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-indigo-400/30 flex flex-col p-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-400/20">
                    <div className="flex items-center gap-2">
                      <FaPaperPlane className="text-cyan-400" size={13} />
                      <h3 className="font-bold text-xs text-white">Meeting In-Call Chat</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowChatPanel(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <FaTimes size={13} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1 text-xs custom-scrollbar">
                    {groupMessages.length === 0 && (
                      <div className="text-center text-gray-400 py-10 text-[11px]">
                        Send test notes, meeting agendas, or questions during the call!
                      </div>
                    )}
                    {groupMessages.map((msg, i) => {
                      const isMe = msg.senderId === user?._id;
                      return (
                        <div
                          key={i}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-gray-400 mb-0.5">
                            {isMe ? 'You' : msg.senderName}
                          </span>
                          <div
                            className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                              isMe
                                ? 'bg-cyan-500 text-slate-950 font-medium'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={sendGroupChatMessage} className="flex gap-2 pt-2 border-t border-indigo-400/20">
                    <input
                      type="text"
                      placeholder="Type 1-line note or message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-black/50 border border-indigo-400/30 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 cursor-pointer"
                    >
                      <FaPaperPlane size={12} />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Bottom Group Call Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center gap-4">
              {showEmojiPicker && (
                <div className="absolute bottom-20 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 p-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-fadeIn z-40">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => sendReaction(emoji)}
                      className="text-2xl p-2 rounded-xl hover:bg-white/10 hover:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Leave Meeting Button */}
              <button
                type="button"
                onClick={leaveGroupRoom}
                style={{ background: cyberColors.emergencyRed }}
                className="p-4 rounded-full text-white shadow-[0_0_20px_rgba(255,58,58,0.5)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Leave Meeting"
              >
                <FaPhoneSlash size={22} />
              </button>

              {/* Mic Toggle */}
              <button
                type="button"
                onClick={toggleMic}
                style={{
                  background: isMicOn ? 'rgba(0, 245, 212, 0.2)' : cyberColors.emergencyRed,
                  borderColor: isMicOn ? cyberColors.neonCyan : cyberColors.emergencyRed,
                  color: isMicOn ? cyberColors.neonCyan : '#ffffff',
                }}
                className="p-4 rounded-full border-2 backdrop-blur-md shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicOn ? <FaMicrophone size={22} /> : <FaMicrophoneSlash size={22} />}
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={toggleCam}
                style={{
                  background: isCamOn ? 'rgba(0, 245, 212, 0.2)' : cyberColors.emergencyRed,
                  borderColor: isCamOn ? cyberColors.neonCyan : cyberColors.emergencyRed,
                  color: isCamOn ? cyberColors.neonCyan : '#ffffff',
                }}
                className="p-4 rounded-full border-2 backdrop-blur-md shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {isCamOn ? <FaVideo size={22} /> : <FaVideoSlash size={22} />}
              </button>

              {/* Screen Share Toggle */}
              <button
                type="button"
                onClick={toggleScreenShare}
                style={{
                  background: isScreenSharing ? cyberColors.neonCyan : 'rgba(74, 107, 255, 0.2)',
                  borderColor: isScreenSharing ? cyberColors.neonCyan : 'rgba(138, 158, 255, 0.4)',
                  color: isScreenSharing ? '#0a0f2e' : cyberColors.neonCyan,
                }}
                className="p-4 rounded-full border-2 backdrop-blur-md shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
              >
                <FaDesktop size={22} />
              </button>

              {/* Emoji Reaction */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-4 rounded-full border-2 backdrop-blur-md shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                  showEmojiPicker
                    ? "bg-cyan-400 text-slate-950 border-cyan-400"
                    : "bg-indigo-950/40 text-cyan-300 border-indigo-400/40 hover:border-cyan-400"
                }`}
                title="Send Reaction"
              >
                <FaSmile size={22} />
              </button>
            </div>
          </div>
        ) : selectedUser || reciveCall || callAccepted ? (
          /* ============================================================== */
          /* CASE B: 1-ON-1 ACTIVE CALL OR WAITING UI                        */
          /* ============================================================== */
          <div
            ref={callContainerRef}
            className="relative w-full h-screen bg-slate-950 flex flex-col justify-between overflow-hidden select-none"
          >
            {/* Top Bar Overlay */}
            <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="md:hidden text-xl text-white/80 hover:text-white"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <FaBars />
                </button>
                <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-cyan-300">
                    {callAccepted ? formatDuration(callDuration) : "CALLING..."}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-indigo-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-400/20 text-xs text-indigo-200">
                  <span>Chatting with:</span>
                  <span className="font-bold text-white">{peerDisplayName}</span>
                </div>
                {/* 1-Line Test Msg / Purpose Badge */}
                {(callPurpose || incomingCallPurpose) && (
                  <div className="hidden md:flex items-center gap-1.5 bg-cyan-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/30 text-xs text-cyan-200">
                    <FaInfoCircle size={11} className="text-cyan-400 flex-shrink-0" />
                    <span className="truncate max-w-xs">Purpose: "{incomingCallPurpose || callPurpose}"</span>
                  </div>
                )}
              </div>

              {/* View Mode & Fullscreen Controls */}
              <div className="flex items-center gap-2">
                {callAccepted && (
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'split' ? 'pip' : 'split')}
                    className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-400/30 text-xs font-semibold hover:border-cyan-400 transition-all text-cyan-300 cursor-pointer"
                    title={viewMode === 'split' ? "Switch to Spotlight + PIP" : "Switch to Side-by-Side Face to Face"}
                  >
                    <FaColumns size={12} />
                    <span className="hidden sm:inline">
                      {viewMode === 'split' ? "Side-by-Side (Active)" : "Spotlight (Active)"}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-indigo-400/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
                </button>
              </div>
            </div>

            {/* Reaction Particles Float Layer */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {reactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-5xl opacity-90 drop-shadow-[0_0_15px_rgba(0,245,212,0.8)]"
                  style={{
                    animation: 'floatUp 2.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                  }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* Calling / Waiting State */}
            {callerWating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="relative mb-6">
                  <div className="w-36 h-36 rounded-full border-4 border-cyan-400/80 animate-ping absolute inset-0" />
                  <img
                    src={getUserAvatar(modalUser)}
                    alt="Calling User"
                    className="w-36 h-36 rounded-full border-4 border-cyan-400 object-cover shadow-[0_0_30px_rgba(0,245,212,0.5)] relative z-10"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/default-avatar.svg";
                    }}
                  />
                  <div className="absolute bottom-1 right-1 z-20 bg-rose-500 text-white p-2 rounded-full border-2 border-slate-900 animate-pulse">
                    <FaPhoneAlt size={16} />
                  </div>
                </div>

                <h2 className="text-3xl font-extrabold tracking-wide mb-2 text-white">
                  Calling {modalUser?.fullname || modalUser?.username}...
                </h2>
                <p className="text-cyan-300/80 text-sm max-w-sm mb-2">
                  Waiting for {modalUser?.fullname || modalUser?.username} to accept your video call.
                </p>

                {/* Pre-call Purpose display */}
                {callPurpose && (
                  <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-xs text-cyan-200">
                    <FaInfoCircle size={11} className="text-cyan-400" />
                    <span>Purpose: "{callPurpose}"</span>
                  </div>
                )}

                {/* Self preview while waiting */}
                <div className="mt-2 flex flex-col items-center">
                  <div className="w-48 h-32 rounded-xl overflow-hidden border border-cyan-500/40 relative shadow-lg bg-black/60">
                    <video
                      ref={myVideo}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    {!isCamOn && (
                      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center">
                        <FaVideoSlash className="text-rose-400 text-xl mb-1" />
                        <span className="text-[10px] text-gray-400">Camera Off</span>
                      </div>
                    )}
                    <span className="absolute bottom-1 left-2 text-[10px] font-bold text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE VIDEO CALL VIEW */
              <div className="flex-1 w-full h-full flex flex-col relative z-10 pt-16 pb-24 px-4">
                {/* 1. SIDE-BY-SIDE FACE-TO-FACE VIEW MODE */}
                {viewMode === 'split' ? (
                  <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
                    {/* Remote Face Tile */}
                    <div className="relative w-full h-full max-h-[75vh] md:max-h-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500/30 shadow-[0_0_25px_rgba(74,107,255,0.2)] flex items-center justify-center group">
                      <video
                        ref={reciverVideo}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          peerCamOn ? "opacity-100" : "opacity-0"
                        }`}
                      />

                      {!peerCamOn && (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center">
                          <div className="relative mb-3">
                            <img
                              src={getUserAvatar(peerAvatarData)}
                              alt="Peer Avatar"
                              className="w-28 h-28 rounded-full border-4 border-indigo-500/50 object-cover shadow-2xl"
                            />
                            <div className="absolute bottom-0 right-0 p-2 rounded-full bg-rose-500 text-white shadow-lg">
                              <FaVideoSlash size={14} />
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-white">{peerDisplayName}</h3>
                          <span className="text-xs text-rose-300 mt-1 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30">
                            Camera is turned off
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                        <span className="font-bold text-white">{peerDisplayName}</span>
                        {!peerMicOn && (
                          <span className="flex items-center gap-1 text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded text-[10px]">
                            <FaMicrophoneSlash size={10} /> Muted
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Local Self Face Tile */}
                    <div className="relative w-full h-full max-h-[75vh] md:max-h-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-cyan-500/30 shadow-[0_0_25px_rgba(0,245,212,0.2)] flex items-center justify-center group">
                      <video
                        ref={myVideo}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
                          isCamOn ? "opacity-100" : "opacity-0"
                        }`}
                      />

                      {!isCamOn && (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex flex-col items-center justify-center p-6 text-center">
                          <div className="relative mb-3">
                            <img
                              src={getUserAvatar(user)}
                              alt="Your Avatar"
                              className="w-28 h-28 rounded-full border-4 border-cyan-400/50 object-cover shadow-2xl"
                            />
                            <div className="absolute bottom-0 right-0 p-2 rounded-full bg-rose-500 text-white shadow-lg">
                              <FaVideoSlash size={14} />
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-white">{user?.fullname || user?.username || "You"}</h3>
                          <span className="text-xs text-cyan-300 mt-1 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
                            Your camera is turned off
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                        <span className="font-bold text-cyan-300">{isScreenSharing ? "Your Screen" : "You (Self)"}</span>
                        {!isMicOn && (
                          <span className="flex items-center gap-1 text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded text-[10px]">
                            <FaMicrophoneSlash size={10} /> Muted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. SPOTLIGHT + PIP VIEW MODE */
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-indigo-500/20 shadow-2xl flex items-center justify-center">
                    <video
                      ref={reciverVideo}
                      autoPlay
                      playsInline
                      className={`w-full h-full object-contain transition-opacity duration-300 ${
                        peerCamOn ? "opacity-100" : "opacity-0"
                      }`}
                    />

                    {!peerCamOn && (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 to-indigo-950 flex flex-col items-center justify-center p-6 text-center">
                        <img
                          src={getUserAvatar(peerAvatarData)}
                          alt="Peer Avatar"
                          className="w-32 h-32 rounded-full border-4 border-indigo-500/60 object-cover mb-3"
                        />
                        <h3 className="text-xl font-bold text-white">{peerDisplayName}</h3>
                        <span className="text-sm text-rose-300 mt-1 bg-rose-500/20 px-4 py-1 rounded-full border border-rose-500/30">
                          Camera is turned off
                        </span>
                      </div>
                    )}

                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                      <span className="font-bold text-white">{peerDisplayName}</span>
                      {!peerMicOn && (
                        <span className="flex items-center gap-1 text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded text-[10px]">
                          <FaMicrophoneSlash size={10} /> Muted
                        </span>
                      )}
                    </div>

                    <div
                      className={`absolute z-20 w-36 h-48 sm:w-52 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-400/80 bg-slate-950 cursor-pointer transition-all ${
                        pipPosition === 'bottom-right' ? "bottom-4 right-4" : "top-4 right-4"
                      }`}
                      onClick={() => setPipPosition(pipPosition === 'bottom-right' ? 'top-right' : 'bottom-right')}
                      title="Click to move Picture-in-Picture position"
                    >
                      <video
                        ref={myVideo}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform scale-x-[-1] ${
                          isCamOn ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      {!isCamOn && (
                        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-2 text-center">
                          <FaVideoSlash className="text-rose-400 text-2xl mb-1" />
                          <span className="text-xs text-gray-300">Camera Off</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold text-cyan-300">
                        You
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Cyber Call Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center gap-4">
              {showEmojiPicker && (
                <div className="absolute bottom-20 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 p-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-fadeIn z-40">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => sendReaction(emoji)}
                      className="text-2xl p-2 rounded-xl hover:bg-white/10 hover:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* End Call Button */}
              <button
                type="button"
                onClick={handelendCall}
                style={{ background: cyberColors.emergencyRed }}
                className="p-4 rounded-full text-white shadow-[0_0_20px_rgba(255,58,58,0.5)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="End Video Call"
              >
                <FaPhoneSlash size={22} />
              </button>

              {/* Mic Toggle */}
              <button
                type="button"
                onClick={toggleMic}
                style={{
                  background: isMicOn ? 'rgba(0, 245, 212, 0.2)' : cyberColors.emergencyRed,
                  borderColor: isMicOn ? cyberColors.neonCyan : cyberColors.emergencyRed,
                  color: isMicOn ? cyberColors.neonCyan : '#ffffff',
                }}
                className="p-4 rounded-full border-2 backdrop-blur-md shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicOn ? <FaMicrophone size={22} /> : <FaMicrophoneSlash size={22} />}
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={toggleCam}
                style={{
                  background: isCamOn ? 'rgba(0, 245, 212, 0.2)' : cyberColors.emergencyRed,
                  borderColor: isCamOn ? cyberColors.neonCyan : cyberColors.emergencyRed,
                  color: isCamOn ? cyberColors.neonCyan : '#ffffff',
                }}
                className="p-4 rounded-full border-2 backdrop-blur-md shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {isCamOn ? <FaVideo size={22} /> : <FaVideoSlash size={22} />}
              </button>

              {/* Screen Share Toggle */}
              {callAccepted && (
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  style={{
                    background: isScreenSharing ? cyberColors.neonCyan : 'rgba(74, 107, 255, 0.2)',
                    borderColor: isScreenSharing ? cyberColors.neonCyan : 'rgba(138, 158, 255, 0.4)',
                    color: isScreenSharing ? '#0a0f2e' : cyberColors.neonCyan,
                  }}
                  className="p-4 rounded-full border-2 backdrop-blur-md shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                >
                  <FaDesktop size={22} />
                </button>
              )}

              {/* Emoji Reaction Trigger */}
              {callAccepted && (
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-4 rounded-full border-2 backdrop-blur-md shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                    showEmojiPicker
                      ? "bg-cyan-400 text-slate-950 border-cyan-400"
                      : "bg-indigo-950/40 text-cyan-300 border-indigo-400/40 hover:border-cyan-400"
                  }`}
                  title="Send Face-to-Face Reaction"
                >
                  <FaSmile size={22} />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* CASE C: WELCOME / DASHBOARD HOME                               */
          /* ============================================================== */
          <div className="flex-1 p-6 md:p-10 flex flex-col justify-center max-w-5xl mx-auto w-full">
            {/* Mobile Header Bar */}
            <div className="md:hidden flex items-center justify-between mb-6">
              <button
                type="button"
                className="text-2xl text-cyan-300"
                onClick={() => setIsSidebarOpen(true)}
              >
                <FaBars />
              </button>
              <h1 className="text-xl font-bold" style={cyberStyles.gradientText}>VibeTalk</h1>
              <div className="w-8" />
            </div>

            {/* Welcome Banner Card */}
            <div style={cyberStyles.welcomeCard} className="p-8 rounded-3xl mb-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                <div className="w-28 h-28 flex-shrink-0">
                  <Lottie animationData={wavingAnimation} loop autoplay />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold mb-3 border border-cyan-500/40">
                    ✨ NEXT-GEN VIBETALK VIDEO PLATFORM
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black mb-3" style={cyberStyles.gradientText}>
                    Welcome to VibeTalk, {user?.fullname || user?.username || "Friend"}!
                  </h1>
                  <p className="text-base sm:text-lg text-indigo-100/90 leading-relaxed">
                    Host high-definition <strong>Group Video Calls</strong> for family hangouts or professional executive meetings. Set pre-call purpose notes and track all your call history seamlessly!
                  </p>
                </div>
              </div>
            </div>

            {/* Action Cards (Direct Call, Family Room, Professional Meeting) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {/* Card 1: 1-on-1 Direct Call */}
              <div
                style={cyberStyles.welcomeCard}
                className="p-6 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 hover:shadow-cyan-500/20 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                onClick={() => setActiveTab('directory')}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                    <FaVideo />
                  </div>
                  <h3 className="font-bold text-xl text-white mb-2">1-on-1 Video Call</h3>
                  <p className="text-xs text-indigo-200/80 leading-relaxed mb-4">
                    Instantly call any friend or colleague with split face-to-face mode and custom 1-line call purpose notes.
                  </p>
                </div>
                <div className="text-xs text-cyan-300 font-bold flex items-center gap-1 group-hover:underline">
                  Browse Contacts &rarr;
                </div>
              </div>

              {/* Card 2: Family Video Call */}
              <div
                style={cyberStyles.welcomeCard}
                className="p-6 rounded-2xl border border-pink-500/30 hover:border-pink-400 hover:shadow-pink-500/20 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                onClick={() => {
                  setNewGroupType('group-family');
                  setNewGroupName('Family Living Room');
                  setNewGroupPurpose('Family weekend catchup & sharing moments');
                  setShowGroupModal(true);
                }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                    <FaHeart />
                  </div>
                  <h3 className="font-bold text-xl text-white mb-2">Family Group Call</h3>
                  <p className="text-xs text-indigo-200/80 leading-relaxed mb-4">
                    Bring all your family members into a warm multi-peer video lounge with live reactions and in-call messaging.
                  </p>
                </div>
                <div className="text-xs text-pink-300 font-bold flex items-center gap-1 group-hover:underline">
                  Start Family Room &rarr;
                </div>
              </div>

              {/* Card 3: Professional Meeting */}
              <div
                style={cyberStyles.welcomeCard}
                className="p-6 rounded-2xl border border-indigo-500/30 hover:border-indigo-400 hover:shadow-indigo-500/20 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                onClick={() => {
                  setNewGroupType('group-professional');
                  setNewGroupName('Strategy & Sprint Meeting');
                  setNewGroupPurpose('Roadmap review, milestones & blockers');
                  setShowGroupModal(true);
                }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                    <FaBriefcase />
                  </div>
                  <h3 className="font-bold text-xl text-white mb-2">Professional Meeting</h3>
                  <p className="text-xs text-indigo-200/80 leading-relaxed mb-4">
                    Host team standups and client presentations with clear agendas, purpose tags, and persistent call duration logs.
                  </p>
                </div>
                <div className="text-xs text-indigo-300 font-bold flex items-center gap-1 group-hover:underline">
                  Host Pro Meeting &rarr;
                </div>
              </div>
            </div>

            {/* Feature Highlights Banner */}
            <div style={cyberStyles.welcomeCard} className="p-6 rounded-2xl text-xs border border-indigo-400/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <FaHistory size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Full Call History & Purpose Tracking</h4>
                  <p className="text-indigo-200/80">Every direct and group call duration and pre-call test note is securely archived.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 font-bold border border-cyan-400/40 cursor-pointer flex-shrink-0"
              >
                View History
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL 1: 1-on-1 Call Confirmation + Purpose / 1-Line Test Msg  */}
      {/* ============================================================== */}
      {showUserDetailModal && modalUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div style={cyberStyles.modal} className="max-w-md w-full p-6 text-center animate-fadeIn">
            <p className="text-xl font-black mb-4" style={cyberStyles.gradientText}>Start VibeTalk Call</p>
            <img
              src={getUserAvatar(modalUser)}
              alt="User"
              className="w-20 h-20 rounded-full border-4 border-cyan-400 mx-auto mb-2 object-cover shadow-[0_0_20px_rgba(0,245,212,0.4)]"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/default-avatar.svg";
              }}
            />
            <h3 className="text-lg font-bold text-white">{modalUser.fullname || modalUser.username}</h3>
            <p className="text-xs text-cyan-300/80 mb-4">{modalUser.email}</p>

            {/* 1-Line Test Msg / Purpose of Call Input */}
            <div className="text-left mb-5 bg-white/5 p-3 rounded-xl border border-indigo-400/20">
              <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 mb-1.5">
                <FaInfoCircle size={12} /> Purpose of Call (1-Line Test Message)
              </label>
              <input
                type="text"
                maxLength={100}
                value={callPurpose}
                onChange={(e) => setCallPurpose(e.target.value)}
                placeholder="e.g. Discuss frontend PR #204, or Quick weekend check-in"
                className="w-full bg-black/50 border border-indigo-400/30 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 placeholder:text-gray-500"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                The recipient sees this message before answering!
              </span>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={startCall}
                style={cyberStyles.buttonPrimary}
                className="px-6 py-2.5 rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <FaVideo /> Call Now
              </button>
              <button
                type="button"
                onClick={() => setShowUserDetailModal(false)}
                style={cyberStyles.buttonSecondary}
                className="px-6 py-2.5 rounded-xl hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Create Group Video Call (Family & Professional Meeting) */}
      {/* ============================================================== */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div style={cyberStyles.modal} className="max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-400/20 mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FaUsers className="text-cyan-400" /> Host Group Video Call
              </h3>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              {/* Meeting Type Selection */}
              <div>
                <label className="text-xs font-bold text-cyan-300 block mb-2">Select Meeting Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewGroupType('group-family')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      newGroupType === 'group-family'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <FaHeart size={18} className="text-pink-400" />
                    <span className="font-bold text-xs">Family Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewGroupType('group-professional')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      newGroupType === 'group-professional'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,245,212,0.3)]'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <FaBriefcase size={18} className="text-cyan-400" />
                    <span className="font-bold text-xs">Professional Meeting</span>
                  </button>
                </div>
              </div>

              {/* Room Name */}
              <div>
                <label className="text-xs font-bold text-cyan-300 block mb-1">Room / Meeting Title</label>
                <input
                  type="text"
                  placeholder={newGroupType === 'group-professional' ? "e.g. Q3 Executive Sync" : "e.g. Sunday Family Gathering"}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-black/50 border border-indigo-400/30 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400 placeholder:text-gray-500"
                />
              </div>

              {/* 1-Line Purpose of Call */}
              <div>
                <label className="text-xs font-bold text-cyan-300 block mb-1">
                  Purpose of Meeting (1-Line Agenda)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder={newGroupType === 'group-professional' ? "e.g. Review deliverables & blockers" : "e.g. Catch up with grandma & cousins"}
                  value={newGroupPurpose}
                  onChange={(e) => setNewGroupPurpose(e.target.value)}
                  className="w-full bg-black/50 border border-indigo-400/30 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400 placeholder:text-gray-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreateGroupRoom}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaVideo /> Launch VibeTalk Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: Call Rejected                                         */}
      {/* ============================================================== */}
      {callRejectedPopUp && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div style={cyberStyles.modal} className="max-w-md w-full p-6 text-center animate-fadeIn">
            <p className="text-xl font-black mb-4 text-rose-400">Call Rejected</p>
            <img
              src={getUserAvatar(rejectorData)}
              alt="Caller"
              className="w-20 h-20 rounded-full border-4 border-rose-500 mx-auto mb-3 object-cover shadow-[0_0_20px_rgba(255,58,58,0.4)]"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/default-avatar.svg";
              }}
            />
            <h3 className="text-lg font-bold text-white mb-4">{rejectorData?.name || "User"} declined the call</h3>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={startCall}
                style={cyberStyles.buttonPrimary}
                className="px-5 py-2.5 rounded-xl flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
              >
                <FaPhoneAlt /> Call Again
              </button>
              <button
                type="button"
                onClick={() => {
                  endCallCleanup();
                  setCallRejectedPopUp(false);
                  setShowUserDetailModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: Incoming Video Call + 1-Line Purpose / Test Message  */}
      {/* ============================================================== */}
      {reciveCall && !callAccepted && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div style={cyberStyles.modal} className="max-w-md w-full p-7 text-center animate-pulse">
            <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold mb-3 border border-cyan-500/40">
              INCOMING VIBETALK VIDEO CALL
            </div>
            <div className="relative w-24 h-24 mx-auto mb-3">
              <div className="w-full h-full rounded-full border-4 border-cyan-400 animate-ping absolute inset-0" />
              <img
                src={getUserAvatar(caller)}
                alt="Incoming Caller"
                className="w-full h-full rounded-full border-4 border-cyan-400 object-cover shadow-[0_0_25px_rgba(0,245,212,0.6)] relative z-10"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/default-avatar.svg";
                }}
              />
            </div>
            <h3 className="text-xl font-black text-white mb-0.5">{callerName}</h3>
            <p className="text-xs text-indigo-200/80 mb-4">{caller?.email}</p>

            {/* 1-Line Test Message / Purpose of Call Notification */}
            {incomingCallPurpose && (
              <div className="mb-5 p-3 rounded-xl bg-cyan-950/70 border border-cyan-400/40 text-left">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1 mb-1">
                  <FaInfoCircle size={10} /> Purpose of this Call:
                </span>
                <p className="text-xs text-white font-medium italic">
                  "{incomingCallPurpose}"
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={handelacceptCall}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer text-sm"
              >
                <FaPhoneAlt /> Accept
              </button>
              <button
                type="button"
                onClick={handelrejectCall}
                className="px-6 py-3 rounded-xl bg-rose-500 text-white font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,58,58,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer text-sm"
              >
                <FaPhoneSlash /> Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;