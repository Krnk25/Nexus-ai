import express from "express";

import { runSystemCommand } from "../controllers/systemController.js";

const router = express.Router();

router.post("/run", runSystemCommand);

export default router;