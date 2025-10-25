import { z } from 'zod';
import { NewsSourceEnum } from '../SourceEnum.js';

export const processLinkSchema = z.object({
    link: z.url(),
    source: z.enum([NewsSourceEnum.PROTHOM_ALO])
});
