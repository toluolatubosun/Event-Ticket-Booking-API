import { Router } from "express";

import { CONFIGS } from "@/configs";
import auth from "@/middlewares/auth.middleware";
import EventCtrl from "@/controllers/v1/event.controller";

const router: Router = Router();

router.get("/discover", auth(CONFIGS.APP_ROLES.USER), EventCtrl.discoverEvents);

router.get("/my-events", auth(CONFIGS.APP_ROLES.USER), EventCtrl.getAllMyEvents);

router.get("/status/:event_id", auth(CONFIGS.APP_ROLES.USER), EventCtrl.getEventStatus);

router.post("/initialize", auth(CONFIGS.APP_ROLES.USER), EventCtrl.createEvent);

router.post("/book", auth(CONFIGS.APP_ROLES.USER), EventCtrl.createEventBooking);

router.delete("/booking/cancel", auth(CONFIGS.APP_ROLES.USER), EventCtrl.cancelEventBooking);

router.delete("/:event_id", auth(CONFIGS.APP_ROLES.USER), EventCtrl.deleteEvent);

export default router;
