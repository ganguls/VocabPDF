import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useInView } from 'react-intersection-observer';
import SnipRegionLayer from './SnipRegionLayer';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import useAppStore from '../store/useAppStore';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function highlightText(str, dictionary) {
  if (!str || typeof str !== 'string' || !dictionary || dictionary.size === 0) return str;
  
  const words = Array.from(dictionary.keys());
  if (words.length === 0) return str;
  
  let result = str;
  const sortedWords = words.sort((a, b) => b.length - a.length);

  for (const word of sortedWords) {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');
    
    result = result.replace(regex, (match) => {
      const data = dictionary.get(word);
      if (!data) return match;
      const { meaning, saved } = data;
      
      const addBtn = !saved ? `<span class="add-vocab-btn" data-word="${word}" data-meaning="${meaning}" title="Add to My Vocab">✚</span>` : '';
      return `<mark class="vocab-highlight ${saved ? 'saved' : 'unsaved'}" data-meaning="${meaning}">${match}${addBtn}</mark>`;
    });
  }

  return result;
}

const PageWrapper = React.memo(({ pageNumber, scale, onVisible, dictionary }) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '200px 0px', // Pre-load pages 200px before they enter viewport
  });

  const [loadedHeight, setLoadedHeight] = useState(0);

  const textRenderer = useCallback(({ str }) => highlightText(str, dictionary), [dictionary]);

  useEffect(() => {
    if (inView) {
      onVisible(pageNumber);
    }
  }, [inView, pageNumber, onVisible]);

  return (
    <div
      ref={ref}
      id={`page-${pageNumber}`}
      className="pdf-page-wrapper"
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '24px',
        minHeight: inView ? 'auto' : `${loadedHeight || 800 * scale}px`,
        width: '100%',
      }}
    >
      {inView && (
        <Page
          pageNumber={pageNumber}
          scale={scale}
          renderAnnotationLayer={true}
          renderTextLayer={true}
          onLoadSuccess={(page) => setLoadedHeight(page.originalHeight * scale)}
          customTextRenderer={textRenderer}
        />
      )}
    </div>
  );
});

export default function PDFViewer() {
  const { 
    pdfFile, currentBook, updateBookProgress, 
    setSelectedText, showContextMenu, hideContextMenu, 
    setOutline, setPdfInstance,
    scanActive, toggleScan, processImageSnippet,
    savedVocab, words 
  } = useAppStore();
  
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const viewerRef = useRef(null);

  const vocabDictionary = React.useMemo(() => {
    const dict = new Map();
    savedVocab.forEach(v => {
      if (v.word) dict.set(v.word.toLowerCase(), { meaning: v.meaning_si, saved: true });
    });
    words.forEach(v => {
      if (v.word && !dict.has(v.word.toLowerCase())) {
        dict.set(v.word.toLowerCase(), { meaning: v.meaning_si, saved: v.status === 'saved' });
      }
    });
    return dict;
  }, [savedVocab, words]);

  const onDocumentLoadSuccess = async (pdf) => {
    setNumPages(pdf.numPages);
    setPdfInstance(pdf);

    try {
      const outline = await pdf.getOutline();
      setOutline(outline);
    } catch (e) {
      console.error('Failed to get PDF outline', e);
      setOutline(null);
    }
    
    // Jump to the saved current page when the document loads
    if (currentBook && currentBook.currentPage > 1) {
      setTimeout(() => {
        const el = document.getElementById(`page-${currentBook.currentPage}`);
        if (el && viewerRef.current) {
          viewerRef.current.scrollTo({ top: el.offsetTop - 20, behavior: 'instant' });
        }
      }, 300);
    }
  };

  const handlePageVisible = useCallback((pageNumber) => {
    // Calling updateBookProgress which internally gets currentBook
    updateBookProgress(pageNumber, numPages);
  }, [numPages, updateBookProgress]);

  const handleMouseUp = useCallback(
    (e) => {
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text && text.length > 2) {
          setSelectedText(text);
          showContextMenu(e.clientX, e.clientY);
        } else {
          hideContextMenu();
        }
      }, 50);
    },
    [setSelectedText, showContextMenu, hideContextMenu]
  );

  const handleContextMenu = useCallback(
    (e) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 2) {
        e.preventDefault();
        setSelectedText(text);
        showContextMenu(e.clientX, e.clientY);
      }
    },
    [setSelectedText, showContextMenu]
  );

  const handlePdfClick = useCallback((e) => {
    const btn = e.target.closest('.add-vocab-btn');
    if (btn) {
      e.stopPropagation();
      const word = btn.getAttribute('data-word');
      const meaning = btn.getAttribute('data-meaning');
      useAppStore.getState().saveSingleWord({ word, meaning_en: '', meaning_si: meaning });
    }
  }, []);

  return (
    <div className="pdf-viewer-container">
      {!pdfFile ? (
        <div className="pdf-loading">No PDF loaded</div>
      ) : (
        <>
          <div className="pdf-toolbar">
            <button 
              className={`toolbar-btn ${scanActive ? 'active' : ''}`} 
              onClick={toggleScan}
              title="Scan / Snipping Tool for OCR"
            >
              ✂️ Scan
            </button>
            <button 
              className={`toolbar-btn ${useAppStore.getState().tocVisible ? 'active' : ''}`} 
              onClick={useAppStore.getState().toggleToc}
              title="Toggle Table of Contents"
            >
              📑
            </button>
            <span className="book-title-header">{currentBook?.title || 'Reading PDF'}</span>
            <div className="page-controls">
              <span className="page-info">
                {currentBook ? currentBook.currentPage : 1} / {numPages}
              </span>
            </div>
            <div className="zoom-controls">
              <button className="toolbar-btn" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>−</button>
              <span className="zoom-label">{Math.round(scale * 100)}%</span>
              <button className="toolbar-btn" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>+</button>
            </div>
          </div>

          <div
            className="pdf-pages"
            ref={viewerRef}
            onClick={handlePdfClick}
            onMouseUp={handleMouseUp}
            onContextMenu={handleContextMenu}
            style={{ position: 'relative' }}
          >
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="loading-state"><div className="ai-loader"><div className="pulse-ring"></div><div className="loader-icon">📄</div></div><p>Loading book securely...</p></div>}
              error={<div className="pdf-error">Failed to load PDF. Check server permissions.</div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <PageWrapper
                  key={`page-${index + 1}-${vocabDictionary.size}`}
                  pageNumber={index + 1}
                  scale={scale}
                  onVisible={handlePageVisible}
                  dictionary={vocabDictionary}
                />
              ))}
            </Document>

            {/* Snipping/Scanning Overlay */}
            <SnipRegionLayer 
              containerRef={viewerRef}
              active={scanActive} 
              onSnip={processImageSnippet}
              onCancel={toggleScan}
            />
          </div>
        </>
      )}
    </div>
  );
}
