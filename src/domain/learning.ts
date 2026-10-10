import { emptyPersonalLearningState, isPersonalLearningState, normalizePersonalLearningState, type PersonalLearningState } from './personalLearning';
import { emptyReviewState, isReviewState, normalizeReviewState, type ReviewState } from './review';
import { emptyPracticeState, isPracticeState, normalizePracticeState, type PracticeState } from './practice';

export interface LearningState {
  personal: PersonalLearningState;
  review: ReviewState;
  practice: PracticeState;
}

export function emptyLearningState(): LearningState {
  return { personal: emptyPersonalLearningState(), review: emptyReviewState(), practice: emptyPracticeState() };
}

export function isLearningState(value: unknown): value is LearningState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return 'personal' in value && 'review' in value && 'practice' in value
    && isPersonalLearningState(value.personal) && isReviewState(value.review) && isPracticeState(value.practice);
}

export function normalizeLearningState(state: LearningState): LearningState {
  return {
    personal: normalizePersonalLearningState(state.personal),
    review: normalizeReviewState(state.review),
    practice: normalizePracticeState(state.practice),
  };
}
