import { Router } from "express";

import { CONFIGS } from "@/configs";
import auth from "@/middlewares/auth.middleware";
import AuthCtrl from "@/controllers/v1/auth.controller";

const router: Router = Router();

router.post("/register", AuthCtrl.register);

router.post("/login", AuthCtrl.login);

router.post("/refresh-tokens", AuthCtrl.refreshTokens);

router.post("/logout", AuthCtrl.logout);

router.put("/update-password", auth(CONFIGS.APP_ROLES.USER), AuthCtrl.updatePassword);

export default router;
