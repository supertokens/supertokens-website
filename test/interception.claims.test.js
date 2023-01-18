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
const { spawn } = require("child_process");
let { BASE_URL_FOR_ST, BASE_URL, startST, checkSessionClaimsSupport } = require("./utils");
let puppeteer = require("puppeteer");
const assert = require("assert");
const { addGenericTestCases } = require("./interception.testgen");

addGenericTestCases((name, transferMethod, setupFunc, setupArgs = []) => {
    describe(`${name}: Session claims error handling`, function () {
        let browser;
        let page;

        let skipped = false;
        let loggedEvents = [];

        before(async function () {
            spawn(
                "./test/startServer",
                [process.env.INSTALL_PATH, process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT],
                {
                    // stdio: "inherit"
                }
            );
            await new Promise(r => setTimeout(r, 1000));
            if (!(await checkSessionClaimsSupport())) {
                skipped = true;
                this.skip();
            }
        });

        after(async function () {
            let instance = axios.create();
            if (!skipped) {
                await instance.post(BASE_URL_FOR_ST + "/after");
            }
            try {
                await instance.get(BASE_URL_FOR_ST + "/stop");
            } catch (err) {}
        });

        beforeEach(async function () {
            let instance = axios.create();
            await instance.post(BASE_URL_FOR_ST + "/beforeeach");
            await instance.post("http://localhost.org:8082/beforeeach"); // for cross domain
            await instance.post(BASE_URL + "/beforeeach");

            let launchRetries = 0;
            while (browser === undefined && launchRetries++ < 3) {
                try {
                    browser = await puppeteer.launch({
                        args: ["--no-sandbox", "--disable-setuid-sandbox"],
                        headless: true
                    });
                } catch {}
            }
            page = await browser.newPage();

            page.on("console", ev => {
                const text = ev.text();
                // console.log(text);
                if (text.startsWith("TEST_EV$")) {
                    loggedEvents.push(JSON.parse(text.substr(8)));
                }
            });
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            page.evaluate(BASE_URL => (window.BASE_URL = BASE_URL), BASE_URL);

            await page.evaluate(
                setupFunc,
                {
                    // enableDebugLogs: true
                },
                ...setupArgs
            );
            loggedEvents = [];
        });

        afterEach(async function () {
            if (browser) {
                await browser.close();
                browser = undefined;
            }
        });

        it("should return a parseable body and fire an event", async function () {
            await startST();
            try {
                await page.evaluate(async () => {
                    const userId = "testing-supertokens-website";

                    // Create a session
                    const loginResponse = await toTest({
                        url: `${BASE_URL}/login`,
                        method: "post",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId })
                    });

                    assertEqual(loginResponse.responseText, userId);
                    const resp = await toTest({
                        url: `${BASE_URL}/session-claims-error`,
                        method: "post",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId })
                    });
                    assertEqual(resp.statusCode, 403);

                    const parsed = await supertokens.getInvalidClaimsFromResponse({
                        response: { data: resp.responseText }
                    });
                    assertEqual(parsed.length, 1);
                    assertEqual(parsed[0].id, "test-claim-failing");
                    assertEqual(parsed[0].reason.message, "testReason");
                });

                const lastEvent = loggedEvents.pop();

                assert.strictEqual(lastEvent.action, "API_INVALID_CLAIM");
                assert.deepStrictEqual(lastEvent.claimValidationErrors, [
                    {
                        id: "test-claim-failing",
                        reason: {
                            message: "testReason"
                        }
                    }
                ]);
            } finally {
                await browser.close();
            }
        });

        it("should work with 403 responses without a body", async function () {
            await startST();
            try {
                await page.evaluate(async () => {
                    const userId = "testing-supertokens-website";

                    // Create a session
                    const loginResponse = await toTest({
                        url: `${BASE_URL}/login`,
                        method: "post",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId })
                    });

                    assertEqual(loginResponse.responseText, userId);
                    const resp = await toTest({
                        url: `${BASE_URL}/403-without-body`,
                        method: "post",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId })
                    });
                    assertEqual(resp.statusCode, 403);
                });

                assert.strictEqual(
                    loggedEvents.find(ev => ev.action === "API_INVALID_CLAIM"),
                    undefined
                );
            } finally {
                await browser.close();
            }
        });
    });
});
