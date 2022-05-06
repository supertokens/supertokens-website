"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getWindowOrThrow() {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }
    return window;
}
exports.getWindowOrThrow = getWindowOrThrow;
exports.defaultWindowHandler = {
    history: {
        replaceState: function(data, unused, url) {
            return getWindowOrThrow().history.replaceState(data, unused, url);
        },
        getState: function() {
            return getWindowOrThrow().history.state;
        }
    },
    location: {
        getHref: function() {
            return getWindowOrThrow().location.href;
        },
        setHref: function(href) {
            getWindowOrThrow().location.href = href;
        },
        getSearch: function() {
            return getWindowOrThrow().location.search;
        },
        getHash: function() {
            return getWindowOrThrow().location.hash;
        },
        getPathName: function() {
            return getWindowOrThrow().location.pathname;
        },
        assign: function(url) {
            /**
             * The type for assign accepts URL | string but when building
             * it complains about only accepting a string. To prevent this
             * we use any
             */
            getWindowOrThrow().location.assign(url);
        },
        getHostName: function() {
            return getWindowOrThrow().location.hostname;
        },
        getOrigin: function() {
            return getWindowOrThrow().location.origin;
        }
    },
    getDocument: function() {
        return getWindowOrThrow().document;
    },
    getLocalStorage: function() {
        return getWindowOrThrow().localStorage;
    },
    getSessionStorage: function() {
        return getWindowOrThrow().sessionStorage;
    }
};
