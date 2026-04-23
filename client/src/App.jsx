import React, { useEffect } from 'react';
import PDFViewer from './components/PDFViewer';
import SidePanel from './components/SidePanel';
import ContextMenu from './components/ContextMenu';
import SavedVocabModal from './components/SavedVocabModal';
import Library from './components/Library';
import TableOfContents from './components/TableOfContents';
import useAppStore from './store/useAppStore';
import './App.css';

export default function App() {
  const { loadVocab, loadLibrary, hideContextMenu, toggleSavedVocabModal, viewMode, closeBook, tocVisible } = useAppStore();

  useEffect(() => {
    loadVocab();
    loadLibrary();
  }, []);

  const handleGlobalClick = (e) => {
    // Hide context menu on any click outside of it
    if (!e.target.closest('.context-menu')) {
      hideContextMenu();
    }
  };

  return (
    <div className="app-root" onClick={handleGlobalClick}>
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          {viewMode === 'reader' && (
            <button className="back-to-library-btn" onClick={closeBook}>
              ← Library
            </button>
          )}
          <span className="brand-icon">📘</span>
          <span className="brand-name">Vocabulary PDF Reader</span>
          <span className="brand-badge">AI Powered</span>
        </div>
        <div className="header-hint">
          Select text in the PDF → Right-click → Ask AI
          <button className="my-vocab-btn" onClick={toggleSavedVocabModal}>
            <span className="btn-icon">📚</span> My Vocabulary
          </button>
        </div>
      </header>

      {/* Main Layout */}
      {viewMode === 'library' ? (
        <Library />
      ) : (
        <main className="app-main">
          {tocVisible && (
            <>
              <div className="sidebar-left">
                <div className="sidebar-left-header">
                  <h2>📑 Book Outline</h2>
                </div>
                <TableOfContents />
              </div>
              <div className="panel-divider"></div>
            </>
          )}
          <div className="pdf-panel">
            <PDFViewer />
          </div>
          <div className="panel-divider"></div>
          <div className="side-panel-wrapper">
            <SidePanel />
          </div>
        </main>
      )}

      {/* Global Context Menu */}
      <ContextMenu />

      {/* Modals */}
      <SavedVocabModal />
    </div>
  );
}
