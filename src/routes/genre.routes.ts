import { Router } from "express";
import {
  createGenre,
  getGenres,
  updateGenre,
  deleteGenre,
} from "../controllers/genre.controller";

const router = Router();

router.post("/", createGenre);
router.get("/", getGenres);
router.patch("/:genre_id", updateGenre);
router.delete("/:genre_id", deleteGenre);

export default router;
