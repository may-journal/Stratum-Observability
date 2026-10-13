import { BASE_EVENT_TYPE } from '../../src';
import { type NewRelicEvents, NewRelicEventType } from '../../src/plugins/new-relic-plus';
import type { StratumCatalog } from '../../src/types';
import { type AEvent, type BEvent, SampleEventType } from './sample-plugin';

export const ADDED_KEY = 'abc';
export const NR_API_KEY = 'nrApiValid';
export const NR_MESSAGE = 'nr-message';
export const NR_DESCRIPTION = 'description';
export const NR_FEATURE_NAME = 'featureName';
export const NR_EVENT_NAME = 'nr-event';
export const NR_API_NAME = 'nr-api-response';
export const NR_ERROR_NAME = 'nr-error';

const FIRST_A_ITEM = {
  eventType: SampleEventType.A,
  prop1: 'prop1',
  prop2: 'prop2',
  description: 'event 1',
  id: 1
};

export const SAMPLE_A_CATALOG = {
  1: { ...FIRST_A_ITEM, name: '{{PLACEHOLDER_2}}' },
  2: {
    eventType: SampleEventType.A,
    name: 'name2',
    prop1: 'def',
    prop2: '456',
    description: 'event 2',
    id: 2
  },
  3: {
    eventType: SampleEventType.A,
    name: 'name3',
    prop1: 'xyz',
    prop2: '789',
    description: 'event 3',
    id: 4
  },
  4: {
    eventType: SampleEventType.A,
    name: 'name4',
    prop1: 'mmm',
    prop2: 'nnn',
    description: 'event 4',
    id: 8
  }
} satisfies StratumCatalog<AEvent>;

export const SAMPLE_A_CATALOG_2 = {
  [ADDED_KEY]: {
    eventType: SampleEventType.A,
    name: ADDED_KEY,
    prop1: '1prop',
    prop2: '2prop',
    description: 'event 5',
    id: 1000
  }
} satisfies StratumCatalog<AEvent>;

export const SAMPLE_B_CATALOG = {
  1: {
    eventType: SampleEventType.B,
    prop3: true,
    prop4: 1,
    description: FIRST_A_ITEM.description,
    id: 1
  },
  2: {
    eventType: SampleEventType.B,
    prop3: false,
    prop4: 0,
    prop5: 'prop5',
    description: 'event 2b',
    id: 1
  }
} satisfies StratumCatalog<BEvent>;

export const INVALID_SAMPLE_CATALOG = {
  0: {},
  1: {
    eventType: SampleEventType.A,
    prop1: FIRST_A_ITEM.prop1
  },
  3: {
    eventType: SampleEventType.B
  },
  correct: FIRST_A_ITEM,
  duplicate: FIRST_A_ITEM
};

export const NR_CATALOG = {
  nrEventValid: {
    eventType: NewRelicEventType.EVENT,
    message: NR_MESSAGE,
    name: NR_EVENT_NAME,
    description: NR_DESCRIPTION,
    id: 100
  },
  nrEventInvalid: {
    eventType: NewRelicEventType.EVENT,
    name: '',
    description: NR_DESCRIPTION,
    id: 101
  },
  [NR_API_KEY]: {
    eventType: NewRelicEventType.API_RESPONSE,
    message: NR_MESSAGE,
    featureName: NR_FEATURE_NAME,
    name: NR_API_NAME,
    requestHeaders: 'requestHeaders',
    requestUri: 'requestUri',
    statusCode: 'statusCode',
    statusText: 'statusText',
    description: NR_DESCRIPTION,
    id: 102
  },
  // @ts-expect-error testing runtime handling with invalid types
  nrApiInvalid: {
    eventType: NewRelicEventType.API_RESPONSE,
    name: NR_API_NAME,
    requestHeaders: '',
    statusText: '',
    description: NR_DESCRIPTION,
    id: 103
  },
  nrErrorValid: {
    errorCode: 'my-error-code',
    errorText: 'error-text',
    eventType: NewRelicEventType.ERROR,
    featureName: NR_FEATURE_NAME,
    isVisual: false,
    message: 'errormessage',
    name: NR_ERROR_NAME,
    reason: 'my-reason',
    description: NR_DESCRIPTION,
    id: 104
  },
  // @ts-expect-error testing runtime handling with invalid types
  nrErrorInvalid: {
    eventType: NewRelicEventType.ERROR,
    name: NR_ERROR_NAME,
    description: NR_DESCRIPTION,
    id: 104 // Intentional repeat of already-in-use id
  },
  nrApiPlaceholders: {
    eventType: NewRelicEventType.API_RESPONSE,
    message: '{{PLACEHOLDER_1}}',
    featureName: '{{PLACEHOLDER_2}}',
    name: '{{PLACEHOLDER_3}}',
    requestHeaders: '{{PLACEHOLDER_4}}',
    requestUri: '{{PLACEHOLDER_5}}',
    statusCode: '{{PLACEHOLDER_6}}',
    statusText: '{{PLACEHOLDER_7}}',
    description: NR_DESCRIPTION,
    id: 105
  }
} satisfies StratumCatalog<NewRelicEvents>;

export const BASE_CATALOG = {
  1: {
    eventType: BASE_EVENT_TYPE,
    description: 'base event 1',
    id: 1
  },
  2: {
    eventType: BASE_EVENT_TYPE,
    description: 'base event 2'
  }
} satisfies StratumCatalog;
