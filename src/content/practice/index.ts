import { asyncExercises } from './async';
import { dataExercises } from './data';
import { functionsExercises } from './functions';
import { p1Exercises } from './p1';
import type { Exercise } from './types';

export const exercises: readonly Exercise[] = [...asyncExercises, ...dataExercises, ...functionsExercises, ...p1Exercises].sort((a,b) => a.id.localeCompare(b.id));
export type { Exercise, ExerciseTestCase } from './types';
