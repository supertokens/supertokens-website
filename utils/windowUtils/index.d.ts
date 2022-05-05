export * from "../../lib/build/windowUtils";
/**
 * 'export *' does not re-export a default.
 * import SuperTokens from "supertokens-website";
 * the above import statement won't be possible unless either
 * - user add "esModuleInterop": true in their tsconfig.json file
 * - we do the following change:
 */
 import * as _default from "../../lib/build/windowUtils";
 export default _default;
 