import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, message, Modal } from 'antd';
import {
  CheckCircleOutlined,
  CloseOutlined,
  ReloadOutlined,
  RollbackOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import resourceLibraryService from '../services/resourceLibrary.service';
import LibraryAdvancedFilters, { defaultLibraryFilters, matchesLibraryFilters } from '../components/resourceLibrary/LibraryAdvancedFilters';
import './FlashcardsPage.css';

const isVideoResource = (r) => String(r?.type || '').toUpperCase() === 'VIDEO' || String(r?.fileMime || '').startsWith('video');

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const stars = (rating = 0) => '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);

const formatSizeKB = (size) => {
  if (!size) return '—';
  return `${(size / 1024).toFixed(1)} KB`;
};

const FlashcardsPage = ({ resources = [], onBackToResources }) => {
  const sources = useMemo(
    () =>
      (resources || [])
        .filter((r) => !isVideoResource(r))
        .filter((r) => ['PDF', 'PPT', 'NOTES'].includes(String(r?.type || '').toUpperCase()))
        .sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''))),
    [resources]
  );

  const [docFilters, setDocFilters] = useState(() => ({ ...defaultLibraryFilters }));
  const [selectedSourceIds, setSelectedSourceIds] = useState([]);
  const [cardCount, setCardCount] = useState(20);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [modalCardCount, setModalCardCount] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [deck, setDeck] = useState(null);
  const [deckMeta, setDeckMeta] = useState(null);

  const [queue, setQueue] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [masteredIds, setMasteredIds] = useState(() => new Set());
  const [streak, setStreak] = useState(0);
  const flipAreaRef = useRef(null);

  const programmeFilterOptions = useMemo(() => {
    const m = new Map();
    sources.forEach((r) => {
      if (r.programmeId && r.programmeName) m.set(r.programmeId, r.programmeName);
    });
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label }));
  }, [sources]);

  const moduleFilterOptions = useMemo(() => {
    const map = new Map();
    sources.forEach((r) => {
      if (docFilters.programmeId && String(r.programmeId) !== String(docFilters.programmeId)) return;
      if (r.moduleId && r.moduleName) map.set(r.moduleId, r.moduleName);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label }));
  }, [sources, docFilters.programmeId]);

  const filteredSources = useMemo(
    () => sources.filter((s) => matchesLibraryFilters(s, docFilters, { includeType: true })),
    [sources, docFilters]
  );

  const totalCards = deck?.cards?.length || 0;
  const currentCardId = queue?.[0] ?? null;
  const currentCard = useMemo(() => {
    if (!deck?.cards?.length) return null;
    const byId = new Map(deck.cards.map((c) => [c.id, c]));
    return currentCardId ? byId.get(currentCardId) || null : null;
  }, [deck, currentCardId]);

  const storageKey = useMemo(() => {
    const ids = [...selectedSourceIds].sort().join('_');
    return `studySmart_flashcards_deck_${ids}_${cardCount}`;
  }, [selectedSourceIds, cardCount]);

  useEffect(() => {
    if (!selectedSourceIds.length) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.title && Array.isArray(parsed?.cards)) {
        setDeck(parsed);
        setDeckMeta(parsed?.meta || null);
        setQueue(parsed.cards.map((c) => c.id));
        setShowAnswer(false);
        setMasteredIds(new Set());
        setStreak(0);
      }
    } catch {
      // ignore
    }
  }, [storageKey, selectedSourceIds.length]);

  const toggleSelected = (id) => {
    setSelectedSourceIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return [...set];
    });
  };

  const openGenerateModal = () => {
    if (!selectedSourceIds.length) {
      message.warning('Select at least one document source to generate flashcards.');
      return;
    }
    setModalCardCount(cardCount);
    setGenerateModalOpen(true);
  };

  const generateDeck = async (countOverride) => {
    const effectiveCount = Number(countOverride ?? cardCount);
    if (!Number.isFinite(effectiveCount) || effectiveCount < 1) {
      message.warning('Choose a valid number of flashcards.');
      return;
    }

    if (!selectedSourceIds.length) {
      message.warning('Select at least one document source to generate flashcards.');
      return;
    }

    setGenerateModalOpen(false);
    setStudyModalOpen(false);
    setIsGenerating(true);
    setShowAnswer(false);

    try {
      const res = await resourceLibraryService.generateFlashcards({
        resourceIds: selectedSourceIds,
        cardCount: effectiveCount,
      });
      const generatedData = res?.data || {};
      if (!generatedData?.cards?.length) {
        throw new Error('No flashcards returned. Try again with different sources.');
      }
      const generated = {
        title: generatedData.title || 'Flashcards Deck',
        cards: generatedData.cards || [],
      };
      const cardsWithIds = generated.cards.map((c, idx) => ({
        ...c,
        id: c.id || `${idx}_${String(c.front || '').slice(0, 24)}`,
      }));
      const resourceIdsSorted = [...selectedSourceIds].sort();
      setCardCount(effectiveCount);
      setDeck({ title: generated.title, cards: cardsWithIds });
      setDeckMeta({ resourceIdsSorted, cardCount: effectiveCount });
      setQueue(shuffle(cardsWithIds.map((c) => c.id)));
      setShowAnswer(false);
      setMasteredIds(new Set());
      setStreak(0);

      const idsKey = [...selectedSourceIds].sort().join('_');
      const storageKeyNow = `studySmart_flashcards_deck_${idsKey}_${effectiveCount}`;
      localStorage.setItem(
        storageKeyNow,
        JSON.stringify({
          title: generated.title,
          cards: cardsWithIds,
          meta: { resourceIdsSorted, cardCount: effectiveCount },
        })
      );
      setStudyModalOpen(true);
      message.success('Deck ready.');
    } catch (e) {
      message.error(e?.response?.data?.message || e?.message || 'Flashcard generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedResourceIdsSorted = useMemo(() => [...selectedSourceIds].sort(), [selectedSourceIds]);
  const deckMatchesSelection =
    !!deckMeta &&
    deckMeta.cardCount === cardCount &&
    Array.isArray(deckMeta.resourceIdsSorted) &&
    deckMeta.resourceIdsSorted.join('|') === selectedResourceIdsSorted.join('|');

  useEffect(() => {
    if (!deckMatchesSelection) setStudyModalOpen(false);
  }, [deckMatchesSelection]);

  const onMark = (mark) => {
    if (!currentCardId) return;

    if (mark === 'gotIt') {
      setMasteredIds((prev) => {
        const next = new Set(prev);
        next.add(currentCardId);
        return next;
      });
      setStreak((s) => s + 1);
      setQueue((q) => (q?.length ? q.slice(1) : []));
      setShowAnswer(false);
      return;
    }

    if (mark === 'needReview') {
      setStreak(0);
      setQueue((q) => {
        if (!q?.length) return [];
        const [, ...rest] = q;
        return [...rest, currentCardId];
      });
      setShowAnswer(false);
    }
  };

  const restartSession = () => {
    if (!deck?.cards?.length) return;
    setQueue(shuffle(deck.cards.map((c) => c.id)));
    setShowAnswer(false);
    setMasteredIds(new Set());
    setStreak(0);
  };

  useEffect(() => {
    if (!deck?.cards?.length || !deckMatchesSelection || !studyModalOpen) return undefined;

    const onKeyDown = (e) => {
      const key = String(e.key || '');
      if (key === ' ' || key === 'Spacebar') {
        e.preventDefault();
        setShowAnswer((v) => !v);
      } else if (key === '1') {
        if (showAnswer) onMark('gotIt');
      } else if (key === '2') {
        if (showAnswer) onMark('needReview');
      } else if (key === 'Escape') {
        setShowAnswer(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deck?.cards?.length, showAnswer, deckMatchesSelection, studyModalOpen]);

  const progressPercent = totalCards ? Math.round((masteredIds.size / totalCards) * 100) : 0;
  const remainingInQueue = queue?.length || 0;
  const sessionCardIndex =
    totalCards > 0 && remainingInQueue > 0 ? totalCards - remainingInQueue + 1 : null;

  const canOpenStudy = !!(deck?.cards?.length && deckMatchesSelection);

  const studyBody =
    canOpenStudy && queue.length > 0 ? (
      <>
        <div className="fc-flash-study-hint-wrap">
          <p className="fc-flash-study-hint">Tap the card to flip</p>
        </div>

        <div className="fc-flash-stage">
          <div
            ref={flipAreaRef}
            className={`fc-flash-flip${showAnswer ? ' fc-flash-flip--answer' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => setShowAnswer((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowAnswer((v) => !v);
              }
            }}
          >
            <div className="fc-flash-flip__inner">
              <div className="fc-flash-flip__face fc-flash-flip__face--front">
                <span className="fc-flash-flip__badge">Question</span>
                <p className="fc-flash-flip__text">{currentCard?.front || ''}</p>
              </div>
              <div className="fc-flash-flip__face fc-flash-flip__face--back">
                <span className="fc-flash-flip__badge fc-flash-flip__badge--answer">Answer</span>
                <p className="fc-flash-flip__text">{currentCard?.back || ''}</p>
                {currentCard?.hint ? (
                  <div className="fc-flash-flip__hint">
                    <span className="fc-flash-flip__hint-lab">Hint</span>
                    {currentCard.hint}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="fc-flash-actions-shell">
          <div className="fc-flash-actions">
            <Button
              className="fc-flash-actions-btn"
              disabled={!currentCard}
              onClick={() => setShowAnswer((v) => !v)}
            >
              {showAnswer ? 'Show question' : 'Show answer'}
            </Button>
            <Button
              type="primary"
              className="fc-flash-actions-btn"
              disabled={!showAnswer || !currentCard}
              onClick={() => onMark('gotIt')}
              icon={<CheckCircleOutlined />}
            >
              I knew this
            </Button>
            <Button
              danger
              className="fc-flash-actions-btn"
              disabled={!showAnswer || !currentCard}
              onClick={() => onMark('needReview')}
              icon={<RollbackOutlined />}
            >
              Study again later
            </Button>
          </div>
        </div>
      </>
    ) : canOpenStudy && queue.length === 0 ? (
      <div className="fc-flash-done">
        <div className="fc-flash-done__icon" aria-hidden>
          ✓
        </div>
        <h2 className="fc-flash-done__title">Round finished</h2>
        <p className="fc-flash-done__text">
          You marked <strong>{masteredIds.size}</strong> of <strong>{totalCards}</strong> cards as known.
        </p>
        <Button type="primary" onClick={restartSession}>
          Shuffle &amp; run again
        </Button>
      </div>
    ) : null;

  return (
    <div className="notes-collab-wrap fc-flash-page">
      {isGenerating ? (
        <div className="fc-flash-loading" aria-live="polite" aria-busy="true">
          <div className="fc-flash-loading__panel">
            <div className="fc-flash-loading__spinner" aria-hidden />
            <p className="fc-flash-loading__title">Building your deck</p>
            <p className="fc-flash-loading__sub">Reading your documents and creating cards…</p>
          </div>
        </div>
      ) : null}

      <Modal
        title="Generate flashcards"
        open={generateModalOpen}
        onCancel={() => !isGenerating && setGenerateModalOpen(false)}
        footer={
          <div className="fc-flash-generate-modal__footer">
            <Button
              type="default"
              className="fc-flash-generate-cancel"
              onClick={() => setGenerateModalOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              className="fc-flash-generate-primary"
              loading={isGenerating}
              onClick={() => generateDeck(modalCardCount)}
            >
              Generate
            </Button>
          </div>
        }
        centered
        destroyOnHidden
        wrapClassName="fc-flash-generate-modal-wrap"
        width={420}
        maskClosable={!isGenerating}
      >
        <div className="fc-flash-generate-modal__body">
          <p className="fc-flash-generate-modal__label">How many cards should we create from your selection?</p>
          <div className="fc-flash-dock-sizes fc-flash-generate-modal__sizes" role="group" aria-label="Number of flashcards">
            {[10, 20, 30, 40].map((n) => (
              <button
                key={n}
                type="button"
                className={`fc-flash-size${modalCardCount === n ? ' fc-flash-size--on' : ''}`}
                onClick={() => setModalCardCount(n)}
                disabled={isGenerating}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title={null}
        open={studyModalOpen && canOpenStudy}
        onCancel={() => setStudyModalOpen(false)}
        footer={null}
        width={720}
        centered
        destroyOnHidden
        closable={false}
        wrapClassName="fc-flash-modal-wrap"
        className="fc-flash-modal"
        maskClosable={!isGenerating}
      >
        <Card className="notes-editor-card fc-flash-modal-card">
          <div className="notes-editor-top fc-flash-modal-top">
            <Button
              type="text"
              className="fc-flash-modal-close"
              icon={<CloseOutlined />}
              onClick={() => setStudyModalOpen(false)}
              aria-label="Close flashcard deck"
            />
            <div className="fc-flash-modal-meta">
              <span className="fc-flash-modal-deck">{deck?.title}</span>
              {queue.length > 0 ? (
                <span className="fc-flash-modal-stats">
                  Card {sessionCardIndex}/{totalCards} · Left {remainingInQueue} · Streak {streak}
                </span>
              ) : (
                <span className="fc-flash-modal-stats">Complete</span>
              )}
            </div>
            <Button className="fc-flash-modal-tool" icon={<ReloadOutlined />} onClick={restartSession}>
              Shuffle
            </Button>
            <Button
              type="primary"
              className="fc-flash-modal-tool fc-flash-generate-primary"
              onClick={openGenerateModal}
              disabled={isGenerating}
            >
              New deck
            </Button>
          </div>
          <div className="fc-flash-modal-progress" aria-hidden="true">
            <div className="fc-flash-modal-progress__fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="fc-flash-modal-body">{studyBody}</div>
        </Card>
      </Modal>

      <div className="notes-gallery-wrap">
        <div className="notes-collab-left-head">
          <div className="fc-flash-head-left">
            {onBackToResources ? (
              <Button className="notes-back-btn" onClick={onBackToResources}>
                Back
              </Button>
            ) : null}
            <h3>Flashcards</h3>
          </div>
          <Button
            type="primary"
            className="fc-flash-generate-primary"
            onClick={openGenerateModal}
            disabled={isGenerating || !selectedSourceIds.length}
          >
            Generate deck
          </Button>
        </div>

        <LibraryAdvancedFilters
          variant="flashcards"
          filters={docFilters}
          onChange={setDocFilters}
          onClear={() => setDocFilters({ ...defaultLibraryFilters })}
          programmeOptions={programmeFilterOptions}
          moduleOptions={moduleFilterOptions}
        />

        <div className="notes-gallery-grid">
          {filteredSources.length ? (
            filteredSources.map((n) => {
              const selected = selectedSourceIds.includes(n.id);
              const typeKey = String(n.type || 'notes').toLowerCase();
              return (
                <article
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  className={`note-tile rl-card rl-card--no-cover${selected ? ' active' : ''}`}
                  onClick={() => toggleSelected(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSelected(n.id);
                    }
                  }}
                >
                  <div className="note-card-top">
                    <span className={`rl-type-badge type-${typeKey}`}>{n.type || 'NOTES'}</span>
                  </div>
                  <div className="rl-content note-content">
                    <div className="tile-card-head">
                      <div className="tile-card-head-main">
                        <div className="tile-programme">{n.programmeName ? String(n.programmeName).toUpperCase() : '—'}</div>
                        <div className="tile-module">Module: {n.moduleName || '—'}</div>
                      </div>
                      <div className="tile-side-meta">
                        <div className="tile-rating">{stars(n.rating || 0)}</div>
                        <span className={`tile-difficulty ${String(n.difficulty || 'Medium').toLowerCase()}`}>
                          {n.difficulty || 'Medium'}
                        </span>
                      </div>
                    </div>
                    <h4 className="tile-title-link">{n.title}</h4>
                    <p className="tile-desc">{n.description || ''}</p>
                    <div className="tile-divider" />
                    <div className="tile-meta">
                      <span>{formatSizeKB(n.fileSize)}</span>
                      <span>
                        <EyeOutlined /> {n.views ?? 0}
                      </span>
                      <span>
                        <DownloadOutlined /> {n.downloads || 0}
                      </span>
                      <span className="tile-meta-open-slot" aria-hidden="true" />
                    </div>
                    <div className="tile-footer">
                      <div className="tile-footer-author">
                        <span className="tile-avatar">{(n.authorName || 'U').charAt(0)}</span>
                        <span className="tile-author">{n.authorName || '—'}</span>
                      </div>
                      <span className="tile-tag-badge">
                        {(n.tags && n.tags[0]) ? String(n.tags[0]) : '—'}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="fc-flash-empty-grid">
              <p>No matching documents.</p>
              <p className="fc-flash-empty-grid__sub">
                Upload PDF, PPT, or Notes from Resources, or adjust the filters above.
              </p>
            </div>
          )}
        </div>
      </div>

      {deck?.cards?.length && !deckMatchesSelection ? (
        <div className="fc-flash-alert" role="status">
          <strong>Deck is out of sync.</strong> Generate again to match your current selection and card count.
        </div>
      ) : null}
    </div>
  );
};

export default FlashcardsPage;
