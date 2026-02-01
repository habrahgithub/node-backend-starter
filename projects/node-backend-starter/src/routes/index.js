import { Router } from "express";
import healthRoutes from "./health.routes.js";
import echoRoutes from "./echo.routes.js";
import meRoutes from "./me.routes.js";

const router = Router();

router.use(healthRoutes);
router.use(echoRoutes);
router.use(meRoutes);

export default router;
