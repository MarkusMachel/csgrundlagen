import type { MaterialItem } from '@/features/materials/types';
import type { DesignQuestion, DesignRule } from '@/features/questions/types';

import type { SeedQuestion } from './questions';
// A copy of apps/api/seeds/system-design.json (the web image can't see the
// API's files); designSeed.test.ts fails if the two drift apart.
import bank from './systemDesign.json';

interface BankRule extends DesignRule {
  materialKey?: string;
}

const materialId = (key: string) => `m-sd-${key}`;

/** The system design challenges, as the Go seed tool would load them. */
export const designSeedQuestions: SeedQuestion[] = bank.questions.map((q, i) => {
  const question: DesignQuestion = {
    id: `q-sd-${i + 1}`,
    type: 'design',
    prompt: q.prompt,
    tags: q.tags,
    difficulty: q.difficulty as DesignQuestion['difficulty'],
    explanation: q.explanation,
    design: {
      requirements: q.design.requirements,
      reference: q.design.reference as DesignQuestion['design']['reference'],
      rules: (q.design.rules as BankRule[]).map(({ materialKey, ...rule }) =>
        materialKey ? { ...rule, materialId: materialId(materialKey) } : rule,
      ),
    },
  };
  return { question };
});

export const designSeedMaterials: MaterialItem[] = bank.materials.map((m) => ({
  id: materialId(m.key),
  type: m.type as MaterialItem['type'],
  title: m.title,
  url: m.url,
  author: m.author,
  description: m.description,
  tags: ['System Design'],
  relatedQuestionIds: bank.questions
    .map((q, i) => (q.materials.includes(m.key) ? `q-sd-${i + 1}` : null))
    .filter((id): id is string => id !== null),
}));
