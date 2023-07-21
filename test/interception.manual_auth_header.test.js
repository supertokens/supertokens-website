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
let {
    BASE_URL_FOR_ST,
    BASE_URL,
    startST,
    delay,
    getNumberOfTimesRefreshCalled,
    getNumberOfTimesRefreshAttempted
} = require("./utils");
let puppeteer = require("puppeteer");
const assert = require("assert");
const { addGenericTestCases } = require("./interception.testgen");

addGenericTestCases((name, transferMethod, setupFunc, setupArgs = []) => {
    describe(`${name} (manually added Authorization header)`, function () {
        let browser;
        let page;

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
        });

        after(async function () {
            let instance = axios.create();
            await instance.post(BASE_URL_FOR_ST + "/after");
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
                } catch {}
            }
            loggedEvents = [];
        });

        afterEach(async function () {
            if (browser) {
                await browser.close();
                browser = undefined;
            }
        });

        if (transferMethod === "header") {
            it("should ignore the auth header if it matches the current session", async function () {
                await startST();
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

                    assert.strictEqual(loginResponse.responseText, userId);

                    const accessToken = await supertokens.getAccessToken();
                    await delay(5);
                    assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                    const resp = await toTest({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`
                        }
                    });
                    assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
                    assert.strictEqual(resp.statusCode, 200);
                });
            });

            it("should ignore the auth header if it matches the current session even if the casing is different", async function () {
                await startST();
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

                    assert.strictEqual(loginResponse.responseText, userId);

                    const accessToken = await supertokens.getAccessToken();
                    await delay(5);
                    assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                    const resp = await toTest({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            authOriZation: `Bearer ${accessToken}`
                        }
                    });
                    assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
                    assert.strictEqual(resp.statusCode, 200);
                });
            });

            it("should ignore the auth header if it matches the current (revoked) session", async function () {
                await startST();
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

                    assert.strictEqual(loginResponse.responseText, userId);
                });

                // We simulate a revoked session by "breaking" the refresh token
                await page.setCookie({ name: "st-refresh-token", value: "asdf" });
                await page.evaluate(async () => {
                    window.accessToken = await supertokens.getAccessToken();
                    await delay(5);
                    assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 1);

                    const resp = await toTest({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            authOriZation: `Bearer ${accessToken}`
                        }
                    });

                    assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 2);
                    assert.strictEqual(resp.statusCode, 401);
                });
            });

            it("should not ignore the auth header if it doesn't match the current session", async function () {
                await startST();

                let calledWithCustomHeader = false;
                await page.setRequestInterception(true);
                page.on("request", req => {
                    const url = req.url();
                    if (url === BASE_URL + "/") {
                        if (req.headers()["authorization"] === `Bearer myOwnHehe`) {
                            calledWithCustomHeader = true;
                            req.respond({
                                status: 200,
                                body: JSON.stringify({
                                    message: "OK"
                                })
                            });
                        } else {
                            req.respond({
                                status: 500,
                                body: JSON.stringify({
                                    message: "Bad auth header"
                                })
                            });
                        }
                    } else {
                        req.continue();
                    }
                });

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

                    assert.strictEqual(loginResponse.responseText, userId);

                    await delay(5);
                    const resp = await toTest({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            Authorization: `Bearer myOwnHehe`
                        }
                    });
                    assert.strictEqual(resp.statusCode, 200);
                });
                assert.strictEqual(calledWithCustomHeader, true);
            });

            it("should not ignore the auth header if we are not doing interception", async function () {
                await startST();

                let calledWithAccessToken = false;
                await page.setRequestInterception(true);
                page.on("request", async req => {
                    const url = req.url();
                    if (url === "http://localhost:1234/") {
                        if (req.method() === "OPTIONS") {
                            req.respond({
                                status: 204,
                                headers: {
                                    "Access-Control-Allow-Origin": req.headers().origin,
                                    "Access-Control-Allow-Credentials": "true",
                                    "Access-Control-Allow-Headers": "*"
                                }
                            });
                        } else {
                            const cookies = await page.cookies();
                            let accessToken = cookies.find(c => c.name === "st-access-token").value;
                            if (req.headers()["authorization"] === `Bearer ${accessToken}`) {
                                calledWithAccessToken = true;
                                // By returning a 401 and checking that it doesn't call refresh we can be sure the interceptor is not active
                                req.respond({
                                    status: 401,
                                    headers: {
                                        "Access-Control-Allow-Origin": "*",
                                        "Access-Control-Allow-Credentials": "true",
                                        "Access-Control-Allow-Headers": "*"
                                    },
                                    body: JSON.stringify({
                                        message: "OK"
                                    })
                                });
                            } else {
                                req.respond({
                                    status: 500,
                                    headers: {
                                        "Access-Control-Allow-Origin": BASE_URL
                                    },
                                    body: JSON.stringify({
                                        message: "Bad auth header"
                                    })
                                });
                            }
                        }
                    } else {
                        req.continue();
                    }
                });
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

                    assert.strictEqual(loginResponse.responseText, userId);
                });

                // We simulate a revoked session by "breaking" the refresh token
                await page.setCookie({ name: "st-refresh-token", value: "asdf" });
                await page.evaluate(async () => {
                    window.accessToken = await supertokens.getAccessToken();
                    await delay(5);
                    assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                    const resp = await toTest({
                        url: `http://localhost:1234/`,
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            authOriZation: `Bearer ${accessToken}`
                        }
                    });

                    assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                    assert.strictEqual(resp.statusCode, 401);
                });
                assert.strictEqual(calledWithAccessToken, true);
            });
        } else {
            it("should not ignore the auth header", async function () {
                await startST();

                let calledWithCustomHeader = false;
                await page.setRequestInterception(true);
                page.on("request", req => {
                    const url = req.url();
                    if (url === BASE_URL + "/") {
                        if (req.headers()["authorization"] === `Bearer myOwnHehe`) {
                            calledWithCustomHeader = true;
                            req.respond({
                                status: 200,
                                body: JSON.stringify({
                                    message: "OK"
                                })
                            });
                        } else {
                            req.respond({
                                status: 500,
                                body: JSON.stringify({
                                    message: "Bad auth header"
                                })
                            });
                        }
                    } else {
                        req.continue();
                    }
                });

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

                    assert.strictEqual(loginResponse.responseText, userId);

                    await delay(5);
                    const resp = await toTest({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            Authorization: `Bearer myOwnHehe`
                        }
                    });
                    assert.strictEqual(resp.statusCode, 200);
                });
                assert.strictEqual(calledWithCustomHeader, true);
            });

            it("should not ignore the auth header even if it matches the stored access token", async function () {
                await startST();

                let calledWithCustomHeader = false;
                await page.setRequestInterception(true);
                page.on("request", req => {
                    const url = req.url();
                    if (url === BASE_URL + "/") {
                        if (req.headers()["authorization"] === `Bearer myOwnHehe`) {
                            calledWithCustomHeader = true;
                            req.respond({
                                status: 200,
                                body: JSON.stringify({
                                    message: "OK"
                                })
                            });
                        } else {
                            req.respond({
                                status: 500,
                                body: JSON.stringify({
                                    message: "Bad auth header"
                                })
                            });
                        }
                    } else {
                        req.continue();
                    }
                });

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

                    assert.strictEqual(loginResponse.responseText, userId);

                    await delay(5);
                    document.cookie = "st-access-token=myOwnHehe";
                    const resp = await toTest({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            Authorization: `Bearer myOwnHehe`
                        }
                    });
                    assert.strictEqual(resp.statusCode, 200);
                });
                assert.strictEqual(calledWithCustomHeader, true);
            });
        }
    });
});
