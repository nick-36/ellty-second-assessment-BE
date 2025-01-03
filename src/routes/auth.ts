import express, { Router, RequestHandler } from "express";
import * as authController from "../controllers/authController";
import { protect } from "../middleware";

const router: Router = express.Router();

router.post("/sign-up", authController.signUp as RequestHandler);

router.post("/login", authController.login as RequestHandler);

router.get(
  "/users/me",
  protect,
  authController.getCurrentUser as RequestHandler
);

router.post(
  "/register",
  protect,
  authController.registerUser as RequestHandler
);

export default router;
