export type FirstTripStrategy = 'firstUsTrip' | 'earliest';

export interface SubjectWelcomeCopy {
  intro: string;
  todayDescription: string;
  firstTripDescription: string;
  allTripsDescription: string;
}

export interface SubjectPageMetadata {
  title: string;
  description: string;
}

/** Who a globe view is tracking, plus the UI copy and navigation behaviour for them. */
export interface Subject {
  id: string;
  name: string;
  shortName: string;
  firstTripStrategy: FirstTripStrategy;
  welcome: SubjectWelcomeCopy;
  meta: SubjectPageMetadata;
}

export const SUBJECT_LIST = [
  {
    id: 'carney',
    name: 'Mark Carney',
    shortName: 'Mark Carney',
    firstTripStrategy: 'firstUsTrip',
    welcome: {
      intro: 'Pick a starting point to see the PM\u2019s travels.',
      todayDescription: "Jump to the PM's current stop",
      firstTripDescription: "Start from the PM's first foreign visit following the 2025 Canadian federal election",
      allTripsDescription: "Show the PM's full travel history simultaneously",
    },
    meta: {
      title: 'Where is PM Carney?',
      description: 'Find out where PM Carney is!',
    },
  },
  {
    id: 'andrewdeng',
    name: 'Andrew Deng',
    shortName: 'Andrew',
    firstTripStrategy: 'earliest',
    welcome: {
      intro: 'Pick a starting point to explore Andrew\u2019s travels.',
      todayDescription: 'Jump to their current stop',
      firstTripDescription: 'Start from their earliest logged trip',
      allTripsDescription: 'Show their full travel history simultaneously',
    },
    meta: {
      title: 'Where is Andrew Deng?',
      description: 'Find out where Andrew Deng is!',
    },
  },
  {
    id: 'trump',
    name: 'Donald Trump',
    shortName: 'President Trump',
    firstTripStrategy: 'earliest',
    welcome: {
      intro: 'Pick a starting point to see President Trump\u2019s travels.',
      todayDescription: "Jump to the President's current stop",
      firstTripDescription: 'Start from his earliest logged trip',
      allTripsDescription: 'Show his full travel history simultaneously',
    },
    meta: {
      title: 'Where is President Trump?',
      description: 'Find out where President Trump is!',
    },
  },
] as const satisfies readonly Subject[];

export type SubjectId = (typeof SUBJECT_LIST)[number]['id'];

export const DEFAULT_SUBJECT_ID: SubjectId = 'carney';
export const DEFAULT_SUBJECT: Subject = SUBJECT_LIST[0];

/** Finds a registered subject by ID or display name (case-insensitive), or null if unknown. */
export function findSubject(idOrName?: string | null): (typeof SUBJECT_LIST)[number] | null {
  const normalized = idOrName?.trim().toLowerCase();
  if (!normalized) return null;
  return (
    SUBJECT_LIST.find(
      subject => subject.id.toLowerCase() === normalized || subject.name.toLowerCase() === normalized
    ) ?? null
  );
}

/** Resolves a subject for UI rendering, defaulting to Mark Carney when omitted. */
export function resolveSubject(idOrName?: string | null): Subject {
  const matched = findSubject(idOrName);
  if (matched) return matched;

  const trimmed = idOrName?.trim();
  if (!trimmed) return DEFAULT_SUBJECT;

  const firstName = trimmed.split(' ')[0];
  return {
    id: trimmed,
    name: trimmed,
    shortName: firstName,
    firstTripStrategy: 'earliest',
    welcome: {
      intro: `Pick a starting point to explore ${firstName}\u2019s travels.`,
      todayDescription: 'Jump to their current stop',
      firstTripDescription: 'Start from their earliest logged trip',
      allTripsDescription: 'Show their full travel history simultaneously',
    },
    meta: {
      title: `Where is ${trimmed}?`,
      description: `Find out where ${trimmed} is!`,
    },
  };
}
