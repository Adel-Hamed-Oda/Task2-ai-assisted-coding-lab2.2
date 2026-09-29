import Joi from "joi";
import mongoose from "mongoose";
import { Rating } from "../models/Rating.js";

const createSchema = Joi.object({
  movieCode: Joi.string().trim().required(),
  rating: Joi.number().min(1).max(5).required(),
  note: Joi.string().allow(""),
  ratedBy: Joi.string().hex().length(24),
});

// GET /api/ratings
export async function getAllRatings(req, res, next) {
  try {
    const ratings = await Rating.find().sort({ createdAt: -1 }).lean();
    res.json({ ratings });
  } catch (err) {
    next(err);
  }
}

// GET /api/ratings/:id
export async function getRating(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid rating id" });
    }
    const rating = await Rating.findById(req.params.id);
    if (!rating) return res.status(404).json({ message: "Rating not found" });
    res.json({ rating });
  } catch (err) {
    next(err);
  }
}

// POST /api/ratings
export async function createRating(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      stripUnknown: true,
    });
    if (error) return res.status(400).json({ message: error.message });

    const rating = await Rating.create(value);
    res.status(201).json({ rating });
  } catch (err) {
    // Compound unique index (movieCode + ratedBy) violated.
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "This user has already rated this movie" });
    }
    next(err);
  }
}

// GET /api/ratings/summary?movieCode=MV101
export async function getRatingSummary(req, res, next) {
  try {
    const movieCode =
      typeof req.query.movieCode === "string" ? req.query.movieCode.trim() : "";
    if (!movieCode)
      return res.status(400).json({ message: "movieCode is required" });

    const [stats] = await Rating.aggregate([
      { $match: { movieCode } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    res.json({
      movieCode,
      averageRating: stats ? stats.averageRating : 0,
      ratingCount: stats ? stats.ratingCount : 0,
    });
  } catch (err) {
    next(err);
  }
}
