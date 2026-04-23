import { create } from 'zustand';
import { processText as processTextApi } from '../api/aiApi';
import { getVocab, checkWords as checkWordsApi, saveWords as saveWordsApi } from '../api/vocabApi';
import { getLibrary, uploadBook as uploadBookApi, updateProgress as updateProgressApi, deleteBook as deleteBookApi } from '../api/libraryApi';

const useAppStore = create((set, get) => ({
  // PDF state
  pdfFile: null,
  pdfInstance: null, // needed to calculate page indexes from outline destinations
  numPages: 0,
  currentPage: 1,
  outline: null, // Extracted Table of Contents data

  // Selection state
  selectedText: '',
  contextMenu: { visible: false, x: 0, y: 0 },

  // AI response state
  translation: '',
  words: [], // [{ word, meaning_en, meaning_si, status: 'new'|'saved' }]
  selectedWordIds: new Set(),

  // Vocabulary DB cache
  savedVocab: [],

  // UI state
  loading: false,
  saving: false,
  notification: null, // { type: 'success'|'error', message }
  savedVocabModalVisible: false,
  tocVisible: false,
  scanActive: false,
  
  // Library state
  library: [], // Array of books
  currentBook: null, // Active book object
  viewMode: 'library', // 'library' | 'reader'

  
  // --- Actions ---

  setPdfFile: (file) => set({ pdfFile: file }),
  setPdfInstance: (pdf) => set({ pdfInstance: pdf }),
  setNumPages: (n) => set({ numPages: n }),
  setOutline: (data) => set({ outline: data }),
  setCurrentPage: (n) => set({ currentPage: n }),

  setSelectedText: (text) => set({ selectedText: text }),

  showContextMenu: (x, y) =>
    set((state) =>
      state.selectedText.trim()
        ? { contextMenu: { visible: true, x, y } }
        : { contextMenu: { visible: false, x: 0, y: 0 } }
    ),

  hideContextMenu: () => set({ contextMenu: { visible: false, x: 0, y: 0 } }),

  toggleWordSelection: (word) =>
    set((state) => {
      const next = new Set(state.selectedWordIds);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return { selectedWordIds: next };
    }),

  selectAllWords: () =>
    set((state) => ({ selectedWordIds: new Set(state.words.map((w) => w.word)) })),

  clearWordSelection: () => set({ selectedWordIds: new Set() }),

  showNotification: (type, message) => {
    set({ notification: { type, message } });
    setTimeout(() => set({ notification: null }), 4000);
  },

  // Load all saved vocab from DB (cache)
  loadVocab: async () => {
    try {
      const data = await getVocab();
      set({ savedVocab: data });
    } catch {
      // silent — vocab cache fails gracefully
    }
  },

  toggleSavedVocabModal: () => 
    set((state) => ({ savedVocabModalVisible: !state.savedVocabModalVisible })),
  
// --- Actions ---

  setPdfFile: (file) => set({ pdfFile: file }),
  setPdfInstance: (pdf) => set({ pdfInstance: pdf }),
  
  loadLibrary: async () => {
    try {
      const data = await getLibrary();
      set({ library: data });
    } catch {
      get().showNotification('error', 'Failed to load library.');
    }
  },

  uploadBook: async (file) => {
    set({ loading: true });
    try {
      const newBook = await uploadBookApi(file);
      await get().loadLibrary();
      get().showNotification('success', 'Book added to library!');
      
      // Auto open newly uploaded book
      set({ 
        currentBook: newBook, 
        pdfFile: `/uploads/${newBook.filename}`,
        viewMode: 'reader',
        loading: false 
      });
    } catch (err) {
      set({ loading: false });
      get().showNotification('error', err?.response?.data?.error || 'Failed to upload PDF.');
    }
  },

  openBook: (book) => {
    set({ 
      currentBook: book, 
      pdfFile: `/uploads/${book.filename}`,
      viewMode: 'reader' 
    });
  },

  closeBook: () => {
    set({ currentBook: null, pdfFile: null, viewMode: 'library', words: [], translation: '', selectedText: '' });
  },

  updateBookProgress: async (pageNumber, totalPages) => {
    const { currentBook } = get();
    if (!currentBook) return;

    // Update locally for immediate UI response
    set({ 
      currentBook: { ...currentBook, currentPage: pageNumber, totalPages: totalPages || currentBook.totalPages } 
    });

    try {
      await updateProgressApi(currentBook._id, pageNumber, totalPages);
      // Background load library to keep grid up to date
      getLibrary().then(data => set({ library: data }));
    } catch (err) {
      console.error('Failed to update progress', err);
    }
  },

  deleteBook: async (id) => {
    try {
      await deleteBookApi(id);
      await get().loadLibrary();
      get().showNotification('success', 'Book removed from library.');
    } catch {
      get().showNotification('error', 'Failed to delete book.');
    }
  },

  // Process selected text with AI
  processAI: async (mode = 'all') => {
    const { selectedText } = get();
    if (!selectedText.trim()) return;

    set({ loading: true, translation: '', words: [], selectedWordIds: new Set() });

    try {
      const data = await processTextApi(selectedText);

      // Check which words are already in DB
      const wordList = data.words.map((w) => w.word.toLowerCase());
      let existingSet = new Set();

      if (wordList.length > 0) {
        const checkResult = await checkWordsApi(wordList);
        existingSet = new Set(checkResult.existing);
      }

      const words = data.words.map((w) => ({
        ...w,
        word: w.word.toLowerCase(),
        status: existingSet.has(w.word.toLowerCase()) ? 'saved' : 'new',
      }));

      set({
        translation: mode !== 'vocab' ? data.translation : '',
        words: mode !== 'translate' ? words : [],
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      get().showNotification('error', err?.response?.data?.error || 'AI processing failed.');
    }
  },

  // Toggle OCR cropping overlay
  toggleScan: () => set((state) => ({ scanActive: !state.scanActive, contextMenu: { visible: false, x: 0, y: 0 } })),

  // Process Snipped Image using AI OCR
  processImageSnippet: async (base64) => {
    set({ loading: true, translation: '', words: [], selectedWordIds: new Set(), scanActive: false });
    try {
      const data = await (await import('../api/aiApi')).processImage(base64);

      // Check which words are already in DB
      const wordList = data.vocabulary.map((w) => w.word.toLowerCase());
      let existingSet = new Set();

      if (wordList.length > 0) {
        const checkResult = await checkWordsApi(wordList);
        existingSet = new Set(checkResult.existing);
      }

      const words = data.vocabulary.map((w) => ({
        ...w,
        word: w.word.toLowerCase(),
        status: existingSet.has(w.word.toLowerCase()) ? 'saved' : 'new',
      }));

      set({
        translation: data.translation_si,
        words: words,
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      get().showNotification('error', err?.response?.data?.error || 'OCR processing failed.');
    }
  },

  // Save selected words to DB
  saveSelectedWords: async () => {
    const { words, selectedWordIds } = get();
    const toSave = words.filter((w) => selectedWordIds.has(w.word));
    if (toSave.length === 0) return;

    set({ saving: true });
    try {
      const result = await saveWordsApi(toSave);

      // Update word statuses locally
      set((state) => ({
        words: state.words.map((w) =>
          selectedWordIds.has(w.word) ? { ...w, status: 'saved' } : w
        ),
        selectedWordIds: new Set(),
        saving: false,
      }));

      get().showNotification('success', result.message);
      await get().loadVocab();
    } catch (err) {
      set({ saving: false });
      get().showNotification('error', 'Failed to save words.');
    }
  },
}));

export default useAppStore;
