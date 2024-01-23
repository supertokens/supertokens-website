"use strict";
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
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
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
var __generator =
    (this && this.__generator) ||
    function (thisArg, body) {
        var _ = {
                label: 0,
                sent: function () {
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
                (g[Symbol.iterator] = function () {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function (v) {
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
exports.PrimitiveArrayClaim = void 0;
var dateProvider_1 = require("../utils/dateProvider");
var PrimitiveArrayClaim = /** @class */ (function () {
    function PrimitiveArrayClaim(config) {
        var _this = this;
        this.validators = {
            includes: function (val, maxAgeInSeconds, id) {
                if (maxAgeInSeconds === void 0) {
                    maxAgeInSeconds = _this.defaultMaxAgeInSeconds;
                }
                var DateProvider = dateProvider_1.default.getReferenceOrThrow().dateProvider;
                return {
                    id: id !== undefined ? id : _this.id,
                    refresh: function (ctx) {
                        return _this.refresh(ctx);
                    },
                    shouldRefresh: function (payload, ctx) {
                        if (maxAgeInSeconds !== undefined && maxAgeInSeconds < DateProvider.getThresholdInSeconds()) {
                            throw new Error(
                                "maxAgeInSeconds must be greater than or equal to the DateProvider threshold value -> ".concat(
                                    DateProvider.getThresholdInSeconds()
                                )
                            );
                        }
                        return (
                            _this.getValueFromPayload(payload, ctx) === undefined ||
                            // We know payload[this.id] is defined since the value is not undefined in this branch
                            (maxAgeInSeconds !== undefined &&
                                payload[_this.id].t < DateProvider.now() - maxAgeInSeconds * 1000)
                        );
                    },
                    validate: function (payload, ctx) {
                        return __awaiter(_this, void 0, void 0, function () {
                            var claimVal, ageInSeconds;
                            return __generator(this, function (_a) {
                                claimVal = this.getValueFromPayload(payload, ctx);
                                if (claimVal === undefined) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "value does not exist",
                                                expectedToInclude: val,
                                                actualValue: claimVal
                                            }
                                        }
                                    ];
                                }
                                ageInSeconds = (DateProvider.now() - this.getLastFetchedTime(payload, ctx)) / 1000;
                                if (maxAgeInSeconds !== undefined && ageInSeconds > maxAgeInSeconds) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "expired",
                                                ageInSeconds: ageInSeconds,
                                                maxAgeInSeconds: maxAgeInSeconds
                                            }
                                        }
                                    ];
                                }
                                if (!claimVal.includes(val)) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "wrong value",
                                                expectedToInclude: val,
                                                actualValue: claimVal
                                            }
                                        }
                                    ];
                                }
                                return [2 /*return*/, { isValid: true }];
                            });
                        });
                    }
                };
            },
            excludes: function (val, maxAgeInSeconds, id) {
                if (maxAgeInSeconds === void 0) {
                    maxAgeInSeconds = _this.defaultMaxAgeInSeconds;
                }
                var DateProvider = dateProvider_1.default.getReferenceOrThrow().dateProvider;
                return {
                    id: id !== undefined ? id : _this.id,
                    refresh: function (ctx) {
                        return _this.refresh(ctx);
                    },
                    shouldRefresh: function (payload, ctx) {
                        if (maxAgeInSeconds !== undefined && maxAgeInSeconds < DateProvider.getThresholdInSeconds()) {
                            throw new Error(
                                "maxAgeInSeconds must be greater than or equal to the DateProvider threshold value -> ".concat(
                                    DateProvider.getThresholdInSeconds()
                                )
                            );
                        }
                        return (
                            _this.getValueFromPayload(payload, ctx) === undefined ||
                            // We know payload[this.id] is defined since the value is not undefined in this branch
                            (maxAgeInSeconds !== undefined &&
                                payload[_this.id].t < DateProvider.now() - maxAgeInSeconds * 1000)
                        );
                    },
                    validate: function (payload, ctx) {
                        return __awaiter(_this, void 0, void 0, function () {
                            var claimVal, ageInSeconds;
                            return __generator(this, function (_a) {
                                claimVal = this.getValueFromPayload(payload, ctx);
                                if (claimVal === undefined) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "value does not exist",
                                                expectedToNotInclude: val,
                                                actualValue: claimVal
                                            }
                                        }
                                    ];
                                }
                                ageInSeconds = (DateProvider.now() - this.getLastFetchedTime(payload, ctx)) / 1000;
                                if (maxAgeInSeconds !== undefined && ageInSeconds > maxAgeInSeconds) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "expired",
                                                ageInSeconds: ageInSeconds,
                                                maxAgeInSeconds: maxAgeInSeconds
                                            }
                                        }
                                    ];
                                }
                                if (claimVal.includes(val)) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "wrong value",
                                                expectedToNotInclude: val,
                                                actualValue: claimVal
                                            }
                                        }
                                    ];
                                }
                                return [2 /*return*/, { isValid: true }];
                            });
                        });
                    }
                };
            },
            includesAll: function (val, maxAgeInSeconds, id) {
                if (maxAgeInSeconds === void 0) {
                    maxAgeInSeconds = _this.defaultMaxAgeInSeconds;
                }
                var DateProvider = dateProvider_1.default.getReferenceOrThrow().dateProvider;
                return {
                    id: id !== undefined ? id : _this.id,
                    refresh: function (ctx) {
                        return _this.refresh(ctx);
                    },
                    shouldRefresh: function (payload, ctx) {
                        if (maxAgeInSeconds !== undefined && maxAgeInSeconds < DateProvider.getThresholdInSeconds()) {
                            throw new Error(
                                "maxAgeInSeconds must be greater than or equal to the DateProvider threshold value -> ".concat(
                                    DateProvider.getThresholdInSeconds()
                                )
                            );
                        }
                        return (
                            _this.getValueFromPayload(payload, ctx) === undefined ||
                            // We know payload[this.id] is defined since the value is not undefined in this branch
                            (maxAgeInSeconds !== undefined &&
                                payload[_this.id].t < DateProvider.now() - maxAgeInSeconds * 1000)
                        );
                    },
                    validate: function (payload, ctx) {
                        return __awaiter(_this, void 0, void 0, function () {
                            var claimVal, ageInSeconds, claimSet, isValid;
                            return __generator(this, function (_a) {
                                claimVal = this.getValueFromPayload(payload, ctx);
                                if (claimVal === undefined) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "value does not exist",
                                                expectedToInclude: val,
                                                actualValue: claimVal
                                            }
                                        }
                                    ];
                                }
                                ageInSeconds = (DateProvider.now() - this.getLastFetchedTime(payload, ctx)) / 1000;
                                if (maxAgeInSeconds !== undefined && ageInSeconds > maxAgeInSeconds) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "expired",
                                                ageInSeconds: ageInSeconds,
                                                maxAgeInSeconds: maxAgeInSeconds
                                            }
                                        }
                                    ];
                                }
                                claimSet = new Set(claimVal);
                                isValid = val.every(function (v) {
                                    return claimSet.has(v);
                                });
                                return [
                                    2 /*return*/,
                                    isValid
                                        ? { isValid: isValid }
                                        : {
                                              isValid: isValid,
                                              reason: {
                                                  message: "wrong value",
                                                  expectedToInclude: val,
                                                  actualValue: claimVal
                                              }
                                          }
                                ];
                            });
                        });
                    }
                };
            },
            includesAny: function (val, maxAgeInSeconds, id) {
                if (maxAgeInSeconds === void 0) {
                    maxAgeInSeconds = _this.defaultMaxAgeInSeconds;
                }
                var DateProvider = dateProvider_1.default.getReferenceOrThrow().dateProvider;
                return {
                    id: id !== undefined ? id : _this.id,
                    refresh: function (ctx) {
                        return _this.refresh(ctx);
                    },
                    shouldRefresh: function (payload, ctx) {
                        if (maxAgeInSeconds !== undefined && maxAgeInSeconds < DateProvider.getThresholdInSeconds()) {
                            throw new Error(
                                "maxAgeInSeconds must be greater than or equal to the DateProvider threshold value -> ".concat(
                                    DateProvider.getThresholdInSeconds()
                                )
                            );
                        }
                        return (
                            _this.getValueFromPayload(payload, ctx) === undefined ||
                            // We know payload[this.id] is defined since the value is not undefined in this branch
                            (maxAgeInSeconds !== undefined &&
                                payload[_this.id].t < DateProvider.now() - maxAgeInSeconds * 1000)
                        );
                    },
                    validate: function (payload, ctx) {
                        return __awaiter(_this, void 0, void 0, function () {
                            var claimVal, ageInSeconds, claimSet, isValid;
                            return __generator(this, function (_a) {
                                claimVal = this.getValueFromPayload(payload, ctx);
                                if (claimVal === undefined) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "value does not exist",
                                                expectedToInclude: val,
                                                actualValue: claimVal
                                            }
                                        }
                                    ];
                                }
                                ageInSeconds = (DateProvider.now() - this.getLastFetchedTime(payload, ctx)) / 1000;
                                if (maxAgeInSeconds !== undefined && ageInSeconds > maxAgeInSeconds) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "expired",
                                                ageInSeconds: ageInSeconds,
                                                maxAgeInSeconds: maxAgeInSeconds
                                            }
                                        }
                                    ];
                                }
                                claimSet = new Set(claimVal);
                                isValid = val.some(function (v) {
                                    return claimSet.has(v);
                                });
                                return [
                                    2 /*return*/,
                                    isValid
                                        ? { isValid: isValid }
                                        : {
                                              isValid: isValid,
                                              reason: {
                                                  message: "wrong value",
                                                  expectedToIncludeAtLeastOneOf: val,
                                                  actualValue: claimVal
                                              }
                                          }
                                ];
                            });
                        });
                    }
                };
            },
            excludesAll: function (val, maxAgeInSeconds, id) {
                if (maxAgeInSeconds === void 0) {
                    maxAgeInSeconds = _this.defaultMaxAgeInSeconds;
                }
                var DateProvider = dateProvider_1.default.getReferenceOrThrow().dateProvider;
                return {
                    id: id !== undefined ? id : _this.id,
                    refresh: function (ctx) {
                        return _this.refresh(ctx);
                    },
                    shouldRefresh: function (payload, ctx) {
                        if (maxAgeInSeconds !== undefined && maxAgeInSeconds < DateProvider.getThresholdInSeconds()) {
                            throw new Error(
                                "maxAgeInSeconds must be greater than or equal to the DateProvider threshold value -> ".concat(
                                    DateProvider.getThresholdInSeconds()
                                )
                            );
                        }
                        return (
                            _this.getValueFromPayload(payload, ctx) === undefined ||
                            // We know payload[this.id] is defined since the value is not undefined in this branch
                            (maxAgeInSeconds !== undefined &&
                                payload[_this.id].t < DateProvider.now() - maxAgeInSeconds * 1000)
                        );
                    },
                    validate: function (payload, ctx) {
                        return __awaiter(_this, void 0, void 0, function () {
                            var claimVal, ageInSeconds, claimSet, isValid;
                            return __generator(this, function (_a) {
                                claimVal = this.getValueFromPayload(payload, ctx);
                                if (claimVal === undefined) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "value does not exist",
                                                expectedToNotInclude: val,
                                                actualValue: claimVal
                                            }
                                        }
                                    ];
                                }
                                ageInSeconds = (DateProvider.now() - this.getLastFetchedTime(payload, ctx)) / 1000;
                                if (maxAgeInSeconds !== undefined && ageInSeconds > maxAgeInSeconds) {
                                    return [
                                        2 /*return*/,
                                        {
                                            isValid: false,
                                            reason: {
                                                message: "expired",
                                                ageInSeconds: ageInSeconds,
                                                maxAgeInSeconds: maxAgeInSeconds
                                            }
                                        }
                                    ];
                                }
                                claimSet = new Set(claimVal);
                                isValid = val.every(function (v) {
                                    return !claimSet.has(v);
                                });
                                return [
                                    2 /*return*/,
                                    isValid
                                        ? { isValid: isValid }
                                        : {
                                              isValid: isValid,
                                              reason: {
                                                  message: "wrong value",
                                                  expectedToNotInclude: val,
                                                  actualValue: claimVal
                                              }
                                          }
                                ];
                            });
                        });
                    }
                };
            }
        };
        this.id = config.id;
        this.refresh = config.refresh;
        this.defaultMaxAgeInSeconds = config.defaultMaxAgeInSeconds;
    }
    PrimitiveArrayClaim.prototype.getValueFromPayload = function (payload, _userContext) {
        return payload[this.id] !== undefined ? payload[this.id].v : undefined;
    };
    PrimitiveArrayClaim.prototype.getLastFetchedTime = function (payload, _userContext) {
        return payload[this.id] !== undefined ? payload[this.id].t : undefined;
    };
    return PrimitiveArrayClaim;
})();
exports.PrimitiveArrayClaim = PrimitiveArrayClaim;
