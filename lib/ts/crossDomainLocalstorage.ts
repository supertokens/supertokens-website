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

            // we add an iframe that loads the authDomain
            let iframe = getWindowOrThrow().document.createElement("iframe");
            iframe.src = sessionScope.authDomain + "?is-supertokens-website-iframe=true";
            iframe.style.height = "0px";
            iframe.style.width = "0px";
            iframe.style.display = "none";
            getWindowOrThrow().document.body.appendChild(iframe);
        }
    }

    isInIFrame = () => {
        const urlParams = new URLSearchParams(getWindowOrThrow().location.search);
        return this.sessionScope !== undefined && urlParams.get("is-supertokens-website-iframe") !== null;
    };

    getItem = (key: string): string | null => {
        if (this.isInIFrame()) {
            return null;
        }
        return getWindowOrThrow().localStorage.getItem(key);
    };

    removeItem = (key: string) => {
        if (!this.isInIFrame()) {
            return getWindowOrThrow().localStorage.removeItem(key);
        }
    };

    setItem = (key: string, value: string) => {
        if (!this.isInIFrame()) {
            return getWindowOrThrow().localStorage.setItem(key, value);
        }
    };
}
