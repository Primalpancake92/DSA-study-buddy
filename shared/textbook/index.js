import { chapters01to04 } from './weeks01to04.js';
import { chapters05to08 } from './weeks05to08.js';
import { chapters09to12 } from './weeks09to12.js';
import { chapters13to16 } from './weeks13to16.js';

// Server-side only. The public React bundle must never import chapter content.
export const textbookChapters = { ...chapters01to04, ...chapters05to08, ...chapters09to12, ...chapters13to16 };
