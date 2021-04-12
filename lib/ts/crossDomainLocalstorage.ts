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
        if (sessionScope !== undefined) {
            // if we are currently in the same domain as the authDomain, we can
            // treat sessionScope as undefined
            let url = new URL(sessionScope.authDomain); // we do this so that the port is removed.
            if (url.hostname == getWindowOrThrow().location.hostname) {
                this.sessionScope = undefined;
                return;
            }

            // we must load the iframe for the auth domain now.
            // TODO:
        }
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
