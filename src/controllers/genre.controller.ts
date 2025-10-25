import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ CREATE
export const createGenre = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: "Nama genre wajib diisi" });
      return;
    }

    // ✅ Check if genre exists (including soft deleted)
    const exist = await prisma.genre.findFirst({ 
      where: { 
        name,
        deleted_at: null  // Only check non-deleted genres
      } 
    });
    
    if (exist) {
      res.status(409).json({ message: "Genre sudah ada" });
      return;
    }

    const genre = await prisma.genre.create({ data: { name } });
    res.status(201).json({ message: "Genre berhasil dibuat", data: genre });
  } catch (err) {
    console.error("Create genre error:", err);
    res.status(500).json({ message: "Gagal membuat genre", error: err });
  }
};

// ✅ READ (GET ALL) - Only non-deleted
export const getGenres = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const genres = await prisma.genre.findMany({
      where: { deleted_at: null },  // ✅ Only non-deleted genres
      include: { 
        books: {
          where: { deleted_at: null }  // ✅ Only non-deleted books
        }
      },
      orderBy: { name: "asc" },
    });
    res.json({ data: genres });
  } catch (err) {
    console.error("Get genres error:", err);
    res.status(500).json({ message: "Gagal mengambil daftar genre", error: err });
  }
};

// ✅ UPDATE
export const updateGenre = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { genre_id } = req.params;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: "Nama genre wajib diisi" });
      return;
    }

    // ✅ Check if genre exists and not deleted
    const genre = await prisma.genre.findFirst({
      where: { 
        id: genre_id,
        deleted_at: null
      }
    });

    if (!genre) {
      res.status(404).json({ message: "Genre tidak ditemukan" });
      return;
    }

    const updated = await prisma.genre.update({
      where: { id: genre_id },
      data: { name },
    });

    res.json({ message: "Genre berhasil diupdate", data: updated });
  } catch (err: any) {
    console.error("Update genre error:", err);
    if (err.code === "P2025") {
      res.status(404).json({ message: "Genre tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Gagal update genre", error: err });
  }
};

// ✅ DELETE (Soft Delete)
export const deleteGenre = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { genre_id } = req.params;

    // ✅ Soft delete instead of hard delete
    await prisma.genre.update({
      where: { id: genre_id },
      data: { deleted_at: new Date() }
    });

    res.json({ message: "Genre dihapus" });
  } catch (err: any) {
    console.error("Delete genre error:", err);
    if (err.code === "P2025") {
      res.status(404).json({ message: "Genre tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Gagal hapus genre", error: err });
  }
};