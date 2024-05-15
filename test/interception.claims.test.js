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
                            // enableDebugLogs: true,
                            // This isn't used in all tests but it only produces some extra logs
                            override: ["log_calculateClockSkewInMillis"]
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

        it("should call the claim refresh endpoint once for multiple `shouldRefresh` calls with adjusted clock skew (client clock ahead)", async function () {
            await startST(2 * 60 * 60); // setting accessTokenValidity to 2 hours to avoid refresh issues due to clock skew
            try {
                let customClaimRefreshCalledCount = 0;

                // Override Date.now() to return the current time plus 1 hour
                await page.evaluate(() => {
                    globalThis.originalNow = Date.now;
                    Date.now = function () {
                        return originalNow() + 60 * 60 * 1000;
                    };
                });

                await page.setRequestInterception(true);

                page.on("request", req => {
                    if (req.url() === `${BASE_URL}/update-jwt`) {
                        customClaimRefreshCalledCount++;
                    }
                    req.continue();
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

                    assertEqual(loginResponse.responseText, userId);

                    const customSessionClaim = new supertokens.BooleanClaim({
                        id: "st-custom",
                        refresh: async () => {
                            const resp = await toTest({
                                url: `${BASE_URL}/update-jwt`,
                                method: "post",
                                headers: {
                                    Accept: "application/json",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    "st-custom": {
                                        v: true,
                                        t: originalNow()
                                    }
                                })
                            });
                        },
                        defaultMaxAgeInSeconds: 300 /* 300 seconds */
                    });

                    const customSessionClaimValidator = customSessionClaim.validators.isTrue();

                    await supertokens.validateClaims(() => [customSessionClaimValidator]);
                    await supertokens.validateClaims(() => [customSessionClaimValidator]);
                    await supertokens.validateClaims(() => [customSessionClaimValidator]);
                });

                assert.strictEqual(customClaimRefreshCalledCount, 1);
            } finally {
                await browser.close();
            }
        });

        it("should call the claim refresh endpoint once for multiple concurrent validateClaims calls", async function () {
            await startST();
            try {
                let customClaimRefreshCalledCount = 0;

                await page.setRequestInterception(true);

                page.on("request", req => {
                    if (req.url() === `${BASE_URL}/update-jwt`) {
                        customClaimRefreshCalledCount++;
                    }
                    req.continue();
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

                    assertEqual(loginResponse.responseText, userId);

                    const customSessionClaim = new supertokens.BooleanClaim({
                        id: "st-custom",
                        refresh: async () => {
                            await toTest({
                                url: `${BASE_URL}/update-jwt`,
                                method: "post",
                                headers: {
                                    Accept: "application/json",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    "st-custom": {
                                        v: true,
                                        t: Date.now()
                                    }
                                })
                            });
                        }
                    });

                    const customSessionClaimValidator = customSessionClaim.validators.isTrue();

                    await Promise.all([
                        supertokens.validateClaims(() => [customSessionClaimValidator]),
                        supertokens.validateClaims(() => [customSessionClaimValidator]),
                        supertokens.validateClaims(() => [customSessionClaimValidator])
                    ]);
                });

                assert.strictEqual(customClaimRefreshCalledCount, 1);
            } finally {
                await browser.close();
            }
        });

        it("should retry the refresh endpoint", async function () {
            await startST();
            try {
                let customClaimRefreshCalledCount = 0;

                await page.setRequestInterception(true);

                page.on("request", req => {
                    if (req.url() === `${BASE_URL}/update-jwt`) {
                        customClaimRefreshCalledCount++;
                        if (customClaimRefreshCalledCount === 1) {
                            req.respond({
                                status: 401,
                                body: JSON.stringify({
                                    message: "try refresh token"
                                })
                            });
                        } else {
                            req.continue();
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

                    assertEqual(loginResponse.responseText, userId);

                    const customSessionClaim = new supertokens.BooleanClaim({
                        id: "st-custom",
                        refresh: async () => {
                            await toTest({
                                url: `${BASE_URL}/update-jwt`,
                                method: "post",
                                headers: {
                                    Accept: "application/json",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    "st-custom": {
                                        v: true,
                                        t: Date.now()
                                    }
                                })
                            });
                        }
                    });

                    const customSessionClaimValidator = customSessionClaim.validators.isTrue();

                    await Promise.all([
                        supertokens.validateClaims(() => [customSessionClaimValidator]),
                        supertokens.validateClaims(() => [customSessionClaimValidator]),
                        supertokens.validateClaims(() => [customSessionClaimValidator])
                    ]);
                });

                assert.strictEqual(customClaimRefreshCalledCount, 2);
            } finally {
                await browser.close();
            }
        });

        it("should work even if the refresh endpoint returns a 500", async function () {
            await startST();
            try {
                let customClaimRefreshCalledCount = 0;

                await page.setRequestInterception(true);

                page.on("request", req => {
                    if (req.url() === `${BASE_URL}/update-jwt`) {
                        req.respond({
                            status: 500,
                            body: "nope"
                        });
                        customClaimRefreshCalledCount++;
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

                    assertEqual(loginResponse.responseText, userId);

                    const customSessionClaim = new supertokens.BooleanClaim({
                        id: "st-custom",
                        refresh: async () => {
                            await toTest({
                                url: `${BASE_URL}/update-jwt`,
                                method: "post",
                                headers: {
                                    Accept: "application/json",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    "st-custom": {
                                        v: true,
                                        t: Date.now()
                                    }
                                })
                            });
                        }
                    });

                    const customSessionClaimValidator = customSessionClaim.validators.isTrue();

                    await Promise.all([
                        supertokens.validateClaims(() => [customSessionClaimValidator]),
                        supertokens.validateClaims(() => [customSessionClaimValidator]),
                        supertokens.validateClaims(() => [customSessionClaimValidator])
                    ]);
                });

                assert.strictEqual(customClaimRefreshCalledCount, 3);
            } finally {
                await browser.close();
            }
        });

        it("should work even if the refresh function throws", async function () {
            await startST();
            try {
                let customClaimRefreshCalledCount = 0;

                await page.setRequestInterception(true);

                page.on("request", req => {
                    if (req.url() === `${BASE_URL}/update-jwt`) {
                        ++customClaimRefreshCalledCount;
                        req.abort();
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

                    assertEqual(loginResponse.responseText, userId);

                    const customSessionClaim = new supertokens.BooleanClaim({
                        id: "st-custom",
                        refresh: async () => {
                            await toTest({
                                url: `${BASE_URL}/update-jwt`,
                                method: "post",
                                headers: {
                                    Accept: "application/json",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    "st-custom": {
                                        v: true,
                                        t: Date.now()
                                    }
                                })
                            });
                        }
                    });

                    const customSessionClaimValidator = customSessionClaim.validators.isTrue();

                    await Promise.all([
                        supertokens.validateClaims(() => [customSessionClaimValidator]),
                        supertokens.validateClaims(() => [customSessionClaimValidator]),
                        supertokens.validateClaims(() => [customSessionClaimValidator])
                    ]);
                });

                assert.strictEqual(customClaimRefreshCalledCount, 3);
            } finally {
                await browser.close();
            }
        });

        // This test is skipped because it takes ~8 mins to run
        it.skip("should work even if it runs out of retries for the lock", async function () {
            await startST();
            try {
                let customClaimRefreshCalledCount = 0;

                await page.setRequestInterception(true);

                page.on("request", req => {
                    if (req.url() === `${BASE_URL}/update-jwt`) {
                        ++customClaimRefreshCalledCount;
                    }
                    req.continue();
                });

                await page.evaluate(async () => {
                    const userId = "testing-supertokens-website";
                    localStorage.setItem(
                        "browser-tabs-lock-key-CLAIM_REFRESH_LOCK",
                        JSON.stringify({ timeRefreshed: Date.now() })
                    );
                    setInterval(
                        () =>
                            localStorage.setItem(
                                "browser-tabs-lock-key-CLAIM_REFRESH_LOCK",
                                JSON.stringify({ timeRefreshed: Date.now() })
                            ),
                        1000
                    );
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

                    const customSessionClaim = new supertokens.BooleanClaim({
                        id: "st-custom",
                        refresh: async () => {
                            await toTest({
                                url: `${BASE_URL}/update-jwt`,
                                method: "post",
                                headers: {
                                    Accept: "application/json",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    "st-custom": {
                                        v: true,
                                        t: Date.now()
                                    }
                                })
                            });
                        }
                    });

                    const customSessionClaimValidator = customSessionClaim.validators.isTrue();

                    await supertokens.validateClaims(() => [customSessionClaimValidator]);
                });

                assert.strictEqual(customClaimRefreshCalledCount, 0);
            } finally {
                await browser.close();
            }
        });

        it("should call the claim refresh endpoint as many times as `shouldRefresh` calls with adjusted clock skew (client clock behind)", async function () {
            await startST(2 * 60 * 60); // setting accessTokenValidity to 2 hours to avoid refresh issues due to clock skew
            try {
                let customClaimRefreshCalledCount = 0;

                // Override Date.now() to return the current time minus 1 hour
                await page.evaluate(() => {
                    globalThis.originalNow = Date.now;
                    Date.now = function () {
                        return originalNow() - 60 * 60 * 1000;
                    };
                });

                await page.setRequestInterception(true);

                page.on("request", req => {
                    if (req.url() === `${BASE_URL}/update-jwt`) {
                        customClaimRefreshCalledCount++;
                    }
                    req.continue();
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

                    assertEqual(loginResponse.responseText, userId);

                    const customSessionClaim = new supertokens.BooleanClaim({
                        id: "st-custom",
                        refresh: async () => {
                            const resp = await toTest({
                                url: `${BASE_URL}/update-jwt`,
                                method: "post",
                                headers: {
                                    Accept: "application/json",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    "st-custom": {
                                        v: true,
                                        // We intentionally expire the claim during an update. In an ideal scenario,
                                        // the `shouldRefresh` function would consistently return true as the claim is expired.
                                        // However, if the client clock is behind, the `shouldRefresh` function may erroneously return false.
                                        // The responsibility of handling this situation lies with the DateProvider,
                                        // ensuring that `shouldRefresh` correctly returns true regardless of potential clock discrepancies.
                                        t: originalNow() - 10 * 60 * 1000
                                    }
                                })
                            });
                        },
                        defaultMaxAgeInSeconds: 300 /* 300 seconds */
                    });

                    const customSessionClaimValidator = customSessionClaim.validators.isTrue();

                    await supertokens.validateClaims(() => [customSessionClaimValidator]);
                    await supertokens.validateClaims(() => [customSessionClaimValidator]);
                    await supertokens.validateClaims(() => [customSessionClaimValidator]);
                });

                assert.strictEqual(customClaimRefreshCalledCount, 3);
            } finally {
                await browser.close();
            }
        });

        it("should call calculateClockSkewInMillis with appropriate headers", async function () {
            await startST();
            let clockSkewParams = [];
            page.on("console", ev => {
                const text = ev.text();
                const key = "TEST_calculateClockSkewInMillis$";
                if (text.startsWith(key)) {
                    clockSkewParams.push(JSON.parse(text.substr(key.length)));
                }
            });
            const accessTokenPayload = await page.evaluate(async () => {
                const userId = "testing-supertokens-website";

                // Create a session
                await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                return await supertokens.getAccessTokenPayloadSecurely();
            });

            assert.strictEqual(clockSkewParams.length, 1);
            assert.deepStrictEqual(clockSkewParams[0].accessTokenPayload, accessTokenPayload);
            const expectedHeaders = [
                "access-control-allow-credentials",
                "access-control-allow-origin",
                "access-control-expose-headers",
                "content-length",
                "content-type",
                "date",
                "front-token",
                ...(transferMethod === "header" ? ["st-access-token", "st-refresh-token"] : ["anti-csrf"])
            ];

            const actualHeaders = clockSkewParams[0].responseHeaders.map(([key]) => key);

            assert.ok(expectedHeaders.every(header => actualHeaders.includes(header)));
        });
    });
});
