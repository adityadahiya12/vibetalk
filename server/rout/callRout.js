import express from "express";
import { createCallLog, getMyCallHistory } from "../routControler/callController.js";
import isLogin from "../middleware/isLogin.js";

const router = express.Router();

router.get("/history", isLogin, getMyCallHistory);
router.post("/log", isLogin, createCallLog);

export default router;
