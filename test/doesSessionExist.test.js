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
let { BASE_URL_FOR_ST, BASE_URL, startST, resetAuthHttpRequestFetch, delay } = require("./utils");
let { ProcessState } = require("../lib/build/processState");
let puppeteer = require("puppeteer");
const assert = require("assert");

describe("doesSessionExist", function () {
    jsdom({
        url: "http://localhost"
    });

    let browser;

    before(async () => {
        spawn("./test/startServer", [
            process.env.INSTALL_PATH,
            process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT
        ]);
        await new Promise(r => setTimeout(r, 1000));
    });

    after(async () => {
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/after");
        try {
            await instance.get(BASE_URL_FOR_ST + "/stop");
        } catch (err) {}
    });

    beforeEach(async () => {
        resetAuthHttpRequestFetch();
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/beforeeach");
        await instance.post("http://localhost.org:8082/beforeeach"); // for cross domain
        await instance.post(BASE_URL + "/beforeeach");

        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
    });

    afterEach(async () => {
        if (browser) {
            await browser.close();
        }
    });

    it("should call refresh and return false if no session is present", async () => {
        await startST();
        const page = await browser.newPage();

        await page.setRequestInterception(true);

        let refreshCalled = 0;
        page.on("request", req => {
            const url = req.url();

            if (url === BASE_URL + "/auth/session/refresh") {
                ++refreshCalled;
            }

            req.continue();
        });

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
        await page.evaluate(async () => {
            let BASE_URL = "http://localhost.org:8080";
            supertokens.init({
                apiDomain: BASE_URL
            });

            const res = await supertokens.doesSessionExist();
            assert.strictEqual(res, false);
        });
        assert.strictEqual(refreshCalled, 1);
    });

    it("should not throw if refresh returns a 500", async () => {
        await startST();
        const page = await browser.newPage();

        await page.setRequestInterception(true);

        page.on("request", req => {
            const url = req.url();

            if (url === BASE_URL + "/auth/session/refresh") {
                return req.respond({
                    status: 500
                });
            }

            req.continue();
        });

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
        await page.evaluate(async () => {
            let BASE_URL = "http://localhost.org:8080";
            supertokens.init({
                apiDomain: BASE_URL
            });

            const res = await supertokens.doesSessionExist();
            assert.strictEqual(res, false);
        });
    });

    it("should not throw if refresh returns a 401 with a session previously existing", async () => {
        await startST(2);
        const page = await browser.newPage();

        await page.setRequestInterception(true);

        page.on("request", req => {
            const url = req.url();

            if (url === BASE_URL + "/auth/session/refresh") {
                return req.respond({
                    status: 401
                });
            }

            req.continue();
        });

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
        await page.evaluate(async () => {
            let BASE_URL = "http://localhost.org:8080";
            supertokens.init({
                apiDomain: BASE_URL
            });
            let userId = "testing-supertokens-website";

            // Create a session
            let loginResponse = await fetch(`${BASE_URL}/login`, {
                method: "post",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId })
            });

            await delay(3);

            const res = await supertokens.doesSessionExist();
            assert.strictEqual(res, false);
        });
    });

    it("should call refresh and return true if the access token expired", async () => {
        await startST(2);
        const page = await browser.newPage();

        await page.setRequestInterception(true);

        let refreshCalled = 0;
        page.on("request", req => {
            const url = req.url();

            if (url === BASE_URL + "/auth/session/refresh") {
                ++refreshCalled;
            }

            req.continue();
        });

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
        await page.evaluate(async () => {
            let BASE_URL = "http://localhost.org:8080";
            supertokens.init({
                apiDomain: BASE_URL
            });

            let userId = "testing-supertokens-website";

            // Create a session
            let loginResponse = await fetch(`${BASE_URL}/login`, {
                method: "post",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId })
            });

            await delay(3);

            assertEqual(await loginResponse.text(), userId);
            const res = await supertokens.doesSessionExist();
            assert.strictEqual(res, true);
        });
        // It's called twice: first before the login call then during doesSessionExist
        assert.strictEqual(refreshCalled, 2);
    });

    it("should call refresh and return false if the access token expired and refresh fails with 500", async () => {
        await startST(2);
        const page = await browser.newPage();

        await page.setRequestInterception(true);

        let refreshCalled = 0;
        page.on("request", req => {
            const url = req.url();

            if (url === BASE_URL + "/auth/session/refresh") {
                ++refreshCalled;
                return req.respond({
                    status: 500
                });
            }

            req.continue();
        });

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
        await page.evaluate(async () => {
            let BASE_URL = "http://localhost.org:8080";
            supertokens.init({
                apiDomain: BASE_URL
            });

            let userId = "testing-supertokens-website";

            // Create a session
            let loginResponse = await fetch(`${BASE_URL}/login`, {
                method: "post",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId })
            });

            await delay(3);

            assertEqual(await loginResponse.text(), userId);
            const res = await supertokens.doesSessionExist();
            assert.strictEqual(res, false);
        });
        assert.strictEqual(refreshCalled, 2);
    });
});
