"use strict";
var __extends =
    (this && this.__extends) ||
    (function () {
        var extendStatics = function (d, b) {
            extendStatics =
                Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array &&
                    function (d, b) {
                        d.__proto__ = b;
                    }) ||
                function (d, b) {
                    for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
                };
            return extendStatics(d, b);
        };
        return function (d, b) {
            if (typeof b !== "function" && b !== null)
                throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            extendStatics(d, b);
            function __() {
                this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
        };
    })();
var __assign =
    (this && this.__assign) ||
    function () {
        __assign =
            Object.assign ||
            function (t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
            };
        return __assign.apply(this, arguments);
    };
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooleanClaim = void 0;
var primitiveClaim_1 = require("./primitiveClaim");
var BooleanClaim = /** @class */ (function (_super) {
    __extends(BooleanClaim, _super);
    function BooleanClaim(config) {
        var _this = _super.call(this, config) || this;
        _this.validators = __assign(__assign({}, _this.validators), {
            isTrue: function (maxAge) {
                return _this.validators.hasValue(true, maxAge);
            },
            isFalse: function (maxAge) {
                return _this.validators.hasValue(false, maxAge);
            }
        });
        return _this;
    }
    return BooleanClaim;
})(primitiveClaim_1.PrimitiveClaim);
exports.BooleanClaim = BooleanClaim;
