/* Copyright (c) 2022, VRAI Labs and/or its affiliates. All rights reserved.
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
let jsdom = require("mocha-jsdom");
let AuthHttpRequest = require("../index.js").default;
let { default: AuthHttpRequestFetch } = require("../lib/build/fetch");
let { BASE_URL, BASE_URL_FOR_ST, startST, resetAuthHttpRequestFetch } = require("./utils");
let { default: CookieHandlerReference } = require("../lib/build/utils/cookieHandler/index");
const { spawn } = require("child_process");
let axios = require("axios");
let { ProcessState } = require("../lib/build/processState");
let puppeteer = require("puppeteer");
const assert = require("assert");

describe("Cookie Handler Tests", function () {
    let consoleLogs = [];

    jsdom({
        url: "http://localhost"
    });

    before(async function () {
        spawn("./test/startServer", [
            process.env.INSTALL_PATH,
            process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT
        ]);
        await new Promise(r => setTimeout(r, 1000));
    });

    after(async function () {
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/after");
        try {
            await instance.get(BASE_URL_FOR_ST + "/stop");
        } catch (err) {}
    });

    beforeEach(async function () {
        consoleLogs = [];
        CookieHandlerReference.instance = undefined;
        resetAuthHttpRequestFetch();
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/beforeeach");
        await instance.post(BASE_URL + "/beforeeach");
    });

    it("Test that cookie handler is set when calling init", function () {
        AuthHttpRequest.init({
            apiDomain: BASE_URL
        });

        // If cookie handler isnt set then this will throw
        CookieHandlerReference.getReferenceOrThrow();
    });

    it("Test that using cookie handler without calling init fails", function () {
        let testFailed = true;

        try {
            CookieHandlerReference.getReferenceOrThrow();
        } catch (e) {
            if (e.message === "SuperTokensCookieHandler must be initialized before calling this method.") {
                testFailed = false;
            }
        }

        assert(testFailed !== true, "Getting cookie handler reference should have failed but didnt");
    });

    it("Test that using default cookie handlers works fine", async function () {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);
                await delay(5);

                //check that the number of times the refreshAPI was called is 0
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                let getResponse = await fetch(`${BASE_URL}/`);

                //check that the response to getSession was success
                assertEqual(await getResponse.text(), userId);

                //check that the number of time the refreshAPI was called is 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    it("Test that using a custom cookie handler works as expected", async function () {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();

            page.on("console", event => {
                const log = event.text();

                if (log.startsWith("ST_LOGS")) {
                    consoleLogs.push(log);
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";

                function getCookieNameFromString(cookieString) {
                    return cookieString.split(";")[0].split("=")[0];
                }

                supertokens.init({
                    apiDomain: BASE_URL,
                    cookieHandler: function (original) {
                        return {
                            setCookie: async function (cookie) {
                                console.log("ST_LOGS SET_COOKIE", getCookieNameFromString(cookie));
                                return await original.setCookie(cookie);
                            },
                            getCookie: async function () {
                                console.log("ST_LOGS GET_COOKIE");
                                return await original.getCookie();
                            }
                        };
                    }
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);
            });

            assert(consoleLogs.includes("ST_LOGS GET_COOKIE"));
            assert(consoleLogs.includes("ST_LOGS SET_COOKIE st-last-access-token-update"));
            assert(consoleLogs.includes("ST_LOGS SET_COOKIE sAntiCsrf"));
            assert(consoleLogs.includes("ST_LOGS SET_COOKIE sFrontToken"));
            // Website SDK does not use the sync functions
            assert(!consoleLogs.includes("ST_LOGS GET_COOKIE_SYNC"));
            assert(!consoleLogs.includes("ST_LOGS SET_COOKIE_SYNC st-last-access-token-update"));
            assert(!consoleLogs.includes("ST_LOGS SET_COOKIE_SYNC sAntiCsrf"));
            assert(!consoleLogs.includes("ST_LOGS SET_COOKIE_SYNC sFrontToken"));
        } finally {
            await browser.close();
        }
    });

    it("Test that throwing an error in cookie handling gets propogated properly", async function () {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();

            page.on("console", event => {
                const log = event.text();

                console.log(log);
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    cookieHandler: function (original) {
                        return {
                            ...original,
                            getCookie: async function () {
                                throw new Error("Expected error in tests");
                            }
                        };
                    }
                });
                let userId = "testing-supertokens-website";
                let testFailed = true;

                try {
                    await fetch(`${BASE_URL}/login`, {
                        method: "post",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId })
                    });
                } catch (e) {
                    if (e.message === "Expected error in tests") {
                        testFailed = false;
                    }
                }

                assertEqual(testFailed, false);
            });
        } finally {
            await browser.close();
        }
    });
});
