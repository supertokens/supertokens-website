"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var CrossDomainLocalstorage = /** @class */ (function() {
    function CrossDomainLocalstorage(sessionScope) {
        this.sessionScope = undefined;
        this.getItem = function(key) {
            return utils_1.getWindowOrThrow().localStorage.getItem(key);
        };
        this.removeItem = function(key) {
            return utils_1.getWindowOrThrow().localStorage.removeItem(key);
        };
        this.setItem = function(key, value) {
            return utils_1.getWindowOrThrow().localStorage.setItem(key, value);
        };
        this.sessionScope = sessionScope;
        if (sessionScope !== undefined) {
            // if we are currently in the same domain as the authDomain, we can
            // treat sessionScope as undefined
            var url = new URL(sessionScope.authDomain); // we do this so that the port is removed.
            if (url.hostname == utils_1.getWindowOrThrow().location.hostname) {
                this.sessionScope = undefined;
                return;
            }
            // we must load the iframe for the auth domain now.
            // TODO:
        }
    }
    return CrossDomainLocalstorage;
})();
exports.default = CrossDomainLocalstorage;
//# sourceMappingURL=crossDomainLocalstorage.js.map
