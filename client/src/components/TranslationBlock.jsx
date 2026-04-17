import React from 'react';
import useAppStore from '../store/useAppStore';

export default function TranslationBlock() {
  const { translation, selectedText } = useAppStore();

  if (!translation) return null;

  return (
    <div className="translation-block">
      <div className="section-header">
        <span className="section-icon">🌐</span>
        <h3>Sinhala Translation</h3>
      </div>
      <div className="selected-preview">
        <span className="preview-label">Selected text:</span>
        <p className="preview-text">"{selectedText.slice(0, 120)}{selectedText.length > 120 ? '…' : ''}"</p>
      </div>
      <div className="translation-output">
        <p className="sinhala-text">{translation}</p>
      </div>
    </div>
  );
}
