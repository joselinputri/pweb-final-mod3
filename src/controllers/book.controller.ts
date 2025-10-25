import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ CREATE
export const createBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      writer,
      publisher,
      publication_year,
      description,
      price,
      stock_quantity,
      genre_id,
    } = req.body as any;

    if (!title || !writer || !price || !stock_quantity || !genre_id) {
      res.status(400).json({ message: "Semua field wajib diisi" });
      return;
    }

    // ✅ Check existing non-deleted book
    const exist = await prisma.book.findFirst({ 
      where: { 
        title,
        deleted_at: null
      } 
    });
    
    if (exist) {
      res.status(409).json({ message: "Judul buku sudah ada" });
      return;
    }

    const book = await prisma.book.create({
      data: {
        title,
        writer,
        publisher,
        publication_year: publication_year ? Number(publication_year) : null,
        description,
        price: Number(price),
        stock_quantity: Number(stock_quantity),
        genre_id,
      },
      include: { genre: true },
    });

    res.status(201).json({ message: "Buku berhasil dibuat", data: book });
  } catch (err) {
    console.error("Create book error:", err);
    res.status(500).json({ message: "Gagal membuat buku", error: err });
  }
};

// ✅ READ (GET ALL) - Only non-deleted
export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const title = req.query.title as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const books = await prisma.book.findMany({
      where: { 
        deleted_at: null,  // ✅ Only non-deleted books
        ...(title && { title: { contains: title } })
      },
      skip,
      take: limit,
      include: { 
        genre: true // Remove the invalid 'where' clause
      },
      orderBy: { created_at: "desc" },
    });

    res.json({ data: books });
  } catch (err) {
    console.error("Get books error:", err);
    res.status(500).json({ message: "Gagal mengambil daftar buku", error: err });
  }
};

// ✅ READ (GET DETAIL)
export const getBookDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { book_id } = req.params;

    const book = await prisma.book.findFirst({
      where: { 
        id: book_id,
        deleted_at: null  // ✅ Only non-deleted
      },
      include: { genre: true },
    });

    if (!book) {
      res.status(404).json({ message: "Buku tidak ditemukan" });
      return;
    }

    res.json({ data: book });
  } catch (err) {
    console.error("Get book detail error:", err);
    res.status(500).json({ message: "Gagal mengambil detail buku", error: err });
  }
};

// ✅ UPDATE
export const updateBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { book_id } = req.params;
    const data = req.body;

    // ✅ Check if book exists and not deleted
    const book = await prisma.book.findFirst({
      where: { 
        id: book_id,
        deleted_at: null
      }
    });

    if (!book) {
      res.status(404).json({ message: "Buku tidak ditemukan" });
      return;
    }

    const updated = await prisma.book.update({ 
      where: { id: book_id }, 
      data,
      include: { genre: true }
    });

    res.json({ message: "Buku berhasil diupdate", data: updated });
  } catch (err: any) {
    console.error("Update book error:", err);
    if (err.code === "P2025") {
      res.status(404).json({ message: "Buku tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Gagal update buku", error: err });
  }
};

// ✅ DELETE (Soft Delete)
export const deleteBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { book_id } = req.params;

    // ✅ Soft delete
    await prisma.book.update({
      where: { id: book_id },
      data: { deleted_at: new Date() }
    });

    res.json({ message: "Buku dihapus" });
  } catch (err: any) {
    console.error("Delete book error:", err);
    if (err.code === "P2025") {
      res.status(404).json({ message: "Buku tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Gagal hapus buku", error: err });
  }
};