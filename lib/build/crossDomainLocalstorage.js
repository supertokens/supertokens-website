"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var CrossDomainLocalstorage = /** @class */ (function() {
    function CrossDomainLocalstorage(sessionScope) {
        var _this = this;
        this.sessionScope = undefined;
        this.isInIFrame = function() {
            var urlParams = new URLSearchParams(utils_1.getWindowOrThrow().location.search);
            return _this.sessionScope !== undefined && urlParams.get("is-supertokens-website-iframe") !== null;
        };
        this.getItem = function(key) {
            if (_this.isInIFrame()) {
                return null;
            }
            return utils_1.getWindowOrThrow().localStorage.getItem(key);
        };
        this.removeItem = function(key) {
            if (!_this.isInIFrame()) {
                return utils_1.getWindowOrThrow().localStorage.removeItem(key);
            }
        };
        this.setItem = function(key, value) {
            if (!_this.isInIFrame()) {
                return utils_1.getWindowOrThrow().localStorage.setItem(key, value);
            }
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
            // we add an iframe that loads the authDomain
            var iframe = utils_1.getWindowOrThrow().document.createElement("iframe");
            iframe.src = sessionScope.authDomain + "?is-supertokens-website-iframe=true";
            iframe.style.height = "0px";
            iframe.style.width = "0px";
            iframe.style.display = "none";
            utils_1.getWindowOrThrow().document.body.appendChild(iframe);
        }
    }
    return CrossDomainLocalstorage;
})();
exports.default = CrossDomainLocalstorage;
//# sourceMappingURL=crossDomainLocalstorage.js.map
