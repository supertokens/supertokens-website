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

let puppeteer = require("puppeteer");
let jsdom = require("mocha-jsdom");
let decodeJWT = require("jsonwebtoken").decode;
let verifyJWT = require("jsonwebtoken").verify;
let jwksClient = require("jwks-rsa");
let AuthHttpRequest = require("../index.js").default;
let AuthHttpRequestFetch = require("../lib/build/fetch").default;
let AuthHttpRequestAxios = require("../lib/build/axios").default;
let { interceptorFunctionRequestFulfilled, responseInterceptor } = require("../lib/build/axios");
let assert = require("assert");
let {
    delay,
    checkIfIdRefreshIsCleared,
    getNumberOfTimesRefreshCalled,
    setupCoreAppAndSTWithJWTEnabled,
    getNumberOfTimesGetSessionCalled,
    BASE_URL,
    BASE_URL_FOR_ST,
    CROSS_DOMAIN_NODE_URL,
    getNumberOfTimesRefreshAttempted,
    coreTagEqualToOrAfter,
    checkIfJWTIsEnabled,
    resetAuthHttpRequestFetch,
    setupCoreApp,
    setupST
} = require("./utils");
let { ProcessState } = require("../lib/build/processState");

AuthHttpRequest.addAxiosInterceptors(axios);

