/* Copyright (c) 2020, VRAI Labs and/or its affiliates. All rights reserved.
 *
 * This software is licensed under the Apache License, Version 2.0 (the
 * "License") as published by the Apache Software Foundation.
 *
 * You may not use this file except in compliance with the License. You may
 * obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
let axios = require("axios");

let jsdom = require("mocha-jsdom");
let AuthHttpRequest = require("../index.js").default;
let {
    normaliseSessionScopeOrThrowError,
    normaliseURLPathOrThrowError,
    normaliseURLDomainOrThrowError,
    shouldDoInterceptionBasedOnUrl
} = require("../lib/build/utils");
let assert = require("assert");
let AuthHttpRequestFetch = require("../lib/build/fetch").default;

describe("Config tests", function() {
    jsdom({
        url: "http://localhost.org"
    });

    beforeEach(async function() {
        AuthHttpRequestFetch.initCalled = false;
        global.document = {};
    });

    it("testing shouldDoInterceptionBasedOnUrl", async function() {
        // true cases without cookieDomain
        assert(shouldDoInterceptionBasedOnUrl("api.example.com", "https://api.example.com", undefined));
        assert(shouldDoInterceptionBasedOnUrl("http://api.example.com", "http://api.example.com", undefined));
        assert(shouldDoInterceptionBasedOnUrl("api.example.com", "http://api.example.com", undefined));
        assert(shouldDoInterceptionBasedOnUrl("https://api.example.com", "http://api.example.com", undefined));
        assert(
            shouldDoInterceptionBasedOnUrl("https://api.example.com:3000", "http://api.example.com:3000", undefined)
        );
        assert(shouldDoInterceptionBasedOnUrl("localhost:3000", "localhost:3000", undefined));
        assert(shouldDoInterceptionBasedOnUrl("https://localhost:3000", "https://localhost:3000", undefined));
        assert(shouldDoInterceptionBasedOnUrl("http://localhost:3000", "http://localhost:3000", undefined));
        assert(shouldDoInterceptionBasedOnUrl("localhost:3000", "https://localhost:3000", undefined));
        assert(shouldDoInterceptionBasedOnUrl("localhost", "https://localhost", undefined));
        assert(shouldDoInterceptionBasedOnUrl("http://localhost:3000", "https://localhost:3000", undefined));
        assert(shouldDoInterceptionBasedOnUrl("127.0.0.1:3000", "127.0.0.1:3000", undefined));
        assert(shouldDoInterceptionBasedOnUrl("https://127.0.0.1:3000", "https://127.0.0.1:3000", undefined));
        assert(shouldDoInterceptionBasedOnUrl("http://127.0.0.1:3000", "http://127.0.0.1:3000", undefined));
        assert(shouldDoInterceptionBasedOnUrl("127.0.0.1:3000", "https://127.0.0.1:3000", undefined));
        assert(shouldDoInterceptionBasedOnUrl("http://127.0.0.1:3000", "https://127.0.0.1:3000", undefined));
        assert(shouldDoInterceptionBasedOnUrl("http://127.0.0.1", "https://127.0.0.1", undefined));
        assert(shouldDoInterceptionBasedOnUrl(window.location.hostname, "localhost.org", undefined));
        assert(shouldDoInterceptionBasedOnUrl(window.location.hostname, "http://localhost.org", undefined));

        // true cases with cookieDomain
        assert(shouldDoInterceptionBasedOnUrl("api.example.com", "", "api.example.com"));
        assert(shouldDoInterceptionBasedOnUrl("http://api.example.com", "", "http://api.example.com"));
        assert(shouldDoInterceptionBasedOnUrl("api.example.com", "", ".example.com"));
        assert(shouldDoInterceptionBasedOnUrl("https://api.example.com", "", "http://api.example.com"));
        assert(shouldDoInterceptionBasedOnUrl("https://api.example.com", "", "https://api.example.com"));
        assert(shouldDoInterceptionBasedOnUrl("https://sub.api.example.com", "", ".api.example.com"));
        assert(shouldDoInterceptionBasedOnUrl("https://sub.api.example.com", "", ".example.com"));
        assert(shouldDoInterceptionBasedOnUrl("https://sub.api.example.com:3000", "", ".example.com:3000"));
        assert(shouldDoInterceptionBasedOnUrl("https://sub.api.example.com:3000", "", ".example.com"));
        assert(shouldDoInterceptionBasedOnUrl("https://sub.api.example.com:3000", "", "https://sub.api.example.com"));
        assert(shouldDoInterceptionBasedOnUrl("https://api.example.com:3000", "", ".api.example.com"));
        assert(shouldDoInterceptionBasedOnUrl("localhost:3000", "", "localhost:3000"));
        assert(shouldDoInterceptionBasedOnUrl("https://localhost:3000", "", ".localhost:3000"));
        assert(shouldDoInterceptionBasedOnUrl("localhost", "", "localhost"));
        assert(shouldDoInterceptionBasedOnUrl("http://a.localhost:3000", "", ".localhost:3000"));
        assert(shouldDoInterceptionBasedOnUrl("127.0.0.1:3000", "", "127.0.0.1:3000"));
        assert(shouldDoInterceptionBasedOnUrl("https://127.0.0.1:3000", "", "https://127.0.0.1:3000"));
        assert(shouldDoInterceptionBasedOnUrl("http://127.0.0.1:3000", "", "http://127.0.0.1:3000"));
        assert(shouldDoInterceptionBasedOnUrl("127.0.0.1:3000", "", "https://127.0.0.1:3000"));
        assert(shouldDoInterceptionBasedOnUrl("http://127.0.0.1:3000", "", "https://127.0.0.1:3000"));
        assert(shouldDoInterceptionBasedOnUrl("http://127.0.0.1", "", "https://127.0.0.1"));
        assert(shouldDoInterceptionBasedOnUrl(window.location.hostname, "", ".localhost.org"));
        assert(shouldDoInterceptionBasedOnUrl(window.location.hostname, "", "localhost.org"));
        assert(shouldDoInterceptionBasedOnUrl("https://sub.api.example.com:3000", "", ".com"));
        assert(shouldDoInterceptionBasedOnUrl("https://sub.api.example.co.uk:3000", "", ".api.example.co.uk"));
        assert(shouldDoInterceptionBasedOnUrl("https://sub1.api.example.co.uk:3000", "", ".api.example.co.uk"));
        assert(shouldDoInterceptionBasedOnUrl("https://api.example.co.uk:3000", "", ".api.example.co.uk"));
        assert(shouldDoInterceptionBasedOnUrl("https://api.example.co.uk:3000", "", "api.example.co.uk"));

        // false cases with api
        assert(!shouldDoInterceptionBasedOnUrl("localhost:3001", "localhost:3000", undefined));
        assert(!shouldDoInterceptionBasedOnUrl("localhost:3001", "example.com", undefined));
        assert(!shouldDoInterceptionBasedOnUrl("localhost:3001", "localhost", undefined));
        assert(!shouldDoInterceptionBasedOnUrl("https://example.com", "https://api.example.com", undefined));
        assert(!shouldDoInterceptionBasedOnUrl("https://api.example.com", "https://a.api.example.com", undefined));
        assert(!shouldDoInterceptionBasedOnUrl("https://api.example.com", "https://example.com", undefined));
        assert(!shouldDoInterceptionBasedOnUrl("https://example.com:3001", "https://api.example.com:3001", undefined));
        assert(
            !shouldDoInterceptionBasedOnUrl("https://api.example.com:3002", "https://api.example.com:3001", undefined)
        );
        assert(!shouldDoInterceptionBasedOnUrl(window.location.hostname, "localhost.org:2000", undefined));

        // false cases with cookieDomain
        assert(!shouldDoInterceptionBasedOnUrl("https://sub.api.example.com:3000", "", ".example.com:3001"));
        assert(!shouldDoInterceptionBasedOnUrl("https://sub.api.example.com:3000", "", "example.com"));
        assert(!shouldDoInterceptionBasedOnUrl("https://api.example.com:3000", "", ".a.api.example.com"));
        assert(!shouldDoInterceptionBasedOnUrl("https://sub.api.example.com:3000", "", "localhost"));
        assert(!shouldDoInterceptionBasedOnUrl("http://127.0.0.1:3000", "", "https://127.0.0.1:3010"));
        assert(!shouldDoInterceptionBasedOnUrl(window.location.hostname, "", "localhost"));
        assert(!shouldDoInterceptionBasedOnUrl(window.location.hostname, "", ".localhost"));
        assert(!shouldDoInterceptionBasedOnUrl(window.location.hostname, "", "localhost:2000"));
        assert(!shouldDoInterceptionBasedOnUrl("https://sub.api.example.co.uk:3000", "", "api.example.co.uk"));
        assert(!shouldDoInterceptionBasedOnUrl("https://sub.api.example.co.uk", "", "api.example.co.uk"));

        // errors in input
        try {
            assert(shouldDoInterceptionBasedOnUrl("/some/path", "", "api.example.co.uk"));
            assert(false);
        } catch (err) {
            if (err.message !== "Please provide a valid domain name") {
                throw err;
            }
        }
        try {
            assert(shouldDoInterceptionBasedOnUrl("/some/path", "api.example.co.uk", undefined));
            assert(false);
        } catch (err) {
            if (err.message !== "Please provide a valid domain name") {
                throw err;
            }
        }
    });

    it("testing sessionScope normalisation", async function() {
        assert(normaliseSessionScopeOrThrowError("api.example.com") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError("http://api.example.com") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError("https://api.example.com") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError("http://api.example.com?hello=1") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError("http://api.example.com/hello") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError("http://api.example.com/") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError("http://api.example.com:8080") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError("http://api.example.com#random2") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError("api.example.com/") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError("api.example.com#random") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError("example.com") === "example.com");
        assert(normaliseSessionScopeOrThrowError("api.example.com/?hello=1&bye=2") === "api.example.com");
        assert(normaliseSessionScopeOrThrowError(window.location.hostname) === "localhost.org");
        assert(normaliseSessionScopeOrThrowError("localhost") === "localhost");
        assert(normaliseSessionScopeOrThrowError("localhost:8080") === "localhost");
        assert(normaliseSessionScopeOrThrowError("localhost.org") === "localhost.org");
        assert(normaliseSessionScopeOrThrowError("127.0.0.1") === "127.0.0.1");

        assert(normaliseSessionScopeOrThrowError(".api.example.com") === ".api.example.com");
        assert(normaliseSessionScopeOrThrowError(".api.example.com/") === ".api.example.com");
        assert(normaliseSessionScopeOrThrowError(".api.example.com#random") === ".api.example.com");
        assert(normaliseSessionScopeOrThrowError(".example.com") === ".example.com");
        assert(normaliseSessionScopeOrThrowError(".api.example.com/?hello=1&bye=2") === ".api.example.com");
        assert(normaliseSessionScopeOrThrowError("." + window.location.hostname) === ".localhost.org");
        assert(normaliseSessionScopeOrThrowError(".localhost") === "localhost");
        assert(normaliseSessionScopeOrThrowError(".localhost:8080") === "localhost");
        assert(normaliseSessionScopeOrThrowError(".localhost.org") === ".localhost.org");
        assert(normaliseSessionScopeOrThrowError(".127.0.0.1") === "127.0.0.1");

        try {
            normaliseSessionScopeOrThrowError("http://");
            assert(false);
        } catch (err) {
            assert(err.message === "Please provide a valid sessionScope");
        }
    });

    it("testing URL path normalisation", async function() {
        assert.strictEqual(normaliseURLPathOrThrowError("exists?email=john.doe%40gmail.com"), "/exists");
        assert.strictEqual(
            normaliseURLPathOrThrowError("/auth/email/exists?email=john.doe%40gmail.com"),
            "/auth/email/exists"
        );
        assert.strictEqual(normaliseURLPathOrThrowError("exists"), "/exists");
        assert.strictEqual(normaliseURLPathOrThrowError("/exists"), "/exists");
        assert.strictEqual(normaliseURLPathOrThrowError("/exists?email=john.doe%40gmail.com"), "/exists");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com"), "");
        assert.strictEqual(normaliseURLPathOrThrowError("https://api.example.com"), "");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com?hello=1"), "");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com/hello"), "/hello");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com/"), "");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com:8080"), "");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com#random2"), "");
        assert.strictEqual(normaliseURLPathOrThrowError("api.example.com/"), "");
        assert.strictEqual(normaliseURLPathOrThrowError("api.example.com#random"), "");
        assert.strictEqual(normaliseURLPathOrThrowError(".example.com"), "");
        assert.strictEqual(normaliseURLPathOrThrowError("api.example.com/?hello=1&bye=2"), "");
        assert.strictEqual(normaliseURLPathOrThrowError(window.location.hostname), "");

        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("http://1.2.3.4/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("1.2.3.4/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("https://api.example.com/one/two/"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com/one/two?hello=1"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com/hello/"), "/hello");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com/one/two/"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com:8080/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("http://api.example.com/one/two#random2"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("api.example.com/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("api.example.com/one/two/#random"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError(".example.com/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("api.example.com/one/two?hello=1&bye=2"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError(window.location.hostname + "/one/two"), "/one/two");

        assert.strictEqual(normaliseURLPathOrThrowError("/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("one/two/"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("/one"), "/one");
        assert.strictEqual(normaliseURLPathOrThrowError("one"), "/one");
        assert.strictEqual(normaliseURLPathOrThrowError("one/"), "/one");
        assert.strictEqual(normaliseURLPathOrThrowError("/one/two/"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("/one/two?hello=1"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("one/two?hello=1"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("/one/two/#random"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("one/two#random"), "/one/two");

        assert.strictEqual(normaliseURLPathOrThrowError("localhost:4000/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("127.0.0.1:4000/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("127.0.0.1/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("https://127.0.0.1:80/one/two"), "/one/two");
        assert.strictEqual(normaliseURLPathOrThrowError("/"), "");

        assert.strictEqual(normaliseURLPathOrThrowError("/.netlify/functions/api"), "/.netlify/functions/api");
        assert.strictEqual(normaliseURLPathOrThrowError("/netlify/.functions/api"), "/netlify/.functions/api");
        assert.strictEqual(
            normaliseURLPathOrThrowError("app.example.com/.netlify/functions/api"),
            "/.netlify/functions/api"
        );
        assert.strictEqual(
            normaliseURLPathOrThrowError("app.example.com/netlify/.functions/api"),
            "/netlify/.functions/api"
        );
        assert.strictEqual(normaliseURLPathOrThrowError("/app.example.com"), "/app.example.com");
    });

    it("testing URL domain normalisation", async function() {
        assert(normaliseURLDomainOrThrowError("http://api.example.com") === "http://api.example.com");
        assert(normaliseURLDomainOrThrowError("https://api.example.com") === "https://api.example.com");
        assert(normaliseURLDomainOrThrowError("http://api.example.com?hello=1") === "http://api.example.com");
        assert(normaliseURLDomainOrThrowError("http://api.example.com/hello") === "http://api.example.com");
        assert(normaliseURLDomainOrThrowError("http://api.example.com/") === "http://api.example.com");
        assert(normaliseURLDomainOrThrowError("http://api.example.com:8080") === "http://api.example.com:8080");
        assert(normaliseURLDomainOrThrowError("http://api.example.com#random2") === "http://api.example.com");
        assert(normaliseURLDomainOrThrowError("api.example.com/") === "https://api.example.com");
        assert(normaliseURLDomainOrThrowError("api.example.com") === "https://api.example.com");
        assert(normaliseURLDomainOrThrowError("api.example.com#random") === "https://api.example.com");
        assert(normaliseURLDomainOrThrowError(".example.com") === "https://example.com");
        assert(normaliseURLDomainOrThrowError("api.example.com/?hello=1&bye=2") === "https://api.example.com");
        assert(normaliseURLDomainOrThrowError(window.location.hostname) === "http://localhost.org");
        assert(normaliseURLDomainOrThrowError("localhost") === "http://localhost");
        assert(normaliseURLDomainOrThrowError("https://localhost") === "https://localhost");

        assert(normaliseURLDomainOrThrowError("http://api.example.com/one/two") === "http://api.example.com");
        assert(normaliseURLDomainOrThrowError("http://1.2.3.4/one/two") === "http://1.2.3.4");
        assert(normaliseURLDomainOrThrowError("https://1.2.3.4/one/two") === "https://1.2.3.4");
        assert(normaliseURLDomainOrThrowError("1.2.3.4/one/two") === "http://1.2.3.4");
        assert(normaliseURLDomainOrThrowError("https://api.example.com/one/two/") === "https://api.example.com");
        assert(normaliseURLDomainOrThrowError("http://api.example.com/one/two?hello=1") === "http://api.example.com");
        assert(normaliseURLDomainOrThrowError("http://api.example.com/one/two#random2") === "http://api.example.com");
        assert(normaliseURLDomainOrThrowError("api.example.com/one/two") === "https://api.example.com");
        assert(normaliseURLDomainOrThrowError("api.example.com/one/two/#random") === "https://api.example.com");
        assert(normaliseURLDomainOrThrowError(".example.com/one/two") === "https://example.com");
        assert(normaliseURLDomainOrThrowError(window.location.hostname + "/one/two") === "http://localhost.org");
        assert(normaliseURLDomainOrThrowError("localhost:4000") === "http://localhost:4000");
        assert(normaliseURLDomainOrThrowError("127.0.0.1:4000") === "http://127.0.0.1:4000");
        assert(normaliseURLDomainOrThrowError("127.0.0.1") === "http://127.0.0.1");
        assert(normaliseURLDomainOrThrowError("https://127.0.0.1:80/") === "https://127.0.0.1:80");
        assert(normaliseURLDomainOrThrowError("http://localhost.org:8080") === "http://localhost.org:8080");

        try {
            normaliseURLDomainOrThrowError("/one/two");
            assert(false);
        } catch (err) {
            assert(err.message === "Please provide a valid domain name");
        }

        try {
            normaliseURLDomainOrThrowError("/.netlify/functions/api");
            assert(false);
        } catch (err) {
            assert(err.message === "Please provide a valid domain name");
        }
    });

    it("testing various input configs", async function() {
        {
            AuthHttpRequest.init({
                apiDomain: "example.com",
                apiBasePath: "/"
            });
            assert(AuthHttpRequestFetch.refreshTokenUrl === "https://example.com/session/refresh");
            assert(AuthHttpRequestFetch.config.apiDomain === "https://example.com");
        }

        {
            AuthHttpRequest.init({
                apiDomain: "https://api.example.com",
                apiBasePath: "/some/path/"
            });
            assert(AuthHttpRequestFetch.refreshTokenUrl === "https://api.example.com/some/path/session/refresh");
            assert(AuthHttpRequestFetch.config.apiDomain === "https://api.example.com");
        }

        {
            AuthHttpRequest.init({
                apiDomain: "localhost",
                apiBasePath: "/some/path/"
            });
            assert(AuthHttpRequestFetch.refreshTokenUrl === "http://localhost/some/path/session/refresh");
            assert(AuthHttpRequestFetch.config.apiDomain === "http://localhost");
        }

        {
            AuthHttpRequest.init({
                apiDomain: "localhost:9000",
                apiBasePath: "/some/path/"
            });
            assert(AuthHttpRequestFetch.refreshTokenUrl === "http://localhost:9000/some/path/session/refresh");
            assert(AuthHttpRequestFetch.config.apiDomain === "http://localhost:9000");
        }

        {
            AuthHttpRequest.init({
                apiDomain: "https://localhost:9000",
                apiBasePath: "/some/path/"
            });
            assert(AuthHttpRequestFetch.refreshTokenUrl === "https://localhost:9000/some/path/session/refresh");
            assert(AuthHttpRequestFetch.config.apiDomain === "https://localhost:9000");
        }

        {
            AuthHttpRequest.init({
                apiDomain: "example.com",
                apiBasePath: "/some/path/",
                sessionExpiredStatusCode: 402
            });
            assert(AuthHttpRequestFetch.refreshTokenUrl === "https://example.com/some/path/session/refresh");
            assert(AuthHttpRequestFetch.config.sessionExpiredStatusCode === 402);
        }

        {
            AuthHttpRequest.init({
                apiDomain: "example.com"
            });
            assert(AuthHttpRequestFetch.refreshTokenUrl === "https://example.com/auth/session/refresh");
            assert(AuthHttpRequestFetch.config.sessionScope === "localhost.org");
            assert(Object.keys(AuthHttpRequestFetch.config.refreshAPICustomHeaders).length === 0);
        }

        {
            AuthHttpRequest.init({
                apiDomain: "example.com",
                sessionScope: "a.b.example.com"
            });
            assert(AuthHttpRequestFetch.refreshTokenUrl === "https://example.com/auth/session/refresh");
            assert(AuthHttpRequestFetch.config.sessionScope === "a.b.example.com");
        }
    });
});
