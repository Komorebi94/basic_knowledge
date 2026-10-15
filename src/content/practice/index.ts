import { asyncExercises } from './async';
import { dataExercises } from './data';
import { functionsExercises } from './functions';
import { p1Exercises } from './p1';
import type { Exercise } from './types';

export const exercises: readonly Exercise[] = [...asyncExercises, ...dataExercises, ...functionsExercises, ...p1Exercises].sort((a,b) => a.id.localeCompare(b.id));
export const practiceExercises = exercises;
export function getExercise(id: string): Exercise | undefined {
  return exercises.find(exercise => exercise.id === id);
}
export type { Exercise, ExerciseTestCase } from './types';
