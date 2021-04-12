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
    }
    return CrossDomainLocalstorage;
})();
exports.default = CrossDomainLocalstorage;
//# sourceMappingURL=crossDomainLocalstorage.js.map
