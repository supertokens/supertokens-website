"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrimitiveClaim = void 0;
var PrimitiveClaim = /** @class */ (function() {
    function PrimitiveClaim(config) {
        var _this = this;
        this.validators = {
            hasValue: function(val, maxAgeInSeconds, id) {
                if (maxAgeInSeconds === void 0) {
                    maxAgeInSeconds = _this.defaultMaxAgeInSeconds;
                }
                return {
                    id: id !== undefined ? id : _this.id,
                    refresh: function(ctx) {
                        return _this.refresh(ctx);
                    },
                    shouldRefresh: function(payload, ctx) {
                        return (
                            _this.getValueFromPayload(payload, ctx) === undefined ||
                            // We know payload[this.id] is defined since the value is not undefined in this branch
                            (maxAgeInSeconds !== undefined && payload[_this.id].t < Date.now() - maxAgeInSeconds * 1000)
                        );
                    },
                    validate: function(payload, ctx) {
                        var claimVal = _this.getValueFromPayload(payload, ctx);
                        if (claimVal === undefined) {
                            return {
                                isValid: false,
                                reason: { message: "value does not exist", expectedValue: val, actualValue: claimVal }
                            };
                        }
                        var ageInSeconds = (Date.now() - _this.getLastFetchedTime(payload, ctx)) / 1000;
                        if (maxAgeInSeconds !== undefined && ageInSeconds > maxAgeInSeconds) {
                            return {
                                isValid: false,
                                reason: {
                                    message: "expired",
                                    ageInSeconds: ageInSeconds,
                                    maxAgeInSeconds: maxAgeInSeconds
                                }
                            };
                        }
                        if (claimVal !== val) {
                            return {
                                isValid: false,
                                reason: { message: "wrong value", expectedValue: val, actualValue: claimVal }
                            };
                        }
                        return { isValid: true };
                    }
                };
            }
        };
        this.id = config.id;
        this.refresh = config.refresh;
        this.defaultMaxAgeInSeconds = config.defaultMaxAgeInSeconds;
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
