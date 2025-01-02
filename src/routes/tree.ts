import express, { Router } from "express";
import * as treeController from "../controllers/treeController";
import { protect } from "../middleware";

const router: Router = express.Router();

router.get("/", treeController.getAllTrees);

// Protected routes
router.get("/:id", protect, treeController.getTree);
router.post("/", protect, treeController.createTree);
router.post("/:id/operations", protect, treeController.addOperation);

export default router;
