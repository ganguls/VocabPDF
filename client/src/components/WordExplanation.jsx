import React, { useEffect, useState } from 'react';
import { explainWord as fetchExplanation } from '../api/aiApi';

export default function WordExplanation({ word, onClose }) {
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const explain = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchExplanation(word);
        if (active) {
          setExplanation(result);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          console.error(err);
          setError('Failed to load deep explanation. Please try again.');
          setLoading(false);
        }
      }
    };

    explain();

    return () => { active = false; };
  }, [word]);

  return (
    <div className="word-explanation-container">
      <div className="explanation-header">
        <button className="back-btn" onClick={onClose}>
          ← Back to List
        </button>
        <span className="explanation-title">Word Dive</span>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="ai-loader">
            <div className="pulse-ring"></div>
            <span className="loader-icon">🧠</span>
          </div>
          <p>Generating deep context...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={() => fetchExplanation(word)}>Retry</button>
        </div>
      )}

      {!loading && !error && explanation && (
        <div className="explanation-content">
          <div className="word-hero">
            <h1>{explanation.word}</h1>
            {explanation.partOfSpeech && <span className="pos-badge">{explanation.partOfSpeech}</span>}
          </div>

          <div className="meaning-block">
            <h3>English Meaning</h3>
            <p>{explanation.explanation_en}</p>
          </div>

          <div className="meaning-block">
            <h3>Sinhala Meaning (සිංහල තේරුම)</h3>
            <p>{explanation.explanation_si}</p>
          </div>

          {explanation.examples && explanation.examples.length > 0 && (
            <div className="examples-block">
              <h3>Examples in Context</h3>
              <ul className="examples-list">
                {explanation.examples.map((ex, idx) => (
                  <li key={idx}>
                    <p className="ex-en">{ex.en}</p>
                    <p className="ex-si">{ex.si}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {explanation.synonyms && explanation.synonyms.length > 0 && (
            <div className="synonyms-block">
              <h3>Synonyms</h3>
              <div className="synonyms-list">
                {explanation.synonyms.map(syn => (
                  <span key={syn} className="synonym-tag">{syn}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
