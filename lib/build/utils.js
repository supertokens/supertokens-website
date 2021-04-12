"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var normalisedURLDomain_1 = require("./normalisedURLDomain");
var normalisedURLPath_1 = require("./normalisedURLPath");
function isAnIpAddress(ipaddress) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        ipaddress
    );
}
exports.isAnIpAddress = isAnIpAddress;
function normaliseURLDomainOrThrowError(input) {
    var str = new normalisedURLDomain_1.default(input).getAsStringDangerous();
    return str;
}
exports.normaliseURLDomainOrThrowError = normaliseURLDomainOrThrowError;
function normaliseURLPathOrThrowError(input) {
    return new normalisedURLPath_1.default(input).getAsStringDangerous();
}
exports.normaliseURLPathOrThrowError = normaliseURLPathOrThrowError;
function normaliseSessionScopeOrThrowError(sessionScope) {
    function helper(sessionScope) {
        sessionScope = sessionScope.trim().toLowerCase();
        // first we convert it to a URL so that we can use the URL class
        if (sessionScope.startsWith(".")) {
            sessionScope = sessionScope.substr(1);
        }
        if (!sessionScope.startsWith("http://") && !sessionScope.startsWith("https://")) {
            sessionScope = "http://" + sessionScope;
        }
        try {
            var urlObj = new URL(sessionScope);
            sessionScope = urlObj.hostname;
            // remove leading dot
            if (sessionScope.startsWith(".")) {
                sessionScope = sessionScope.substr(1);
            }
            return sessionScope;
        } catch (err) {
            throw new Error("Please provide a valid sessionScope");
        }
    }
    function isAnIpAddress(ipaddress) {
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
            ipaddress
        );
    }
    var noDotNormalised = helper(sessionScope);
    if (noDotNormalised === "localhost" || isAnIpAddress(noDotNormalised)) {
        return noDotNormalised;
    }
    if (sessionScope.startsWith(".")) {
        return "." + noDotNormalised;
    }
    return noDotNormalised;
}
exports.normaliseSessionScopeOrThrowError = normaliseSessionScopeOrThrowError;
function validateAndNormaliseInputOrThrowError(options) {
    var apiDomain = normaliseURLDomainOrThrowError(options.apiDomain);
    var apiBasePath = normaliseURLPathOrThrowError("/auth");
    if (options.apiBasePath !== undefined) {
        apiBasePath = normaliseURLPathOrThrowError(options.apiBasePath);
    }
    var sessionScope = undefined;
    if (options.sessionScope !== undefined) {
        sessionScope = {
            scope: normaliseSessionScopeOrThrowError(options.sessionScope.scope),
            authDomain: normaliseURLDomainOrThrowError(options.sessionScope.authDomain)
        };
    }
    var refreshAPICustomHeaders = {};
    if (options.refreshAPICustomHeaders !== undefined) {
        refreshAPICustomHeaders = options.refreshAPICustomHeaders;
    }
    var sessionExpiredStatusCode = 401;
    if (options.sessionExpiredStatusCode !== undefined) {
        sessionExpiredStatusCode = options.sessionExpiredStatusCode;
    }
    var autoAddCredentials = true;
    if (options.autoAddCredentials !== undefined) {
        autoAddCredentials = options.autoAddCredentials;
    }
    return {
        apiDomain: apiDomain,
        apiBasePath: apiBasePath,
        sessionScope: sessionScope,
        refreshAPICustomHeaders: refreshAPICustomHeaders,
        sessionExpiredStatusCode: sessionExpiredStatusCode,
        autoAddCredentials: autoAddCredentials
    };
}
exports.validateAndNormaliseInputOrThrowError = validateAndNormaliseInputOrThrowError;
function getWindowOrThrow() {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }
    return window;
}
exports.getWindowOrThrow = getWindowOrThrow;
//# sourceMappingURL=utils.js.map
