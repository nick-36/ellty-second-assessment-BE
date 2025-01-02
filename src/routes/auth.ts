import express, { Router } from "express";
import * as authController from "../controllers/authController";

const router: Router = express.Router();

router.post("/sign-up", authController.signUp);

router.post("/login", authController.login);

export default router;
