import { ArrowLeftRight, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  canConnect,
  connect,
  disconnect,
  removeNode,
  reverse,
  type BoardNode,
  type BoardState,
} from '../board';
import { KIND_ICON } from '../kinds';

/**
 * The board as lists: rename or remove components and add, flip or remove
 * arrows. Works with a keyboard and screen readers, and on small screens
 * where dragging is fiddly.
 */
export function BoardLists({
  board,
  onChange,
  readOnly,
}: {
  board: BoardState;
  onChange: (next: BoardState) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const ids = { from: useId(), to: useId() };
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const name = (n: BoardNode | undefined) =>
    n ? n.label?.trim() || t(`design.kinds.${n.kind}`) : '?';
  const byId = (id: string) => board.nodes.find((n) => n.id === id);
  // two components of a kind need telling apart in the menus
  const optionName = (n: BoardNode) =>
    board.nodes.filter((m) => name(m) === name(n)).length > 1 ? `${name(n)} (${n.id})` : name(n);

  return (
    <div className="design-lists">
      <section aria-labelledby="design-components-title">
        <h2 id="design-components-title" className="design-panel__title">
          {t('design.lists.components', { count: board.nodes.length })}
        </h2>
        {board.nodes.length === 0 ? (
          <p className="muted design-lists__empty">{t('design.lists.noComponents')}</p>
        ) : (
          <ul className="design-lists__list">
            {board.nodes.map((n) => {
              const Icon = KIND_ICON[n.kind];
              return (
                <li key={n.id} className="design-lists__row">
                  <Icon size={15} aria-hidden />
                  <input
                    className="input input--small"
                    value={n.label ?? ''}
                    placeholder={t(`design.kinds.${n.kind}`)}
                    aria-label={t('design.lists.rename', { name: optionName(n) })}
                    maxLength={40}
                    disabled={readOnly}
                    onChange={(e) =>
                      onChange({
                        ...board,
                        nodes: board.nodes.map((m) =>
                          m.id === n.id ? { ...m, label: e.target.value } : m,
                        ),
                      })
                    }
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      className="btn btn--icon btn--small"
                      aria-label={t('design.lists.remove', { name: optionName(n) })}
                      onClick={() => onChange(removeNode(board, n.id))}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="design-connections-title">
        <h2 id="design-connections-title" className="design-panel__title">
          {t('design.lists.connections', { count: board.edges.length })}
        </h2>
        {board.edges.length > 0 && (
          <ul className="design-lists__list">
            {board.edges.map((e) => {
              const label = `${name(byId(e.from))} → ${name(byId(e.to))}`;
              return (
                <li key={`${e.from}-${e.to}`} className="design-lists__row">
                  <span className="design-lists__edge">
                    {name(byId(e.from))} <ArrowRight size={13} aria-hidden /> {name(byId(e.to))}
                  </span>
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        className="btn btn--icon btn--small"
                        aria-label={t('design.lists.reverse', { edge: label })}
                        onClick={() => onChange(reverse(board, e.from, e.to))}
                      >
                        <ArrowLeftRight size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn btn--icon btn--small"
                        aria-label={t('design.lists.disconnect', { edge: label })}
                        onClick={() => onChange(disconnect(board, e.from, e.to))}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {!readOnly && board.nodes.length >= 2 && (
          <form
            className="design-lists__connect"
            onSubmit={(e) => {
              e.preventDefault();
              onChange(connect(board, from, to));
              setTo('');
            }}
          >
            <label htmlFor={ids.from}>{t('design.lists.from')}</label>
            <select
              id={ids.from}
              className="input input--small"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              <option value="">—</option>
              {board.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {optionName(n)}
                </option>
              ))}
            </select>
            <label htmlFor={ids.to}>{t('design.lists.to')}</label>
            <select
              id={ids.to}
              className="input input--small"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              <option value="">—</option>
              {board.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {optionName(n)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn btn--small"
              disabled={!canConnect(board, from, to)}
            >
              <Plus size={14} aria-hidden /> {t('design.lists.connect')}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
