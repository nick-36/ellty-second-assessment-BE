import express, { RequestHandler, Router } from "express";
import * as treeController from "../controllers/treeController";
import { protect, restrictTo } from "../middleware";
import { Role } from "@prisma/client";

const router: Router = express.Router();

router.get("/", treeController.getAllTrees as RequestHandler);

// Protected routes
router.get("/:id", protect, treeController.getTree as RequestHandler);
router.post(
  "/",
  protect,
  restrictTo(Role.REGISTERED),
  treeController.createTree as RequestHandler
);
router.post(
  "/:id/operations",
  protect,
  restrictTo(Role.REGISTERED),
  treeController.addOperation as RequestHandler
);

export default router;
