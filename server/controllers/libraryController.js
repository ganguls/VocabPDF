const Book = require('../models/Book');
const fs = require('fs');
const path = require('path');

// @desc Upload a new PDF to the library
const uploadBook = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const { title, totalPages, coverImage } = req.body;

    let coverImageFilename;
    if (coverImage) {
      const base64Data = coverImage.replace(/^data:image\/\w+;base64,/, "");
      coverImageFilename = req.file.filename + '-cover.jpg';
      const coverImagePath = path.join(__dirname, '..', 'uploads', coverImageFilename);
      fs.writeFileSync(coverImagePath, base64Data, 'base64');
    }

    const book = new Book({
      title: title || req.file.originalname.replace('.pdf', ''),
      filename: req.file.filename,
      coverImage: coverImageFilename,
      totalPages: parseInt(totalPages, 10) || 1,
      currentPage: 1,
    });

    await book.save();
    res.status(201).json(book);
  } catch (error) {
    // Clean up uploaded file if DB save fails
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, '..', 'uploads', req.file.filename));
    }
    next(error);
  }
};

// @desc Get all books in the library
const getBooks = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    next(error);
  }
};

// @desc Update reading progress of a book
const updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPage, totalPages } = req.body;

    const updateData = {};
    if (currentPage !== undefined) updateData.currentPage = parseInt(currentPage, 10);
    if (totalPages !== undefined) updateData.totalPages = parseInt(totalPages, 10);

    const book = await Book.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    next(error);
  }
};

// @desc Delete a book
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    
    if (!book) return res.status(404).json({ error: 'Book not found' });

    // Delete file
    const filePath = path.join(__dirname, '..', 'uploads', book.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (book.coverImage) {
      const coverPath = path.join(__dirname, '..', 'uploads', book.coverImage);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    // Delete DB record
    await book.deleteOne();
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadBook,
  getBooks,
  updateProgress,
  deleteBook,
};
