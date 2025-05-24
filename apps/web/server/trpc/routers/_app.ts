import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { pdfRouter } from './pdf'; // Import the pdfRouter

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `hello ${input.text}`,
      };
    }),
  // Mount the pdfRouter
  pdf: pdfRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
