import express, { Router, RequestHandler } from "express";
import * as authController from "../controllers/authController";

const router: Router = express.Router();

router.post("/sign-up", authController.signUp as RequestHandler);

router.post("/login", authController.login as RequestHandler);

export default router;
