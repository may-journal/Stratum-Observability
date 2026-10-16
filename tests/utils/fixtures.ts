import type { CatalogEvent, StratumSnapshot, UserDefinedEventOptions } from '../../src/types';
import { BASE_CATALOG, NR_CATALOG, SAMPLE_A_CATALOG } from './catalog';
import {
  AB_TEST_SCHEMA,
  CATALOG_METADATA,
  DEFAULT_CATALOG_ID,
  GENERATED_DEFAULT_METADATA,
  METADATA_CATALOG_ID,
  PLACEHOLDERS,
  PRODUCT_NAME,
  PRODUCT_VERSION,
  SESSION_ID,
  STRATUM_LIBRARY_VERSION_PLACEHOLDER
} from './constants';
import { PLUGIN_A_NAME, VAR1, VAR2 } from './sample-plugin';

export const SAMPLE_EVENT_OPTIONS: Partial<UserDefinedEventOptions> = {
  replacements: PLACEHOLDERS
};

export const PLUGIN_A_CONTEXT = {
  [VAR1]: 'context-one',
  [VAR2]: 'context-two'
};

const CATALOG_ONLY_FIELDS = ['eventType', 'name', 'description', 'id'];

/**
 * New Relic attributes the publisher sends for every event, before the
 * catalog item's own fields.
 */
function nrAttributes(item: CatalogEvent, metadata = GENERATED_DEFAULT_METADATA, catalogId = DEFAULT_CATALOG_ID) {
  const itemFields = Object.entries(item).filter(([key]) => !CATALOG_ONLY_FIELDS.includes(key));
  return {
    abTests: [AB_TEST_SCHEMA],
    catalogEventType: item.eventType,
    catalogId,
    ...metadata,
    isValid: undefined,
    productName: PRODUCT_NAME,
    productVersion: PRODUCT_VERSION,
    stratumLibraryVersion: STRATUM_LIBRARY_VERSION_PLACEHOLDER,
    stratumSessionId: SESSION_ID,
    stratumEventId: String(item.id),
    ...Object.fromEntries(itemFields)
  };
}

export const NR_MOCK = {
  event: nrAttributes(NR_CATALOG.nrEventValid),
  api: nrAttributes(NR_CATALOG.nrApiValid),
  error: nrAttributes(NR_CATALOG.nrErrorValid),
  sampleA: {
    ...nrAttributes(SAMPLE_A_CATALOG[1], CATALOG_METADATA, METADATA_CATALOG_ID),
    [`${PLUGIN_A_NAME}_${VAR1}`]: PLUGIN_A_CONTEXT[VAR1],
    [`${PLUGIN_A_NAME}_${VAR2}`]: PLUGIN_A_CONTEXT[VAR2]
  }
};

export const BASE_EVENT_MOCK: StratumSnapshot = {
  abTestSchemas: [],
  catalog: {
    id: DEFAULT_CATALOG_ID,
    metadata: GENERATED_DEFAULT_METADATA
  },
  data: BASE_CATALOG[1],
  globalContext: {},
  plugins: {},
  productName: PRODUCT_NAME,
  productVersion: PRODUCT_VERSION,
  stratumSessionId: SESSION_ID,
  stratumVersion: STRATUM_LIBRARY_VERSION_PLACEHOLDER,
  event: {
    eventType: BASE_CATALOG[1].eventType,
    id: BASE_CATALOG[1].id,
    key: '1'
  }
};
