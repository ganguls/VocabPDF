import React, { useState } from 'react';
import useAppStore from '../store/useAppStore';

const TOCNode = ({ item, pdfInstance, onJump }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.items && item.items.length > 0;

  const handleClick = async (e) => {
    e.preventDefault();
    if (item.dest && pdfInstance) {
      try {
        // dest can be an explicit array or named string index, but typically an array like [ {num, gen}, name, ... ]
        // pdf.getPageIndex resolves the dest ref to an actual 0-indexed page integer
        const pageRef = Array.isArray(item.dest) ? item.dest[0] : item.dest;
        const pageIndex = await pdfInstance.getPageIndex(pageRef);
        onJump(pageIndex + 1); // convert 0-indexed to 1-indexed
      } catch (err) {
        console.error('Failed to resolve TOC destination', err);
      }
    } else if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  return (
    <div className="toc-node">
      <div 
        className={`toc-item ${!item.dest && hasChildren ? 'parent-only' : ''}`}
        style={{
          fontWeight: item.bold ? 'bold' : 'normal',
          fontStyle: item.italic ? 'italic' : 'normal'
        }}
      >
        {hasChildren && (
          <button 
            className={`toc-expand-btn ${expanded ? 'expanded' : ''}`} 
            onClick={() => setExpanded(!expanded)}
          >
            ▶
          </button>
        )}
        {!hasChildren && <span className="toc-spacer" />}
        <span className="toc-title" onClick={handleClick} title={item.title}>
          {item.title}
        </span>
      </div>
      
      {hasChildren && expanded && (
        <div className="toc-children">
          {item.items.map((child, idx) => (
            <TOCNode key={idx} item={child} pdfInstance={pdfInstance} onJump={onJump} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TableOfContents() {
  const { outline, pdfInstance } = useAppStore();

  const handleJumpToPage = (pageNumber) => {
    const el = document.getElementById(`page-${pageNumber}`);
    const container = document.querySelector('.pdf-pages');
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
    }
  };

  if (!outline) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📑</div>
        <h3>No Outline Found</h3>
        <p>This PDF document does not contain a built-in table of contents.</p>
      </div>
    );
  }

  return (
    <div className="toc-container">
      <div className="toc-list">
        {outline.map((item, idx) => (
          <TOCNode 
            key={idx} 
            item={item} 
            pdfInstance={pdfInstance} 
            onJump={handleJumpToPage} 
          />
        ))}
      </div>
    </div>
  );
}
