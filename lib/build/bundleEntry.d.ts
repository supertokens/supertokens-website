import SuperTokensFetch from "./index";
import SuperTokensAxios from "./axios";
declare var fetch: typeof SuperTokensFetch;
declare var axios: typeof SuperTokensAxios;
export { fetch, axios };
