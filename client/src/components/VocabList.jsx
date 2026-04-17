import React from 'react';
import useAppStore from '../store/useAppStore';

export default function VocabList() {
  const {
    words,
    selectedWordIds,
    toggleWordSelection,
    selectAllWords,
    clearWordSelection,
    saving,
    saveSelectedWords,
  } = useAppStore();

  if (words.length === 0) return null;

  const newWords = words.filter((w) => w.status === 'new');
  const savedWords = words.filter((w) => w.status === 'saved');
  const allNewSelected = newWords.length > 0 && newWords.every((w) => selectedWordIds.has(w.word));

  return (
    <div className="vocab-list-container">
      <div className="section-header">
        <span className="section-icon">📚</span>
        <h3>Vocabulary ({words.length})</h3>
        <div className="vocab-badges">
          {newWords.length > 0 && (
            <span className="badge badge-new">{newWords.length} new</span>
          )}
          {savedWords.length > 0 && (
            <span className="badge badge-saved">{savedWords.length} saved</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="vocab-legend">
        <span className="legend-item">
          <span className="dot dot-new"></span> New word
        </span>
        <span className="legend-item">
          <span className="dot dot-saved"></span> Already saved
        </span>
      </div>

      {/* Select controls */}
      {newWords.length > 0 && (
        <div className="vocab-controls">
          <button
            className="link-btn"
            onClick={allNewSelected ? clearWordSelection : selectAllWords}
          >
            {allNewSelected ? 'Deselect All' : 'Select All New'}
          </button>
          <span className="selected-count">
            {selectedWordIds.size} selected
          </span>
        </div>
      )}

      {/* Word cards */}
      <div className="vocab-cards">
        {words.map((w) => {
          const isSaved = w.status === 'saved';
          const isSelected = selectedWordIds.has(w.word);
          return (
            <div
              key={w.word}
              className={`vocab-card ${isSaved ? 'saved' : 'new'} ${isSelected ? 'selected' : ''}`}
              onClick={() => !isSaved && toggleWordSelection(w.word)}
            >
              <div className="card-left">
                {!isSaved ? (
                  <input
                    type="checkbox"
                    className="word-checkbox"
                    checked={isSelected}
                    onChange={() => toggleWordSelection(w.word)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="saved-icon" title="Already saved">✓</span>
                )}
              </div>
              <div className="card-content">
                <div className="word-title">{w.word}</div>
                <div className="word-meanings">
                  <span className="meaning-en">EN: {w.meaning_en}</span>
                  <span className="meaning-si">SI: {w.meaning_si}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      {selectedWordIds.size > 0 && (
        <button
          className="save-btn"
          onClick={saveSelectedWords}
          disabled={saving}
        >
          {saving ? (
            <span className="btn-loading">
              <span className="spinner"></span> Saving…
            </span>
          ) : (
            `💾 Save ${selectedWordIds.size} Word${selectedWordIds.size !== 1 ? 's' : ''}`
          )}
        </button>
      )}
    </div>
  );
}
