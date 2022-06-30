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
Object.defineProperty(exports, "__esModule", { value: true });
var PrimitiveClaim = /** @class */ (function() {
    function PrimitiveClaim(config, customValidators) {
        var _this = this;
        this.config = config;
        this.id = config.id;
        this.refresh = config.refresh;
        var primitiveValidators = {
            hasValue: function(val, id) {
                return {
                    id: id !== undefined ? id : _this.id,
                    refresh: function(ctx) {
                        return _this.config.refresh(ctx);
                    },
                    shouldRefresh: function(payload, ctx) {
                        return _this.getValueFromPayload(payload, ctx) === undefined;
                    },
                    validate: function(payload, ctx) {
                        var claimVal = _this.getValueFromPayload(payload, ctx);
                        var isValid = claimVal === val;
                        return isValid
                            ? { isValid: isValid }
                            : {
                                  isValid: isValid,
                                  reason: { message: "wrong value", expectedValue: val, actualValue: claimVal }
                              };
                    }
                };
            },
            hasFreshValue: function(val, maxAgeInSeconds, id) {
                return {
                    id: id !== undefined ? id : _this.id + "-fresh-val",
                    refresh: function(ctx) {
                        return _this.config.refresh(ctx);
                    },
                    shouldRefresh: function(payload, ctx) {
                        return (
                            _this.getValueFromPayload(payload, ctx) === undefined ||
                            // We know payload[this.id] is defined since the value is not undefined in this branch
                            payload[_this.id].t < Date.now() - maxAgeInSeconds * 1000
                        );
                    },
                    validate: function(payload, ctx) {
                        var claimVal = _this.getValueFromPayload(payload, ctx);
                        if (claimVal !== val) {
                            return {
                                isValid: false,
                                reason: { message: "wrong value", expectedValue: val, actualValue: claimVal }
                            };
                        }
                        var ageInSeconds = (Date.now() - payload[_this.id].t) / 1000;
                        if (ageInSeconds > maxAgeInSeconds) {
                            return {
                                isValid: false,
                                reason: {
                                    message: "expired",
                                    ageInSeconds: ageInSeconds,
                                    maxAgeInSeconds: maxAgeInSeconds
                                }
                            };
                        }
                        return { isValid: true };
                    }
                };
            }
        };
        if (customValidators !== undefined) {
            this.validators = __assign(__assign({}, primitiveValidators), customValidators);
        } else {
            this.validators = primitiveValidators;
        }
    }
    PrimitiveClaim.prototype.getValueFromPayload = function(payload, _userContext) {
        return payload[this.config.id] === undefined ? payload[this.config.id].v : undefined;
    };
    PrimitiveClaim.prototype.getLastFetchedTime = function(payload, _userContext) {
        return payload[this.config.id] === undefined ? new Date(payload[this.config.id].t) : undefined;
    };
    return PrimitiveClaim;
})();
exports.PrimitiveClaim = PrimitiveClaim;
