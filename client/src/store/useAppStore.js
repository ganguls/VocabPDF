import { create } from 'zustand';
import { processText as processTextApi } from '../api/aiApi';
import { getVocab, checkWords as checkWordsApi, saveWords as saveWordsApi } from '../api/vocabApi';

const useAppStore = create((set, get) => ({
  // PDF state
  pdfFile: null,
  numPages: 0,
  currentPage: 1,

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
  
  // --- Actions ---

  setPdfFile: (file) => set({ pdfFile: file }),
  setNumPages: (n) => set({ numPages: n }),
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
