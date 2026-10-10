import { ArrowRight, Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { BrandMark } from '@/shared/ui';

/** Decorative: a question being answered, as code (the {✓} idea in action). */
function SnippetWindow() {
  const lines: ReactNode[] = [
    <>
      <span className="tok-kw">const</span> q = <span className="tok-fn">ask</span>(
      <span className="tok-str">&quot;Which OSI layer delivers end to end?&quot;</span>);
    </>,
    <>
      q.options = [<span className="tok-str">&quot;Network&quot;</span>,{' '}
      <span className="tok-str">&quot;Transport&quot;</span>,{' '}
      <span className="tok-str">&quot;Session&quot;</span>];
    </>,
    <>&nbsp;</>,
    <>
      q.<span className="tok-fn">answer</span>(
      <span className="tok-str">&quot;Transport&quot;</span>
      );
    </>,
    <span className="auth-snippet__result">
      <Check size={13} aria-hidden /> correct{' '}
      <span className="tok-com">· next review in 4 days</span>
    </span>,
  ];
  return (
    <div className="auth-snippet" aria-hidden>
      <div className="auth-snippet__bar">
        <span className="auth-snippet__dot" />
        <span className="auth-snippet__dot" />
        <span className="auth-snippet__dot" />
        <span className="auth-snippet__file">practice.cs</span>
      </div>
      <ol className="auth-snippet__code">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The signed-out screens (sign in, sign up, password reset): the brand panel
 * beside the form. On narrow screens the panel shrinks to a header.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="auth-layout">
      <aside className="auth-brand">
        <Link to="/" className="auth-brand__name">
          <BrandMark size={40} />
          <span>{t('common.appName')}</span>
        </Link>
        <p className="auth-brand__tagline">{t('auth.brand.tagline')}</p>
        <SnippetWindow />
        <ul className="auth-brand__features">
          {(['f1', 'f2', 'f3'] as const).map((k) => (
            <li key={k}>
              <Check size={15} aria-hidden className="auth-brand__check" />
              {t(`auth.brand.${k}`)}
            </li>
          ))}
        </ul>
        <Link to="/" className="auth-brand__browse">
          {t('auth.brand.browse')} <ArrowRight size={14} aria-hidden />
        </Link>
      </aside>
      <main className="auth-main">
        <div className="login-card">{children}</div>
      </main>
    </div>
  );
}
