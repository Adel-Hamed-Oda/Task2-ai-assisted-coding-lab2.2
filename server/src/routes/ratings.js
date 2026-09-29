import { Router } from "express";
import {
  getAllRatings,
  getRating,
  createRating,
  getRatingSummary,
} from "../controllers/ratingController.js";

const router = Router();

router.get("/", getAllRatings);
router.post("/", createRating);
// Must be registered BEFORE '/:id', otherwise 'summary' would be treated as an id.
router.get("/summary", getRatingSummary);
router.get("/:id", getRating);

export default router;
