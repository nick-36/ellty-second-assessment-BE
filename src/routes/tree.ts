import express, { RequestHandler, Router } from "express";
import * as treeController from "../controllers/treeController";
import { protect } from "../middleware";

const router: Router = express.Router();

router.get("/", treeController.getAllTrees as RequestHandler);

// Protected routes
router.get("/:id", protect, treeController.getTree as RequestHandler);
router.post("/", protect, treeController.createTree as RequestHandler);
router.post(
  "/:id/operations",
  protect,
  treeController.addOperation as RequestHandler
);

export default router;
