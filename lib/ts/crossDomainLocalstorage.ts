import { getWindowOrThrow } from "./utils";

export default class CrossDomainLocalstorage {
    sessionScope:
        | {
              scope: string;
              authDomain: string;
          }
        | undefined = undefined;

    iframe: any | undefined;

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
            // if we are currently in the same domain as the authDomain, we add an event listener
            if (this.isAuthDomain()) {
                getWindowOrThrow().addEventListener("message", this.iFrameListener, false);
                return;
            }

            // we add an iframe that loads the authDomain
            let iframe = getWindowOrThrow().document.createElement("iframe");
            iframe.addEventListener("load", () => {
                this.iframe = iframe;
            });
            iframe.src = sessionScope.authDomain + "?is-supertokens-website-iframe=true";
            iframe.style.height = "0px";
            iframe.style.width = "0px";
            iframe.style.display = "none";
            getWindowOrThrow().document.body.appendChild(iframe);
        }
    }

    sendMessageAndGetResponseToDestinationIframe = async (message: any): Promise<string | null> => {
        if (this.sessionScope === undefined) {
            return null;
        }
        if (this.iframe === undefined) {
            // TODO: we need to wait for the iframe to load...
        } else {
            this.iframe.contentWindow.postMessage(message, this.sessionScope.authDomain);
        }

        // wait for reply...

        return null;
    };

    // this is in the auth domain...
    iFrameListener = (event: any) => {
        if (this.sessionScope === undefined) {
            return;
        }

        // if the event's origin does not have the same ending as the
        // session scope, we must ignore the event since it's from a different
        // domain.
        // We use new URL.hostname so that port information is removed. So we compare
        // without that as well as with that so that the user can give
        // session scope with and without the port.

        if (
            !new URL(event.origin).hostname.endsWith(this.sessionScope.scope) ||
            event.origin.endsWith(this.sessionScope.scope)
        ) {
            return;
        }

        // const { action, key, value } = event.data
        // if (action == 'save') {
        //     window.localStorage.setItem(key, JSON.stringify(value))
        // } else if (action == 'get') {
        //     event.source.postMessage({
        //         action: 'returnData',
        //         key,
        //         value: JSON.parse(window.localStorage.getItem(key))
        //     },
        // }
    };

    isAuthDomain = () => {
        if (this.sessionScope === undefined) {
            return true;
        }
        let url = new URL(this.sessionScope.authDomain); // we do this so that the port is removed.
        return url.hostname == getWindowOrThrow().location.hostname;
    };

    isInIFrame = () => {
        const urlParams = new URLSearchParams(getWindowOrThrow().location.search);
        return this.sessionScope !== undefined && urlParams.get("is-supertokens-website-iframe") !== null;
    };

    getItem = async (key: string): Promise<string | null> => {
        if (this.isInIFrame()) {
            return null;
        }
        if (this.isAuthDomain()) {
            return getWindowOrThrow().localStorage.getItem(key);
        } else {
            return await this.sendMessageAndGetResponseToDestinationIframe({
                action: "getItem",
                key
            });
        }
    };

    removeItem = async (key: string) => {
        if (!this.isInIFrame()) {
            if (this.isAuthDomain()) {
                return getWindowOrThrow().localStorage.removeItem(key);
            } else {
                await this.sendMessageAndGetResponseToDestinationIframe({
                    action: "removeItem",
                    key
                });
            }
        }
    };

    setItem = async (key: string, value: string) => {
        if (!this.isInIFrame()) {
            if (this.isAuthDomain()) {
                return getWindowOrThrow().localStorage.setItem(key, value);
            } else {
                await this.sendMessageAndGetResponseToDestinationIframe({
                    action: "setItem",
                    key,
                    value
                });
            }
        }
    };
}
