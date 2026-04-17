import React, { useCallback, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import useAppStore from '../store/useAppStore';

// Configure pdf.js worker — must match the pdfjs-dist version used by react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PDFViewer() {
  const { pdfFile, setPdfFile, setNumPages, numPages, currentPage, setCurrentPage } = useAppStore();
  const { setSelectedText, showContextMenu, hideContextMenu } = useAppStore();
  const viewerRef = useRef(null);
  const [scale, setScale] = useState(1.2);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    }
  };

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

  return (
    <div className="pdf-viewer-container">
      {!pdfFile ? (
        <div className="upload-zone">
          <div className="upload-inner">
            <div className="upload-icon">📄</div>
            <h2>Upload a PDF</h2>
            <p>Select a PDF file to start reading and extracting vocabulary</p>
            <label className="upload-btn">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              Choose PDF File
            </label>
          </div>
        </div>
      ) : (
        <>
          <div className="pdf-toolbar">
            <label className="toolbar-btn small">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              📂 New PDF
            </label>
            <div className="page-controls">
              <button
                className="toolbar-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                ‹
              </button>
              <span className="page-info">
                {currentPage} / {numPages}
              </span>
              <button
                className="toolbar-btn"
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage >= numPages}
              >
                ›
              </button>
            </div>
            <div className="zoom-controls">
              <button className="toolbar-btn" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
                −
              </button>
              <span className="zoom-label">{Math.round(scale * 100)}%</span>
              <button className="toolbar-btn" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>
                +
              </button>
            </div>
          </div>

          <div
            className="pdf-pages"
            ref={viewerRef}
            onMouseUp={handleMouseUp}
            onContextMenu={handleContextMenu}
          >
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div className="pdf-loading">Loading PDF…</div>}
              error={<div className="pdf-error">Failed to load PDF.</div>}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderAnnotationLayer={true}
                renderTextLayer={true}
              />
            </Document>
          </div>
        </>
      )}
    </div>
  );
}