describe("Axios AuthHttpRequest class tests", function () {
    jsdom({
        url: "http://localhost"
    });

    after(async function () {
        let instance = axios.create();
        await instance.post(`${BASE_URL}/after`);
    });

    beforeEach(async function () {
        resetAuthHttpRequestFetch();
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(`${BASE_URL_FOR_ST}/beforeeach`);
        await instance.post(`${CROSS_DOMAIN_NODE_URL}/beforeeach`); // for cross domain
        await instance.post(`${BASE_URL}/beforeeach`);
    });

    it("refresh session, signing key interval change", async function () {
        const coreUrl = await setupCoreApp({ accessTokenValidity: 100, accessTokenSigningKeyUpdateInterval: "0.002" });
        await setupST({ coreUrl, enableAntiCsrf: true });
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(
                async (coreSupportsMultipleSignigKeys, BASE_URL) => {
                    supertokens.addAxiosInterceptors(axios);
                    supertokens.init({
                        apiDomain: BASE_URL
                    });
                    let userId = "testing-supertokens-website";
                    let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        }
                    });
                    let userIdFromResponse = loginResponse.data;
                    assertEqual(userId, userIdFromResponse);
                    await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                    assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                    await delay(11);

                    let promises = [];
                    for (let i = 0; i < 250; i++) {
                        promises.push(
                            axios({
                                url: `${BASE_URL}/`,
                                method: "GET",
                                headers: { "Cache-Control": "no-cache, private" }
                            })
                        );
                    }
                    for (let i = 0; i < 250; i++) {
                        await promises[i];
                    }

                    assertEqual(await getNumberOfTimesRefreshCalled(), coreSupportsMultipleSignigKeys ? 0 : 1);
                },
                coreTagEqualToOrAfter("3.6.0"),
                BASE_URL
            );
        } finally {
            await browser.close();
        }
    });

    it("refresh session endpoint responding with 500 rejects original request with axios error", async function () {
        const coreUrl = await setupCoreApp({ accessTokenValidity: 100, accessTokenSigningKeyUpdateInterval: "0.002" });
        await setupST({ coreUrl, enableAntiCsrf: true });
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            let firstGet = true;
            let firstPost = true;
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/") {
                    if (firstGet) {
                        firstGet = false;
                        req.respond({
                            status: 401,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                    } else {
                        req.respond({
                            status: 200,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                success: true
                            })
                        });
                    }
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    if (firstPost) {
                        req.respond({
                            status: 401,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                        firstPost = false;
                    } else {
                        req.respond({
                            status: 500,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "test"
                            })
                        });
                    }
                } else {
                    req.continue();
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            // page.on("console", l => console.log(l.text()));
            await page.evaluate(async BASE_URL => {
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let exception;
                try {
                    const res = await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                } catch (ex) {
                    exception = ex;
                }
                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                // assertEqual(exception.config.url, `${BASE_URL}/auth/session/refresh`);
                assertEqual(exception.response.status, 500);
                assertNotEqual(exception.response.data, undefined);
                assertEqual(exception.response.data.message, "test");
            }, BASE_URL);
        } finally {
            await browser.close();
        }
    });

    it("API returning 401 will not call refresh after logout", async function () {
        const coreUrl = await setupCoreApp({ accessTokenValidity: 100, accessTokenSigningKeyUpdateInterval: "0.002" });
        await setupST({ coreUrl, enableAntiCsrf: true });
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            // page.on("console", l => console.log(l.text()));

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async BASE_URL => {
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);
                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(await logoutResponse.data, "success");

                const refreshAttemptedBeforeApiCall = await getNumberOfTimesRefreshAttempted();

                let exception;
                try {
                    await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                } catch (ex) {
                    exception = ex;
                }

                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                // assertEqual(exception.config.url, `${BASE_URL}/`);
                assertEqual(exception.response.status, 401);

                assertEqual(await getNumberOfTimesRefreshAttempted(), refreshAttemptedBeforeApiCall);
            }, BASE_URL);
        } finally {
            await browser.close();
        }
    });

    it("refresh session endpoint responding with 401 rejects original call with axios error", async function () {
        const coreUrl = await setupCoreApp({ accessTokenValidity: 100, accessTokenSigningKeyUpdateInterval: "0.002" });
        await setupST({ coreUrl, enableAntiCsrf: true });
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            // page.on("console", l => console.log(l.text()));
            let firstGet = true;
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/") {
                    if (firstGet) {
                        firstGet = false;
                        req.respond({
                            status: 401,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                    } else {
                        req.respond({
                            status: 200,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                success: true
                            })
                        });
                    }
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    req.respond({
                        status: 401,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            message: "test"
                        })
                    });
                    firstPost = false;
                } else {
                    req.continue();
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async BASE_URL => {
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let exception;
                try {
                    await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                } catch (ex) {
                    exception = ex;
                }
                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                // assertEqual(exception.config.url, `${BASE_URL}/auth/session/refresh`);
                assertEqual(exception.response.status, 401);
                assertNotEqual(exception.response.data, undefined);
                assertEqual(exception.response.data.message, "test");
            }, BASE_URL);
        } finally {
            await browser.close();
        }
    });

    it("no refresh call after 401 response that removes session", async function () {
        const coreUrl = await setupCoreApp({ accessTokenValidity: 100, accessTokenSigningKeyUpdateInterval: "0.002" });
        await setupST({ coreUrl, enableAntiCsrf: true });
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            let refreshCalled = 0;
            page.on("request", req => {
                const url = req.url();
                // console.log('r', url);
                if (url === BASE_URL + "/") {
                    req.respond({
                        status: 401,
                        body: JSON.stringify({ message: "test" }),
                        headers: {
                            "Content-Type": "application/json",
                            "Set-Cookie": [
                                "sAccessToken=remove; Path=/; Expires=Fri, 31 Dec 9999 23:59:59 GMT; HttpOnly; SameSite=Lax",
                                "sRefreshToken=; Path=/auth/session/refresh; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
                            ],
                            "front-token": "remove"
                        }
                    });
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    ++refreshCalled;
                    req.respond({
                        status: 401,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ message: "nope" })
                    });
                } else {
                    req.continue();
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            // page.on("console", l => console.log(l.text()));
            await page.evaluate(async BASE_URL => {
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let exception;
                try {
                    await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                } catch (ex) {
                    exception = ex;
                }
                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                // assertEqual(exception.config.url, `${BASE_URL}/`);
                assertEqual(exception.response.status, 401);
                assertNotEqual(exception.response.data, undefined);
                assertEqual(exception.response.data.message, "test");
            }, BASE_URL);

            // Calls it once before login, but it shouldn't after that
            assert.equal(refreshCalled, 1);
        } finally {
            await browser.close();
        }
    });

    it("original endpoint responding with 500 should not call refresh without cookies", async function () {
        const coreUrl = await setupCoreApp({ accessTokenValidity: 100, accessTokenSigningKeyUpdateInterval: "0.002" });
        await setupST({ coreUrl, enableAntiCsrf: true });
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        let refreshCalled = 0;
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);

            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/") {
                    req.respond({
                        status: 500,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            message: "test"
                        })
                    });
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    ++refreshCalled;
                    req.respond({
                        status: 500,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            message: "nope"
                        })
                    });
                } else {
                    req.continue();
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            // page.on("console", l => console.log(l.text()));
            await page.evaluate(async BASE_URL => {
                supertokens.init({
                    apiDomain: BASE_URL
                });
                supertokens.addAxiosInterceptors(axios);

                let exception;
                try {
                    await axios.get(`${BASE_URL}/`, { method: "GET" });
                } catch (ex) {
                    exception = ex;
                }
                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                // assertEqual(exception.config.url, `${BASE_URL}/`);
                assertEqual(exception.response.status, 500);
                assertNotEqual(exception.response.data, undefined);
                assertEqual(exception.response.data.message, "test");
            }, BASE_URL);
            // This will make the call twice - once by the axios interceptor and once by the xhr interceptor
            // But neither after the request was sent
            assert.equal(refreshCalled, 1);
        } finally {
            await browser.close();
        }
    });

    it("refresh throwing an error with empty body doesn't cause an error", async function () {
        const coreUrl = await setupCoreApp({ accessTokenValidity: 100, accessTokenSigningKeyUpdateInterval: "0.002" });
        await setupST({ coreUrl, enableAntiCsrf: true });
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("console", l => console.log(l.text()));
            let firstGet = true;
            page.on("request", req => {
                const url = req.url();
                // console.log(url);
                if (url === BASE_URL + "/") {
                    if (firstGet) {
                        firstGet = false;
                        req.respond({
                            status: 401,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                    } else {
                        req.respond({
                            status: 200,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                success: true
                            })
                        });
                    }
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    req.respond({
                        status: 401,
                        body: new Uint8Array()
                    });
                    firstPost = false;
                } else {
                    req.continue();
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async BASE_URL => {
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let exception;
                try {
                    await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                } catch (ex) {
                    exception = ex;
                }
                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                assertEqual(exception.response.status, 401);
                assertNotEqual(exception.response.data, undefined);
                assertEqual(exception.response.data, "");
                // assertEqual(exception.config.url, `${BASE_URL}/auth/session/refresh`);
            }, BASE_URL);
        } finally {
            await browser.close();
        }
    });

    it("Test that openid discovery and get jwks APIs have no cors origin restrictions", async function () {
        await setupCoreAppAndSTWithJWTEnabled();

        let isJwtEnabled = await checkIfJWTIsEnabled();

        if (!isJwtEnabled) {
            return;
        }

        let instance = axios.create();

        let discoveryResponse = await instance.get(`${BASE_URL}/auth/.well-known/openid-configuration`);

        assert.equal(discoveryResponse.headers["access-control-allow-origin"], "*");

        let getJWKSResponse = await instance.get(`${BASE_URL}/auth/jwt/jwks.json`);

        assert.equal(getJWKSResponse.headers["access-control-allow-origin"], "*");
    });

    it("test no debug logs when its disabled", async function () {
        const coreUrl = await setupCoreApp({ accessTokenValidity: 3 });
        await setupST({ coreUrl });
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            const logs = [];
            page.on("console", ev => {
                const logText = ev.text();
                if (logText.startsWith("com.supertokens")) {
                    logs.push(logText);
                }
            });
            await page.evaluate(async BASE_URL => {
                supertokens.init({
                    apiDomain: BASE_URL
                });
            }, BASE_URL);
            if (logs.length > 0) {
                throw new Error("Test failed");
            }
        } finally {
            await browser.close();
        }
    });

    it("test debug logs when its enabled", async function () {
        const coreUrl = await setupCoreApp({ accessTokenValidity: 3 });
        await setupST({ coreUrl });
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            const logs = [];
            page.on("console", ev => {
                const logText = ev.text();
                if (logText.startsWith("com.supertokens")) {
                    logs.push(logText);
                }
            });
            await page.evaluate(async BASE_URL => {
                supertokens.init({
                    apiDomain: BASE_URL,
                    enableDebugLogs: true
                });
            }, BASE_URL);
            if (logs.length <= 0) {
                throw new Error("Test failed");
            }
        } finally {
            await browser.close();
        }
    });
});
