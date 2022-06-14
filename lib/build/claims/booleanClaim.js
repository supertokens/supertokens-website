"use strict";
var __extends =
    (this && this.__extends) ||
    (function() {
        var extendStatics = function(d, b) {
            extendStatics =
                Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array &&
                    function(d, b) {
                        d.__proto__ = b;
                    }) ||
                function(d, b) {
                    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
                };
            return extendStatics(d, b);
        };
        return function(d, b) {
            extendStatics(d, b);
            function __() {
                this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
        };
    })();
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
var primitiveClaim_1 = require("./primitiveClaim");
var BooleanClaim = /** @class */ (function(_super) {
    __extends(BooleanClaim, _super);
    function BooleanClaim(config, customValidators) {
        var _this = this;
        var booleanValidators = {
            isTrue: function(maxAge) {
                if (maxAge) {
                    return _this.validators.hasFreshValue(true, maxAge);
                }
                return _this.validators.hasValue(true);
            },
            isFalse: function(maxAge) {
                if (maxAge) {
                    return _this.validators.hasFreshValue(false, maxAge);
                }
                return _this.validators.hasValue(false);
            }
        };
        if (customValidators) {
            _this = _super.call(this, config, __assign(__assign({}, booleanValidators), customValidators)) || this;
        } else {
            _this = _super.call(this, config, booleanValidators) || this;
        }
        return _this;
    }
    return BooleanClaim;
})(primitiveClaim_1.PrimitiveClaim);
exports.BooleanClaim = BooleanClaim;
