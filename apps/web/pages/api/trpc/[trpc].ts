import * as trpcNext from "@trpc/server/adapters/next";
import { appRouter } from "../../../server/trpc/routers/_app";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Set desired value here
    },
  },
};

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
});
