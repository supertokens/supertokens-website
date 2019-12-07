import SuperTokensFetch from ".";
import SuperTokensAxios from "./axios";
declare let fetch: typeof SuperTokensFetch;
declare let axios: typeof SuperTokensAxios;
export { fetch, axios };
