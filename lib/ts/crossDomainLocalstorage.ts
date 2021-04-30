import { getWindowOrThrow } from "./utils";

export default class CrossDomainLocalstorage {
    sessionScope:
        | {
              scope: string;
              authDomain: string;
          }
        | undefined = undefined;

    iframe: any | undefined;

    nextMessageID = 0;

    toSendMessageQueueBeforeIframeLoads: any[] = [];

    waiterFunctionsForResultFromIframe: ((data: any) => void)[] = [];

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
                for (let i = 0; i < this.toSendMessageQueueBeforeIframeLoads.length; i++) {
                    this.iframe.contentWindow.postMessage(
                        this.toSendMessageQueueBeforeIframeLoads[i],
                        sessionScope.authDomain
                    );
                }
                this.toSendMessageQueueBeforeIframeLoads = [];
            });
            iframe.src = sessionScope.authDomain + "?is-supertokens-website-iframe=true";
            iframe.style.height = "0px";
            iframe.style.width = "0px";
            iframe.style.display = "none";
            getWindowOrThrow().document.body.appendChild(iframe);
            getWindowOrThrow().addEventListener("message", this.messageFromIFrameListener, false);
        }
    }

    sendMessageAndGetResponseToDestinationIframe = async (message: any): Promise<string | null> => {
        if (this.sessionScope === undefined) {
            return null;
        }

        let currId = this.nextMessageID;
        this.nextMessageID = this.nextMessageID + 1;

        let dataPromise: Promise<string | null> = new Promise(res => {
            let waiterFunction = (data: any) => {
                if (data.id === currId) {
                    res(data.value === undefined ? null : data.value);
                    this.waiterFunctionsForResultFromIframe = this.waiterFunctionsForResultFromIframe.filter(
                        func => func !== waiterFunction
                    );
                }
            };

            this.waiterFunctionsForResultFromIframe.push(waiterFunction);

            // TODO: add a timeout for this in case the Iframe has failed to load or something...
        });

        message = {
            ...message,
            id: currId,
            from: "supertokens"
        };
        if (this.iframe === undefined) {
            // we need to wait for the iframe to load...
            this.toSendMessageQueueBeforeIframeLoads.push(message);
        } else {
            this.iframe.contentWindow.postMessage(message, this.sessionScope.authDomain);
        }

        let data = await dataPromise;

        return data;
    };

    messageFromIFrameListener = (event: any) => {
        if (this.sessionScope === undefined) {
            return;
        }

        let authDomainURL = new URL(this.sessionScope.authDomain);
        let originDomainURL = new URL(event.origin);
        if (authDomainURL.hostname !== originDomainURL.hostname || event.data.from !== "supertokens") {
            return;
        }

        for (let i = 0; i < this.waiterFunctionsForResultFromIframe.length; i++) {
            this.waiterFunctionsForResultFromIframe[i](event.data);
        }
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
            !new URL(event.origin).hostname.endsWith(this.sessionScope.scope) &&
            !event.origin.endsWith(this.sessionScope.scope)
        ) {
            return;
        }

        if (event.data.from !== "supertokens") {
            return;
        }

        let data = event.data;
        let key = data.key;
        let result: any = {
            id: data.id,
            from: "supertokens"
        };
        if (data.action === "getItem") {
            result = {
                ...result,
                value: getWindowOrThrow().localStorage.getItem(key)
            };
        } else if (data.action === "removeItem") {
            getWindowOrThrow().localStorage.removeItem(key);
        } else if (data.action === "setItem") {
            let value = data.value;
            getWindowOrThrow().localStorage.setItem(key, value);
        }

        event.source.postMessage(result, "*");
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
            // we wait forever since the child iframe will probably not load their content.
            // therefore no redirect etc..
            await new Promise(_ => {});
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
