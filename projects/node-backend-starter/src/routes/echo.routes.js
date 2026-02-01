import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { echo } from "../controllers/echo.controller.js";

const router = Router();

const echoSchema = z.object({
  body: z.object({
    message: z.string().min(1)
  }),
  query: z.any(),
  params: z.any()
});

router.post("/echo", validate(echoSchema), echo);

export default router;
