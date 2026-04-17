import React from 'react';
import useAppStore from '../store/useAppStore';
import TranslationBlock from './TranslationBlock';
import VocabList from './VocabList';

export default function SidePanel() {
  const { loading, translation, words, selectedText, notification } = useAppStore();

  const isEmpty = !loading && !translation && words.length === 0;

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h2>📖 Vocabulary Panel</h2>
        {selectedText && (
          <div className="selection-indicator">
            <span className="selection-dot"></span>
            Text selected
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? '✅' : '❌'} {notification.message}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="ai-loader">
            <div className="pulse-ring"></div>
            <span className="loader-icon">🤖</span>
          </div>
          <p>Analyzing with AI…</p>
          <span className="loading-sub">Translating and extracting vocabulary</span>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && !selectedText && (
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <h3>How to use</h3>
          <ol className="how-to-list">
            <li>Upload a PDF on the left</li>
            <li>Select any text in the PDF</li>
            <li>Right-click and choose an action</li>
            <li>Review and save vocabulary words</li>
          </ol>
        </div>
      )}

      {isEmpty && selectedText && (
        <div className="empty-state">
          <div className="empty-icon">👆</div>
          <p>Right-click the selected text to process it with AI</p>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <div className="results-container">
          <TranslationBlock />
          <VocabList />
        </div>
      )}
    </div>
  );
}
