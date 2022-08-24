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

let axios = require("axios");
let jsdom = require("mocha-jsdom");
const { spawn } = require("child_process");
let { BASE_URL_FOR_ST, BASE_URL, startST, resetAuthHttpRequestFetch, checkSessionClaimsSupport } = require("./utils");
let { ProcessState } = require("../lib/build/processState");
let puppeteer = require("puppeteer");

describe("Session claims error handling", function() {
    jsdom({
        url: "http://localhost"
    });
    let skipped = false;

    before(async function() {
        spawn(
            "./test/startServer",
            [process.env.INSTALL_PATH, process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT],
            {
                stdio: "inherit"
            }
        );
        await new Promise(r => setTimeout(r, 1000));
        if (!(await checkSessionClaimsSupport())) {
            skipped = true;
            this.skip();
        }
    });

    after(async function() {
        let instance = axios.create();
        if (!skipped) {
            await instance.post(BASE_URL_FOR_ST + "/after");
        }
        try {
            await instance.get(BASE_URL_FOR_ST + "/stop");
        } catch (err) {}
    });

    beforeEach(async function() {
        resetAuthHttpRequestFetch();
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/beforeeach");
        await instance.post("http://localhost.org:8082/beforeeach"); // for cross domain
        await instance.post(BASE_URL + "/beforeeach");
    });

    describe("fetch", () => {
        it("should return a parseable body and fire an event", async function() {
            await startST();
            const browser = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });

            try {
                const page = await browser.newPage();
                await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
                await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
                await page.evaluate(async () => {
                    let lastEvent;
                    const BASE_URL = "http://localhost.org:8080";
                    supertokens.init({
                        apiDomain: BASE_URL,
                        onHandleEvent: ev => (lastEvent = ev)
                    });

                    const userId = "testing-supertokens-website";

                    // Create a session
                    const loginResponse = await fetch(`${BASE_URL}/login`, {
                        method: "post",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId })
                    });

                    assertEqual(await loginResponse.text(), userId);
                    const resp = await fetch(`${BASE_URL}/session-claims-error`, {
                        method: "post",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId })
                    });
                    assertEqual(resp.status, 403);

                    const parsed = await supertokens.getInvalidClaimsFromResponse({ response: resp });
                    assertEqual(parsed.length, 1);
                    assertEqual(parsed[0].id, "test-claim-failing");
                    assertEqual(parsed[0].reason.message, "testReason");

                    assertEqual(lastEvent.action, "API_INVALID_CLAIM");
                    assertEqual(JSON.stringify(lastEvent.claimValidationErrors), JSON.stringify(parsed));

                    // Just to test that we left the body intact
                    await resp.json();
                });
            } finally {
                await browser.close();
            }
        });

        it("should work with 403 responses without a body", async function() {
            await startST();
            const browser = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });

            try {
                const page = await browser.newPage();
                await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
                await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
                await page.evaluate(async () => {
                    let lastEvent;
                    const BASE_URL = "http://localhost.org:8080";
                    supertokens.init({
                        apiDomain: BASE_URL,
                        onHandleEvent: ev => (lastEvent = ev)
                    });
                    const userId = "testing-supertokens-website";

                    // Create a session
                    const loginResponse = await fetch(`${BASE_URL}/login`, {
                        method: "post",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId })
                    });

                    assertEqual(await loginResponse.text(), userId);
                    const resp = await fetch(`${BASE_URL}/403-without-body`, {
                        method: "post",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId })
                    });
                    assertEqual(resp.status, 403);

                    // Just to test that we left the body intact
                    assertEqual(resp.bodyUsed, false);
                    assertNotEqual(lastEvent.action, "API_INVALID_CLAIM");
                });
            } finally {
                await browser.close();
            }
        });
    });

    describe("axios", () => {
        it("should throw with a parseable body and fire an event", async function() {
            await startST();
            const browser = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });

            try {
                const page = await browser.newPage();

                await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
                await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
                await page.evaluate(async () => {
                    let lastEvent;
                    const BASE_URL = "http://localhost.org:8080";
                    supertokens.addAxiosInterceptors(axios);
                    supertokens.init({
                        apiDomain: BASE_URL,
                        onHandleEvent: ev => (lastEvent = ev)
                    });

                    const userId = "testing-supertokens-website";

                    // Create a session
                    const loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        }
                    });
                    const userIdFromResponse = loginResponse.data;
                    assertEqual(userId, userIdFromResponse);
                    let error;
                    try {
                        await axios.post(`${BASE_URL}/session-claims-error`, JSON.stringify({ userId }), {
                            headers: {
                                Accept: "application/json",
                                "Content-Type": "application/json"
                            }
                        });
                    } catch (ex) {
                        error = ex;
                    }

                    assertNotEqual(error, undefined);
                    assertEqual(error.response.status, 403);

                    const parsed = await supertokens.getInvalidClaimsFromResponse({ response: error.response });

                    assertEqual(parsed.length, 1);
                    assertEqual(parsed[0].id, "test-claim-failing");
                    assertEqual(parsed[0].reason.message, "testReason");

                    assertEqual(lastEvent.action, "API_INVALID_CLAIM");
                    assertEqual(JSON.stringify(lastEvent.claimValidationErrors), JSON.stringify(parsed));
                });
            } finally {
                await browser.close();
            }
        });

        it("should work with 403 responses without a body", async function() {
            await startST();
            const browser = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });

            try {
                const page = await browser.newPage();

                await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
                await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
                await page.evaluate(async () => {
                    let lastEvent;
                    const BASE_URL = "http://localhost.org:8080";
                    supertokens.addAxiosInterceptors(axios);
                    supertokens.init({
                        apiDomain: BASE_URL,
                        onHandleEvent: ev => (lastEvent = ev)
                    });

                    const userId = "testing-supertokens-website";

                    // Create a session
                    const loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        }
                    });
                    const userIdFromResponse = loginResponse.data;
                    assertEqual(userId, userIdFromResponse);
                    let error;
                    try {
                        await axios.post(`${BASE_URL}/403-without-body`, JSON.stringify({ userId }), {
                            headers: {
                                Accept: "application/json",
                                "Content-Type": "application/json"
                            }
                        });
                    } catch (ex) {
                        error = ex;
                    }

                    assertNotEqual(error, undefined);
                    assertEqual(error.response.status, 403);

                    assertNotEqual(lastEvent.action, "API_INVALID_CLAIM");
                });
            } finally {
                await browser.close();
            }
        });
    });
});
