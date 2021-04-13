"use strict";
var __assign =
    (this && this.__assign) ||
    function() {
        __assign =
            Object.assign ||
            function(t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
            };
        return __assign.apply(this, arguments);
    };
var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : new P(function(resolve) {
                          resolve(result.value);
                      }).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
var __generator =
    (this && this.__generator) ||
    function(thisArg, body) {
        var _ = {
                label: 0,
                sent: function() {
                    if (t[0] & 1) throw t[1];
                    return t[1];
                },
                trys: [],
                ops: []
            },
            f,
            y,
            t,
            g;
        return (
            (g = { next: verb(0), throw: verb(1), return: verb(2) }),
            typeof Symbol === "function" &&
                (g[Symbol.iterator] = function() {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function(v) {
                return step([n, v]);
            };
        }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (
                        ((f = 1),
                        y &&
                            (t =
                                op[0] & 2
                                    ? y["return"]
                                    : op[0]
                                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                                    : y.next) &&
                            !(t = t.call(y, op[1])).done)
                    )
                        return t;
                    if (((y = 0), t)) op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (
                                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                                (op[0] === 6 || op[0] === 2)
                            ) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2]) _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) {
                    op = [6, e];
                    y = 0;
                } finally {
                    f = t = 0;
                }
            if (op[0] & 5) throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var CrossDomainLocalstorage = /** @class */ (function() {
    function CrossDomainLocalstorage(sessionScope) {
        var _this = this;
        this.sessionScope = undefined;
        this.nextMessageID = 0;
        this.toSendMessageQueueBeforeIframeLoads = [];
        this.waiterFunctionsForResultFromIframe = [];
        this.sendMessageAndGetResponseToDestinationIframe = function(message) {
            return __awaiter(_this, void 0, void 0, function() {
                var currId, dataPromise, data;
                var _this = this;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.sessionScope === undefined) {
                                return [2 /*return*/, null];
                            }
                            currId = this.nextMessageID;
                            this.nextMessageID = this.nextMessageID + 1;
                            dataPromise = new Promise(function(res) {
                                var waiterFunction = function(data) {
                                    if (data.id === currId) {
                                        res(data.value === undefined ? null : data.value);
                                        _this.waiterFunctionsForResultFromIframe = _this.waiterFunctionsForResultFromIframe.filter(
                                            function(func) {
                                                return func !== waiterFunction;
                                            }
                                        );
                                    }
                                };
                                _this.waiterFunctionsForResultFromIframe.push(waiterFunction);
                                // TODO: add a timeout for this in case the Iframe has failed to load or something...
                            });
                            message = __assign({}, message, { id: currId, from: "supertokens" });
                            if (this.iframe === undefined) {
                                // we need to wait for the iframe to load...
                                this.toSendMessageQueueBeforeIframeLoads.push(message);
                            } else {
                                this.iframe.contentWindow.postMessage(message, this.sessionScope.authDomain);
                            }
                            return [4 /*yield*/, dataPromise];
                        case 1:
                            data = _a.sent();
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        this.messageFromIFrameListener = function(event) {
            if (_this.sessionScope === undefined) {
                return;
            }
            var authDomainURL = new URL(_this.sessionScope.authDomain);
            var originDomainURL = new URL(event.origin);
            if (authDomainURL.hostname !== originDomainURL.hostname || event.data.from !== "supertokens") {
                return;
            }
            for (var i = 0; i < _this.waiterFunctionsForResultFromIframe.length; i++) {
                _this.waiterFunctionsForResultFromIframe[i](event.data);
            }
        };
        // this is in the auth domain...
        this.iFrameListener = function(event) {
            if (_this.sessionScope === undefined) {
                return;
            }
            // if the event's origin does not have the same ending as the
            // session scope, we must ignore the event since it's from a different
            // domain.
            // We use new URL.hostname so that port information is removed. So we compare
            // without that as well as with that so that the user can give
            // session scope with and without the port.
            if (
                !new URL(event.origin).hostname.endsWith(_this.sessionScope.scope) &&
                !event.origin.endsWith(_this.sessionScope.scope)
            ) {
                return;
            }
            if (event.data.from !== "supertokens") {
                return;
            }
            var data = event.data;
            var key = data.key;
            var result = {
                id: data.id,
                from: "supertokens"
            };
            if (data.action === "getItem") {
                result = __assign({}, result, { value: utils_1.getWindowOrThrow().localStorage.getItem(key) });
            } else if (data.action === "removeItem") {
                utils_1.getWindowOrThrow().localStorage.removeItem(key);
            } else if (data.action === "setItem") {
                var value = data.value;
                utils_1.getWindowOrThrow().localStorage.setItem(key, value);
            }
            event.source.postMessage(result, "*");
        };
        this.isAuthDomain = function() {
            if (_this.sessionScope === undefined) {
                return true;
            }
            var url = new URL(_this.sessionScope.authDomain); // we do this so that the port is removed.
            return url.hostname == utils_1.getWindowOrThrow().location.hostname;
        };
        this.isInIFrame = function() {
            var urlParams = new URLSearchParams(utils_1.getWindowOrThrow().location.search);
            return _this.sessionScope !== undefined && urlParams.get("is-supertokens-website-iframe") !== null;
        };
        this.getItem = function(key) {
            return __awaiter(_this, void 0, void 0, function() {
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.isInIFrame()) {
                                return [2 /*return*/, null];
                            }
                            if (!this.isAuthDomain()) return [3 /*break*/, 1];
                            return [2 /*return*/, utils_1.getWindowOrThrow().localStorage.getItem(key)];
                        case 1:
                            return [
                                4 /*yield*/,
                                this.sendMessageAndGetResponseToDestinationIframe({
                                    action: "getItem",
                                    key: key
                                })
                            ];
                        case 2:
                            return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        this.removeItem = function(key) {
            return __awaiter(_this, void 0, void 0, function() {
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!this.isInIFrame()) return [3 /*break*/, 3];
                            if (!this.isAuthDomain()) return [3 /*break*/, 1];
                            return [2 /*return*/, utils_1.getWindowOrThrow().localStorage.removeItem(key)];
                        case 1:
                            return [
                                4 /*yield*/,
                                this.sendMessageAndGetResponseToDestinationIframe({
                                    action: "removeItem",
                                    key: key
                                })
                            ];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            return [2 /*return*/];
                    }
                });
            });
        };
        this.setItem = function(key, value) {
            return __awaiter(_this, void 0, void 0, function() {
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!this.isInIFrame()) return [3 /*break*/, 3];
                            if (!this.isAuthDomain()) return [3 /*break*/, 1];
                            return [2 /*return*/, utils_1.getWindowOrThrow().localStorage.setItem(key, value)];
                        case 1:
                            return [
                                4 /*yield*/,
                                this.sendMessageAndGetResponseToDestinationIframe({
                                    action: "setItem",
                                    key: key,
                                    value: value
                                })
                            ];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            return [2 /*return*/];
                    }
                });
            });
        };
        this.sessionScope = sessionScope;
        if (sessionScope !== undefined) {
            // if we are currently in the same domain as the authDomain, we add an event listener
            if (this.isAuthDomain()) {
                utils_1.getWindowOrThrow().addEventListener("message", this.iFrameListener, false);
                return;
            }
            // we add an iframe that loads the authDomain
            var iframe_1 = utils_1.getWindowOrThrow().document.createElement("iframe");
            iframe_1.addEventListener("load", function() {
                _this.iframe = iframe_1;
                for (var i = 0; i < _this.toSendMessageQueueBeforeIframeLoads.length; i++) {
                    _this.iframe.contentWindow.postMessage(
                        _this.toSendMessageQueueBeforeIframeLoads[i],
                        sessionScope.authDomain
                    );
                }
                _this.toSendMessageQueueBeforeIframeLoads = [];
            });
            iframe_1.src = sessionScope.authDomain + "?is-supertokens-website-iframe=true";
            iframe_1.style.height = "0px";
            iframe_1.style.width = "0px";
            iframe_1.style.display = "none";
            utils_1.getWindowOrThrow().document.body.appendChild(iframe_1);
            utils_1.getWindowOrThrow().addEventListener("message", this.messageFromIFrameListener, false);
        }
    }
    return CrossDomainLocalstorage;
})();
exports.default = CrossDomainLocalstorage;
//# sourceMappingURL=crossDomainLocalstorage.js.map
