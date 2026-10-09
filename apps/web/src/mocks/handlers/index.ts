import { adminHandlers } from './admin';
import { authHandlers } from './auth';
import { materialHandlers } from './materials';
import { questionHandlers } from './questions';
import { searchHandlers } from './search';
import { testHandlers } from './tests';

export const handlers = [
  ...authHandlers,
  ...adminHandlers,
  // materialHandlers before questionHandlers so /questions/:id/materials
  // wins over the generic /questions/:id matcher ordering concerns —
  // MSW matches most-specific path first regardless, but keeping the
  // explicit route earlier avoids ambiguity.
  ...materialHandlers,
  ...questionHandlers,
  ...searchHandlers,
  ...testHandlers,
];
