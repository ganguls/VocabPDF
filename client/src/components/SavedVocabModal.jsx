import React, { useEffect, useState } from 'react';
import useAppStore from '../store/useAppStore';
import WordExplanation from './WordExplanation';

export default function SavedVocabModal() {
  const { savedVocabModalVisible, toggleSavedVocabModal, savedVocab, loadVocab } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [explainingWord, setExplainingWord] = useState(null);

  // Always refresh vocab list when the modal opens
  useEffect(() => {
    if (savedVocabModalVisible) {
      loadVocab();
      setSearchTerm('');
      setExplainingWord(null);
    }
  }, [savedVocabModalVisible, loadVocab]);

  if (!savedVocabModalVisible) return null;

  const filteredVocab = savedVocab.filter((v) =>
    v.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={toggleSavedVocabModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">📚</span>
            <h2>My Vocabulary</h2>
          </div>
          <button className="modal-close-btn" onClick={toggleSavedVocabModal}>
            ✕
          </button>
        </div>

        <div className="modal-search">
          {!explainingWord && (
            <input
              type="text"
              className="vocab-search-input"
              placeholder="Search saved words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}
        </div>

        <div className="modal-body">
          {explainingWord ? (
            <WordExplanation word={explainingWord} onClose={() => setExplainingWord(null)} />
          ) : savedVocab.length === 0 ? (
            <div className="modal-empty">
              <span className="empty-icon">📭</span>
              <p>You haven't saved any words yet.</p>
              <span className="empty-sub">Extract vocabulary from a PDF to get started!</span>
            </div>
          ) : filteredVocab.length === 0 ? (
            <div className="modal-empty small">
              <p>No words match your search.</p>
            </div>
          ) : (
            <div className="vocab-grid">
              {filteredVocab.map((w) => (
                <div 
                  key={w._id || w.word} 
                  className="vocab-grid-card clickable-card"
                  onClick={() => setExplainingWord(w.word)}
                >
                  <div className="vocab-grid-word">{w.word}</div>
                  <div className="vocab-grid-meanings">
                    <div className="meaning-row">
                      <span className="lang-tag">EN</span>
                      <span>{w.meaning_en}</span>
                    </div>
                    <div className="meaning-row">
                      <span className="lang-tag si">SI</span>
                      <span className="sinhala-text-small">{w.meaning_si}</span>
                    </div>
                  </div>
                  <div className="vocab-grid-date">
                    Saved: {new Date(w.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
