import React, { useRef } from 'react';
import useAppStore from '../store/useAppStore';

export default function Library() {
  const { library, uploadBook, openBook, deleteBook, loading, loadLibrary } = useAppStore();
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        useAppStore.getState().showNotification('error', 'Only PDF files are supported.');
        return;
      }
      await uploadBook(file);
    }
  };

  // Convert progress to percentage safely
  const getProgress = (current, total) => {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((current / total) * 100));
  };

  return (
    <div className="library-container">
      <div className="library-header">
        <div className="library-title-group">
          <h1>My Library</h1>
          <span className="book-count">{library.length} Books</span>
        </div>
        
        <button 
          className="upload-book-btn" 
          onClick={handleUploadClick}
          disabled={loading}
        >
          <span className="btn-icon">✚</span> Import PDF
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="application/pdf" 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
      </div>

      {library.length === 0 ? (
        <div className="library-empty">
          <div className="empty-book-icon">📚</div>
          <h2>Your library is empty</h2>
          <p>Import a PDF document to start reading and extracting vocabulary.</p>
          <button className="upload-btn" onClick={handleUploadClick}>Import your first book</button>
        </div>
      ) : (
        <div className="library-grid">
          {library.map((book) => {
            const pct = getProgress(book.currentPage, book.totalPages);
            return (
              <div 
                key={book._id} 
                className="book-card" 
                onClick={() => openBook(book)}
              >
                <button 
                  className="book-delete-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(window.confirm('Delete this book?')) deleteBook(book._id);
                  }}
                  title="Remove book"
                >
                  ✕
                </button>
                
                <div className="book-cover">
                  {book.coverImage ? (
                    <img 
                      src={`/uploads/${book.coverImage}`} 
                      alt="Cover" 
                      className="cover-image" 
                    />
                  ) : (
                    <span className="cover-icon">📄</span>
                  )}
                  <div className="cover-pct">{pct}%</div>
                </div>
                
                <div className="book-details">
                  <h3 className="book-title" title={book.title}>{book.title}</h3>
                  <div className="book-progress">
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="progress-text">
                      {book.currentPage} / {book.totalPages || '?'} pages
                    </span>
                  </div>
                  <span className="book-date">Added {new Date(book.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
