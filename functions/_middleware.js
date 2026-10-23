import { managementHandler } from "../src/server/management-access.js";
import files from "../.cache/management-runtime/assets.mjs";

// Private files live only inside the Worker; static routing can never expose them.
export const onRequest = managementHandler(files);
