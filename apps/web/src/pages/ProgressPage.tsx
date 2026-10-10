import { CalendarClock, Flame, Target, Telescope } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useProgress, type TagProgress } from '@/features/progress';
import { ErrorState, Spinner } from '@/shared/ui';

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export function ProgressPage() {
  const { t, i18n } = useTranslation();
  const { data, isPending, isError, refetch } = useProgress();

  if (isPending) return <Spinner center />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const { totals } = data;
  const day = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(i18n.language, opts);
  const maxActivity = Math.max(1, ...data.activity.map((d) => d.answers));
  const maxUpcoming = Math.max(1, ...data.upcoming.map((d) => d.count));
  // Topics you've started first, then by how much is left to cover.
  const topics = [...data.byTag].sort(
    (a, b) =>
      Number(b.seen > 0) - Number(a.seen > 0) ||
      pct(a.seen, a.questions) - pct(b.seen, b.questions),
  );

  return (
    <div className="stack" style={{ gap: 24 }}>
      <h1 style={{ margin: 0 }}>
        <span className="tok-com">{'// '}</span>
        {t('progress.title')}
      </h1>

      <div className="progress-tiles">
        <Tile
          icon={<Telescope size={18} aria-hidden />}
          label={t('progress.covered')}
          value={`${totals.seen} / ${totals.questions}`}
          sub={t('progress.percentOfBank', { pct: pct(totals.seen, totals.questions) })}
        />
        <Tile
          icon={<Target size={18} aria-hidden />}
          label={t('progress.accuracy')}
          value={totals.answers > 0 ? `${pct(totals.correct, totals.answers)}%` : '—'}
          sub={t('progress.answersCount', { count: totals.answers })}
        />
        <Tile
          icon={<CalendarClock size={18} aria-hidden />}
          label={t('progress.dueNow')}
          value={String(totals.dueNow)}
          sub={
            totals.dueNow > 0 ? (
              <Link to="/review">{t('progress.startReview')}</Link>
            ) : (
              t('progress.nothingDue')
            )
          }
        />
        <Tile
          icon={<Flame size={18} aria-hidden />}
          label={t('progress.streak')}
          value={t('progress.days', { count: totals.streakDays })}
          sub={t('progress.streakHint')}
        />
      </div>

      <section className="card stack" style={{ gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t('progress.activity')}</h2>
        <div className="day-bars" role="img" aria-label={t('progress.activityLabel')}>
          {data.activity.map((d) => (
            <div
              key={d.date}
              className="day-bars__col"
              title={`${day(d.date, { day: 'numeric', month: 'short' })}: ${t('progress.answersCount', { count: d.answers })}, ${d.correct} ✓`}
            >
              <span
                className="day-bars__bar"
                style={{ height: `${(d.answers / maxActivity) * 100}%` }}
              >
                <span
                  className="day-bars__correct"
                  style={{ height: d.answers > 0 ? `${(d.correct / d.answers) * 100}%` : 0 }}
                />
              </span>
            </div>
          ))}
        </div>
        <div className="day-bars__axis">
          <span>{day(data.activity[0].date, { day: 'numeric', month: 'short' })}</span>
          <span className="legend">
            <span className="legend__swatch legend__swatch--correct" /> {t('progress.correct')}
            <span className="legend__swatch" /> {t('progress.wrong')}
          </span>
          <span>{t('progress.today')}</span>
        </div>
      </section>

      <section className="card stack" style={{ gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t('progress.upcoming')}</h2>
        <div className="week-bars">
          {data.upcoming.map((d, i) => (
            <div key={d.date} className="week-bars__col">
              <span className="week-bars__count">{d.count}</span>
              <span
                className="week-bars__bar"
                style={{ height: `${(d.count / maxUpcoming) * 100}%` }}
              />
              <span className="week-bars__day">
                {i === 0 ? t('progress.today') : day(d.date, { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="stack" style={{ gap: 10 }}>
        <h2 style={{ margin: 0 }}>{t('progress.byTopic')}</h2>
        <table className="topic-table">
          <thead>
            <tr>
              <th scope="col">{t('progress.topic')}</th>
              <th scope="col">{t('progress.covered')}</th>
              <th scope="col">{t('progress.accuracy')}</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((tp) => (
              <TopicRow key={tp.tag} topic={tp} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: React.ReactNode;
}) {
  return (
    <div className="card progress-tile">
      <span className="progress-tile__label">
        {icon}
        {label}
      </span>
      <span className="progress-tile__value">{value}</span>
      <span className="progress-tile__sub">{sub}</span>
    </div>
  );
}

function TopicRow({ topic }: { topic: TagProgress }) {
  const { t } = useTranslation();
  const coverage = pct(topic.seen, topic.questions);
  const accuracy = pct(topic.correct, topic.answers);
  return (
    <tr>
      <th scope="row">{topic.tag}</th>
      <td>
        <span className="meter" aria-hidden>
          <span style={{ width: `${coverage}%` }} />
        </span>
        <span className="meter__text">
          {topic.seen}/{topic.questions}
        </span>
      </td>
      <td>
        {topic.answers > 0 ? (
          <>
            <span className={`meter ${accuracy < 60 ? 'meter--weak' : 'meter--good'}`} aria-hidden>
              <span style={{ width: `${accuracy}%` }} />
            </span>
            <span className="meter__text">{accuracy}%</span>
          </>
        ) : (
          <span className="muted">{t('progress.notStarted')}</span>
        )}
      </td>
    </tr>
  );
}
