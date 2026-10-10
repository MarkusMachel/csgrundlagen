import { adminHandlers } from './admin';
import { authHandlers } from './auth';
import { deviceHandlers } from './devices';
import { materialHandlers } from './materials';
import { questionHandlers } from './questions';
import { reviewHandlers } from './review';
import { searchHandlers } from './search';
import { testHandlers } from './tests';

export const handlers = [
  ...authHandlers,
  ...adminHandlers,
  ...deviceHandlers,
  // materialHandlers before questionHandlers so /questions/:id/materials
  // wins over the generic /questions/:id matcher ordering concerns —
  // MSW matches most-specific path first regardless, but keeping the
  // explicit route earlier avoids ambiguity.
  ...materialHandlers,
  ...questionHandlers,
  ...reviewHandlers,
  ...searchHandlers,
  ...testHandlers,
];
