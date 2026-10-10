import { Lock } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SignInPrompt } from '@/features/auth';
import { Spinner } from '@/shared/ui';
import { useSignedIn } from '@/stores/useAuthStore';

import { useQuestionNote, useSaveQuestionNote } from '../../hooks/useQuestionNote';

/**
 * Private per-user note (§10.6). Deliberately distinct from Comments: labeled
 * private, no author attribution, saved on blur via PUT /questions/:id/notes.
 */
export function MyNotesTab({ questionId }: { questionId: string }) {
  const signedIn = useSignedIn();
  return signedIn ? <NoteEditor questionId={questionId} /> : <SignInPrompt />;
}

function NoteEditor({ questionId }: { questionId: string }) {
  const { t } = useTranslation();
  const noteId = useId();
  const { data: note, isPending } = useQuestionNote(questionId);
  const saveNote = useSaveQuestionNote(questionId);
  const [draft, setDraft] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (note) setDraft(note.body);
  }, [note]);

  if (isPending) return <Spinner />;

  const handleBlur = () => {
    if (draft !== (note?.body ?? '')) {
      saveNote.mutate(draft, {
        onSuccess: () => {
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 2000);
        },
      });
    }
  };

  return (
    <div className="field">
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <span className="tok-com hstack" style={{ gap: 5 }}>
          <Lock size={13} aria-hidden /> {t('question.notes.privacy')}
        </span>
        {savedFlash && (
          <span className="tok-green" role="status" style={{ fontSize: 12 }}>
            {t('question.notes.saved')}
          </span>
        )}
      </div>
      <label htmlFor={noteId}>{t('question.notes.label')}</label>
      <textarea
        id={noteId}
        className="textarea"
        rows={3}
        placeholder={t('question.notes.placeholder')}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
}
