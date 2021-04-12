import { getWindowOrThrow } from "./utils";

export default class CrossDomainLocalstorage {
    sessionScope:
        | {
              scope: string;
              authDomain: string;
          }
        | undefined = undefined;

    constructor(
        sessionScope:
            | {
                  scope: string;
                  authDomain: string;
              }
            | undefined
    ) {
        this.sessionScope = sessionScope;
    }

    getItem = (key: string): string | null => {
        return getWindowOrThrow().localStorage.getItem(key);
    };

    removeItem = (key: string) => {
        return getWindowOrThrow().localStorage.removeItem(key);
    };

    setItem = (key: string, value: string) => {
        return getWindowOrThrow().localStorage.setItem(key, value);
    };
}
