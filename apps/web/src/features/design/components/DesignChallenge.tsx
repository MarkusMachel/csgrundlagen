import { ReactFlowProvider } from '@xyflow/react';
import { ArrowLeft, CircleCheck, CircleX, LayoutGrid, Send, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  gradeDesign,
  offendingEdges,
  useQuestionMaterials,
  useSubmitAnswer,
  type DesignKind,
  type DesignQuestion,
  type DesignResult,
} from '@/features/questions';
import { isSignInCancelled } from '@/stores/useAuthPrompt';

import { addNode, autoLayout, loadDraft, saveDraft, toGraph, type BoardState } from '../board';
import { BoardLists } from './BoardLists';
import { DesignCanvas } from './DesignCanvas';
import { DesignResults } from './DesignResults';
import { Palette } from './Palette';
import { ReferenceDiagram } from './ReferenceDiagram';

/** A challenge: the brief, the drawing board and, once checked, the results. */
export function DesignChallenge({ question }: { question: DesignQuestion }) {
  const { t } = useTranslation();
  const [board, setBoard] = useState<BoardState>(() => loadDraft(question.id));
  const [view, setView] = useState<'mine' | 'reference'>('mine');
  const [fitKey, setFitKey] = useState(0);
  const refit = () => setFitKey((n) => n + 1);
  // the design the shown result belongs to; editing after a check makes it stale
  const [checked, setChecked] = useState<{ board: BoardState; result: DesignResult } | null>(null);
  const submit = useSubmitAnswer(question.id, question);
  const { data: materials = [] } = useQuestionMaterials(question.id);

  useEffect(() => saveDraft(question.id, board), [question.id, board]);

  const stale = checked !== null && checked.board !== board;
  const result = checked && !stale ? checked.result : null;
  const badEdges = useMemo(
    () => (result ? offendingEdges(question.design, toGraph(board), result) : []),
    [result, question.design, board],
  );

  const add = (kind: DesignKind) => {
    // new components land in a free spot to the right of what's there
    const x = board.nodes.length ? Math.max(...board.nodes.map((n) => n.x)) + 200 : 0;
    const y = (board.nodes.length % 4) * 90;
    setBoard(addNode(board, kind, x, y));
    refit();
  };
  const tidy = () => {
    const pos = autoLayout(board);
    setBoard({ ...board, nodes: board.nodes.map((n) => ({ ...n, ...pos.get(n.id) })) });
    refit();
  };
  const check = () => {
    const graph = toGraph(board);
    const snapshot = board;
    submit.mutate(graph, {
      // the server grades too; the local result is the same and works offline
      onSuccess: (res) =>
        setChecked({ board: snapshot, result: res.design ?? gradeDesign(question.design, graph) }),
    });
  };
  const requirementState = (id: string) => {
    if (!result) return undefined;
    const rules = question.design.rules.filter((r) => r.requirement === id && !r.optional);
    return rules.every((r) => result.rules.find((x) => x.id === r.id)?.passed);
  };

  return (
    <div className="design-challenge">
      <Link to="/design" className="design-challenge__back">
        <ArrowLeft size={14} aria-hidden /> {t('design.backToList')}
      </Link>
      <header className="design-brief">
        <h1 style={{ margin: 0 }}>
          <span className="tok-com">{'// '}</span>
          {question.prompt}
        </h1>
        {question.difficulty && (
          <span className="design-difficulty">
            {t(`question.difficulty.${question.difficulty}`)}
          </span>
        )}
        <h2 className="design-panel__title">{t('design.requirements')}</h2>
        <ul className="design-brief__requirements">
          {question.design.requirements.map((req) => {
            const ok = requirementState(req.id);
            return (
              <li key={req.id}>
                {ok === true && (
                  <CircleCheck
                    size={15}
                    aria-label={t('design.results.passed')}
                    className="tok-green"
                  />
                )}
                {ok === false && (
                  <CircleX size={15} aria-label={t('design.results.failed')} className="tok-red" />
                )}
                {req.text}
              </li>
            );
          })}
        </ul>
        <p className="tok-com design-brief__hint">
          {'// '}
          {t('design.board.hint')}
        </p>
      </header>

      {checked && (
        <div
          className="filters__group design-challenge__views"
          role="group"
          aria-label={t('design.view')}
        >
          <button
            type="button"
            className="toggle-chip"
            aria-pressed={view === 'mine'}
            onClick={() => setView('mine')}
          >
            {t('design.mine')}
          </button>
          <button
            type="button"
            className="toggle-chip"
            aria-pressed={view === 'reference'}
            onClick={() => setView('reference')}
          >
            {t('design.reference')}
          </button>
        </div>
      )}

      {view === 'reference' && checked ? (
        <div className="design-reference">
          <ReferenceDiagram graph={question.design.reference} label={t('design.reference')} />
          <p className="design-reference__explanation">{question.explanation}</p>
        </div>
      ) : (
        <div className="design-workspace">
          <Palette onAdd={add} />
          <div className="design-workspace__main">
            <ReactFlowProvider>
              <DesignCanvas
                board={board}
                onChange={setBoard}
                badEdges={badEdges}
                label={t('design.board.label')}
                fitKey={fitKey}
              />
            </ReactFlowProvider>
            <div className="design-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={check}
                disabled={board.nodes.length === 0 || submit.isPending}
              >
                <Send size={15} aria-hidden />{' '}
                {stale || checked ? t('design.checkAgain') : t('design.check')}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={tidy}
                disabled={board.nodes.length < 2}
              >
                <LayoutGrid size={15} aria-hidden /> {t('design.tidy')}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={board.nodes.length === 0}
                onClick={() => {
                  if (window.confirm(t('design.clearConfirm'))) {
                    setBoard({ nodes: [], edges: [] });
                    setChecked(null);
                  }
                }}
              >
                <Trash2 size={15} aria-hidden /> {t('design.clear')}
              </button>
              {stale && <span className="muted design-actions__stale">{t('design.stale')}</span>}
              {submit.isError && !isSignInCancelled(submit.error) && (
                <span className="field-error-text">{t('design.checkFailed')}</span>
              )}
            </div>
          </div>
          <BoardLists board={board} onChange={setBoard} />
        </div>
      )}

      {result && <DesignResults question={question} result={result} materials={materials} />}
    </div>
  );
}
