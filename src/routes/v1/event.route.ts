import { Router } from "express";

import { CONFIGS } from "@/configs";
import auth from "@/middlewares/auth.middleware";
import EventCtrl from "@/controllers/v1/event.controller";

const router: Router = Router();

router.get("/status/:event_id", auth(CONFIGS.APP_ROLES.USER), EventCtrl.getEventStatus);

router.post("/initialize", auth(CONFIGS.APP_ROLES.USER), EventCtrl.createEvent);

router.post("/book", auth(CONFIGS.APP_ROLES.USER), EventCtrl.createEventBooking);

router.delete("/booking/cancel", auth(CONFIGS.APP_ROLES.USER), EventCtrl.cancelEventBooking);

export default router;
