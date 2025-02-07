import express, { Router } from "express";

import authRoutes from "@/routes/v1/auth.route";
import userRoutes from "@/routes/v1/user.route";
import eventRoutes from "@/routes/v1/event.route";

const router: Router = express.Router();

router.use("/auth", authRoutes);

router.use("/users", userRoutes);

router.use("/events", eventRoutes);

export default router;
