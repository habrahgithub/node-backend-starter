cat > (src / routes / v1 / index.js) << "EOF";
import { Router } from "express";
import healthRoutes from "../health.routes.js";
import echoRoutes from "../echo.routes.js";

const router = Router();

router.use(healthRoutes);
router.use(echoRoutes);

export default router;
EOF;
