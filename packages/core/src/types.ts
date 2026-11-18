// Types for the deadline-mode queue. Spec: doc/tz-01-core-deadline.md.

/** Grades: 1 = "Ще раз", 3 = "Повторити", 5 = "Добре" (spec §3). */
export type Grade = 1 | 3 | 5;

/** Algorithm constants (spec §3). EF values are integer hundredths: 130 = 1.30. */
export interface Params {
  readonly efDelta: Readonly<Record<Grade, number>>;
  readonly efMin: number;
  readonly efStart: number;
  readonly exitStreak: number;
  readonly fillerReturnGrades: readonly Grade[];
}

/** Deck settings (spec §4.2). lessonsPerDay and deadlineLessons are only stored in 0.1.0. */
export interface Settings {
  readonly unitsPerLesson: number;
  readonly lessonsPerDay: number;
  readonly deadlineLessons: number | null;
}

/** Unit state (spec §4.1). */
export interface UnitState {
  readonly itemId: string;
  readonly ef: number;
  readonly lastGrade: Grade | null;
  readonly streak5: number;
  readonly out: boolean;
  readonly lastLesson: number | null;
  readonly tests: number;
}

/**
 * Deck state (spec §4.2).
 * Implementation additions not listed in the spec table:
 * - algorithmVersion and params: record which norm/experiment the deck runs with;
 * - gradedInLesson: needed for the "already graded in this lesson" error (spec §6.3.5).
 */
export interface DeckState {
  readonly algorithmVersion: string;
  readonly params: Params;
  readonly settings: Settings;
  readonly units: readonly UnitState[];
  readonly lesson: number;
  readonly round: number;
  readonly lessonItems: readonly string[];
  readonly gradedInLesson: readonly string[];
}

/** Report (spec §6.4). forecast and unreachable are always null in 0.1.0. */
export interface Report {
  readonly lesson: number;
  readonly round: number;
  readonly completedRounds: number;
  readonly outCount: number;
  readonly inRoundCount: number;
  readonly forecast: null;
  readonly unreachable: null;
}
