import { Download, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { ApiError } from '@/shared/api/client';
import { Modal } from '@/shared/ui';

import { PrivacySettingsButton } from './PrivacySettingsButton';
import { useDeleteAccount, useExportMyData } from '../hooks/usePrivacy';

/** Account page: export, privacy settings and account deletion. */
export function YourData() {
  const { t } = useTranslation();
  const exportData = useExportMyData();
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        {t('privacy.yourData.intro')} <Link to="/privacy">{t('privacy.policyLink')}</Link>
      </p>
      <div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn"
          disabled={exportData.isPending}
          onClick={() => exportData.mutate()}
        >
          <Download size={14} aria-hidden />
          {t('privacy.yourData.download')}
        </button>
        <PrivacySettingsButton className="btn" />
        <button type="button" className="btn btn--danger" onClick={() => setDeleting(true)}>
          <Trash2 size={14} aria-hidden />
          {t('privacy.yourData.delete')}
        </button>
      </div>
      {exportData.isError && (
        <div className="alert alert--error" role="alert">
          {t('common.errorTitle')}
        </div>
      )}
      <DeleteAccountDialog open={deleting} onClose={() => setDeleting(false)} />
    </div>
  );
}

const CONFIRM_WORD = 'DELETE';

function DeleteAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const ids = { password: useId(), confirm: useId() };
  const navigate = useNavigate();
  const remove = useDeleteAccount();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const close = () => {
    setPassword('');
    setConfirm('');
    remove.reset();
    onClose();
  };
  const ready = password.length > 0 && confirm.trim() === CONFIRM_WORD;
  const submit = () =>
    remove.mutate(password, { onSuccess: () => navigate('/', { replace: true }) });

  return (
    <Modal
      open={open}
      size="small"
      title={t('privacy.deleteDialog.title')}
      onClose={close}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={close}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            disabled={!ready || remove.isPending}
            onClick={submit}
          >
            {t('privacy.deleteDialog.confirm')}
          </button>
        </>
      }
    >
      <form
        className="stack"
        style={{ gap: 12 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) submit();
        }}
      >
        <p style={{ margin: 0 }}>{t('privacy.deleteDialog.text')}</p>
        {remove.isError && (
          <div className="alert alert--error" role="alert">
            {remove.error instanceof ApiError && remove.error.status < 500
              ? remove.error.message
              : t('common.errorTitle')}
          </div>
        )}
        <div className="field">
          <label htmlFor={ids.password}>{t('auth.password')}</label>
          <input
            id={ids.password}
            type="password"
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={ids.confirm}>
            {t('privacy.deleteDialog.typeWord', { word: CONFIRM_WORD })}
          </label>
          <input
            id={ids.confirm}
            className="input"
            autoComplete="off"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
