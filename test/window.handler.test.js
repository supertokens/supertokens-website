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
let { BASE_URL, BASE_URL_FOR_ST, startST, resetAuthHttpRequestFetch } = require("./utils");
let { default: WindowHandlerReference } = require("../lib/build/utils/windowHandler/index");
const { spawn } = require("child_process");
let axios = require("axios");
let { ProcessState } = require("../lib/build/processState");
let puppeteer = require("puppeteer");
const assert = require("assert");

describe("Window handler tests", function () {
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
        WindowHandlerReference.instance = undefined;
        resetAuthHttpRequestFetch();
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/beforeeach");
        await instance.post(BASE_URL + "/beforeeach");
    });

    it("Test that window handler is set when calling init", function () {
        AuthHttpRequest.init({
            apiDomain: BASE_URL
        });

        // If window handler isnt set then this will throw
        WindowHandlerReference.getReferenceOrThrow();
    });

    it("Test that using window handler without calling init fails", function () {
        let testFailed = true;

        try {
            WindowHandlerReference.getReferenceOrThrow();
        } catch (e) {
            if (e.message === "SuperTokensWindowHandler must be initialized before calling this method.") {
                testFailed = false;
            }
        }

        assert(testFailed !== true, "Getting window handler reference should have failed but didnt");
    });

    it("Test that using default window handlers works fine", async function () {
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

    it("Test that using custom window handler works as expected", async function () {
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
                supertokens.init({
                    apiDomain: BASE_URL,
                    windowHandler: function (original) {
                        return {
                            ...original,
                            location: {
                                ...original.location,
                                getOrigin: function () {
                                    console.log("ST_LOGS GET_ORIGIN");
                                    return original.location.getOrigin();
                                },
                                getHostName: function () {
                                    console.log("ST_LOGS GET_HOST_NAME");
                                    return original.location.getHostName();
                                }
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

            assert(consoleLogs.includes("ST_LOGS GET_HOST_NAME"));
            // Get origin only gets called when the request url is a path
            assert(!consoleLogs.includes("ST_LOGS GET_ORIGIN"));
        } finally {
            await browser.close();
        }
    });

    it("Test that making a request with only path results in getOrigin being called", async function () {
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
                supertokens.init({
                    apiDomain: BASE_URL,
                    windowHandler: function (original) {
                        return {
                            ...original,
                            location: {
                                ...original.location,
                                getOrigin: function () {
                                    console.log("ST_LOGS GET_ORIGIN");
                                    return original.location.getOrigin();
                                },
                                getHostName: function () {
                                    console.log("ST_LOGS GET_HOST_NAME");
                                    return original.location.getHostName();
                                }
                            }
                        };
                    }
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);
            });

            assert(consoleLogs.includes("ST_LOGS GET_HOST_NAME"));
            assert(consoleLogs.includes("ST_LOGS GET_ORIGIN"));
        } finally {
            await browser.close();
        }
    });

    it("Test that errors thrown in custom handlers get propogated correctly", async function () {
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
                let testFailed = true;

                try {
                    supertokens.init({
                        apiDomain: BASE_URL,
                        windowHandler: function (original) {
                            return {
                                ...original,
                                location: {
                                    ...original.location,
                                    getOrigin: function () {
                                        throw new Error("GET_ORIGIN: Expected error in tests");
                                    },
                                    getHostName: function () {
                                        throw new Error("GET_HOST_NAME: Expected error in tests");
                                    }
                                }
                            };
                        }
                    });
                } catch (e) {
                    if (e.message === "GET_HOST_NAME: Expected error in tests") {
                        testFailed = false;
                    }
                }

                assertEqual(testFailed, false);
            });
        } finally {
            await browser.close();
        }
    });

    it("Test that errors thrown in custom handlers get propogated correctly (getOrigin)", async function () {
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
                let testFailed = true;

                try {
                    supertokens.init({
                        apiDomain: BASE_URL,
                        windowHandler: function (original) {
                            return {
                                ...original,
                                location: {
                                    ...original.location,
                                    getOrigin: function () {
                                        throw new Error("GET_ORIGIN: Expected error in tests");
                                    }
                                }
                            };
                        }
                    });

                    let userId = "testing-supertokens-website";

                    await fetch(`/login`, {
                        method: "post",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId })
                    });
                } catch (e) {
                    if (e.message === "GET_ORIGIN: Expected error in tests") {
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
