import React, { useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';

export default function ContextMenu() {
  const { contextMenu, hideContextMenu, processAI, selectedText } = useAppStore();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        hideContextMenu();
      }
    };
    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu.visible, hideContextMenu]);

  if (!contextMenu.visible) return null;

  // Keep menu within viewport
  const menuWidth = 200;
  const menuHeight = 140;
  const x = Math.min(contextMenu.x, window.innerWidth - menuWidth - 10);
  const y = Math.min(contextMenu.y, window.innerHeight - menuHeight - 10);

  const handleAction = (mode) => {
    hideContextMenu();
    processAI(mode);
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: x, top: y }}
    >
      <div className="context-menu-header">
        <span>"{selectedText.slice(0, 40)}{selectedText.length > 40 ? '…' : ''}"</span>
      </div>
      <button className="context-item" onClick={() => handleAction('all')}>
        <span className="context-icon">🤖</span>
        Ask AI (Translate + Vocab)
      </button>
      <button className="context-item" onClick={() => handleAction('translate')}>
        <span className="context-icon">🌐</span>
        Translate Only
      </button>
      <button className="context-item" onClick={() => handleAction('vocab')}>
        <span className="context-icon">📚</span>
        Extract Vocabulary
      </button>
    </div>
  );
}
