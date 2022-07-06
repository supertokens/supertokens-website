"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PrimitiveClaim = /** @class */ (function() {
    function PrimitiveClaim(config) {
        var _this = this;
        this.validators = {
            hasValue: function(val, id) {
                return {
                    id: id !== undefined ? id : _this.id,
                    refresh: function(ctx) {
                        return _this.refresh(ctx);
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
                        return _this.refresh(ctx);
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
        this.id = config.id;
        this.refresh = config.refresh;
    }
    PrimitiveClaim.prototype.getValueFromPayload = function(payload, _userContext) {
        return payload[this.id] !== undefined ? payload[this.id].v : undefined;
    };
    PrimitiveClaim.prototype.getLastFetchedTime = function(payload, _userContext) {
        return payload[this.id] !== undefined ? payload[this.id].t : undefined;
    };
    return PrimitiveClaim;
})();
exports.PrimitiveClaim = PrimitiveClaim;
