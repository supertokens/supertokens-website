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
let decodeJWT = require("jsonwebtoken").decode;
let verifyJWT = require("jsonwebtoken").verify;
let jwksClient = require("jwks-rsa");
let assert = require("assert");
let {
    delay,
    getNumberOfTimesRefreshCalled,
    startST,
    startSTWithJWTEnabled,
    getNumberOfTimesGetSessionCalled,
    BASE_URL,
    BASE_URL_FOR_ST,
    coreTagEqualToOrAfter,
    checkIfJWTIsEnabled,
    checkIfV3AccessTokenIsSupported
} = require("./utils");
const { spawn } = require("child_process");
const { addGenericTestCases: addTestCases } = require("./interception.testgen");

/* setupFunc is called through page.evaluate at the start of each test
    It should set window.toTest to a function that receives a config object with:
        url
        method
        headers (as object)
        body
    and should return a response object with:
        url
        statusCode
        headers (as Headers)
        responseText (text)
*/

addTestCases((name, transferMethod, setupFunc, setupArgs = []) => {
    describe(`${name}: unauthorised event`, function () {
        let browser;
        let page;
        let v3AccessTokenSupported;

        function setup(config = {}) {
            // page.on("console", c => console.log(c.text()));
            return page.evaluate(
                setupFunc,
                {
                    // enableDebugLogs: true,
                    ...config
                },
                ...setupArgs
            );
        }

        before(async function () {
            spawn(
                "./test/startServer",
                [process.env.INSTALL_PATH, process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT],
                {
                    // stdio: "inherit",
                    // env: {
                    //     ...process.env,
                    //     DEBUG: "com.supertokens",
                    // }
                }
            );
            await new Promise(r => setTimeout(r, 1000));
            v3AccessTokenSupported = await checkIfV3AccessTokenIsSupported();
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

                    await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
                    await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
                    await page.evaluate(BASE_URL => (window.BASE_URL = BASE_URL), BASE_URL);
                    await page.waitForFunction(() => window.supertokens !== undefined);
                    await new Promise(r => setTimeout(r, 100));
                } catch {}
            }
        });

        afterEach(async function () {
            if (browser) {
                await browser.close();
                browser = undefined;
            }
        });

        it("test that after login, and clearing all cookies, if we query a protected route, it fires unauthorised event", async function () {
            await startST();
            await setup();

            let consoleLogs = [];
            page.on("console", message => {
                if (message.text().startsWith("ST_")) {
                    consoleLogs.push(message.text());
                }
            });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: event => {
                        console.log(`ST_${event.action}:${JSON.stringify(event)}`);
                    }
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await toTest({
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

            const client = await page.target().createCDPSession();
            await client.send("Network.clearBrowserCookies");
            await client.send("Network.clearBrowserCache");
            let cookies = await page.cookies();
            assert.strictEqual(cookies.length, 0);

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                let response = await toTest({ url: `${BASE_URL}/` });
                assert.strictEqual(response.statusCode, 401);
            });

            assert.strictEqual(consoleLogs.length, 2);

            assert.strict(consoleLogs[0].startsWith("ST_SESSION_CREATED"));

            const eventName = "ST_UNAUTHORISED";
            assert.strict(consoleLogs[1].startsWith(eventName));
            const parsedEvent = JSON.parse(consoleLogs[1].substr(eventName.length + 1));
            assert.strictEqual(parsedEvent.sessionExpiredOrRevoked, false);
        });

        it("test that after login, and clearing only httpOnly cookies, if we query a protected route, it fires unauthorised event", async function () {
            if (transferMethod === "header") {
                // We skip this in header mode: it should work the same without httpOnly cookies
                this.skip();
            }
            await startST();
            await setup();
            let consoleLogs = [];
            page.on("console", message => {
                if (message.text().startsWith("ST_")) {
                    consoleLogs.push(message.text());
                }
            });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: event => {
                        console.log(`ST_${event.action}:${JSON.stringify(event)}`);
                    }
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await toTest({
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

            let originalCookies = (await page.cookies()).filter(c => !c.httpOnly);

            const client = await page.target().createCDPSession();
            await client.send("Network.clearBrowserCookies");
            await client.send("Network.clearBrowserCache");

            await page.setCookie(...originalCookies);
            let cookies = await page.cookies();
            assert.strictEqual(cookies.length, 3);

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                let response = await toTest({ url: `${BASE_URL}/` });
                assert.strictEqual(response.statusCode, 401);
            });

            assert.strictEqual(consoleLogs.length, 2);

            assert.strict(consoleLogs[0].startsWith("ST_SESSION_CREATED"));

            const eventName = "ST_UNAUTHORISED";
            assert.strict(consoleLogs[1].startsWith(eventName));
            const parsedEvent = JSON.parse(consoleLogs[1].substr(eventName.length + 1));
            assert.strict(parsedEvent.sessionExpiredOrRevoked);
        });

        it("test that unauthorised event is not fired on initial page load", async function () {
            await startST();
            await setup();
            let consoleLogs = [];
            page.on("console", message => {
                if (message.text().startsWith("ST_")) {
                    consoleLogs.push(message.text());
                }
            });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: event => {
                        console.log("ST_" + event.action);
                    }
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await toTest({
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
            assert.strictEqual(consoleLogs.length, 1);
            assert.strictEqual(consoleLogs[0], "ST_SESSION_CREATED");
        });

        it("test that unauthorised event is fired when calling protected route without a session", async function () {
            await startST();
            await setup();
            let consoleLogs = [];
            page.on("console", message => {
                if (message.text().startsWith("ST_")) {
                    consoleLogs.push(message.text());
                }
            });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: event => {
                        console.log(`ST_${event.action}:${JSON.stringify(event)}`);
                    }
                });
                let response = await toTest({ url: `${BASE_URL}/` });
                assert.strictEqual(response.statusCode, 401);
            });

            assert.strictEqual(consoleLogs.length, 1);

            const eventName = "ST_UNAUTHORISED";

            assert.strict(consoleLogs[0].startsWith(eventName));
            const parsedEvent = JSON.parse(consoleLogs[0].substr(eventName.length + 1));
            assert.strictEqual(parsedEvent.sessionExpiredOrRevoked, false);
        });
    });
});
