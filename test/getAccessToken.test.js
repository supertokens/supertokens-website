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

const axios = require("axios");
const {
    BASE_URL_FOR_ST,
    BASE_URL,
    CROSS_DOMAIN_NODE_URL,
    setupCoreApp,
    setupST,
    getNumberOfTimesRefreshAttempted
} = require("./utils");
const puppeteer = require("puppeteer");
const { assert } = require("console");

describe("getAccessToken", function () {
    let browser;

    after(async function () {
        const instance = axios.create();
        await instance.post(`${BASE_URL}/after`);
    });

    beforeEach(async function () {
        const instance = axios.create();
        await instance.post(`${BASE_URL_FOR_ST}/beforeeach`);
        await instance.post(`${CROSS_DOMAIN_NODE_URL}/beforeeach`); // for cross domain
        await instance.post(`${BASE_URL}/beforeeach`);

        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
    });

    afterEach(async function () {
        try {
            if (browser) {
                await browser.close();
            }
        } catch {}
    });

    it("should return undefined without an active session", async function () {
        const coreUrl = await setupCoreApp();
        await setupST({ coreUrl });
        const page = await browser.newPage();

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
        await page.evaluate(async BASE_URL => {
            supertokens.init({
                tokenTransferMethod: "header",
                apiDomain: BASE_URL
            });

            const token = await supertokens.getAccessToken();

            assert.strictEqual(token, undefined);
        }, BASE_URL);
    });

    it("should return a token with an active header-based session", async function () {
        const coreUrl = await setupCoreApp();
        await setupST({ coreUrl });
        const page = await browser.newPage();

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
        await page.evaluate(async BASE_URL => {
            supertokens.init({
                tokenTransferMethod: "header",
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

            assert.strictEqual(await loginResponse.text(), userId);

            const token = await supertokens.getAccessToken();

            assert.notStrictEqual(token, undefined);
        }, BASE_URL);
    });

    it("should not return a token with an active cookie-based session", async function () {
        const coreUrl = await setupCoreApp();
        await setupST({ coreUrl });
        const page = await browser.newPage();

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
        await page.evaluate(async BASE_URL => {
            supertokens.init({
                tokenTransferMethod: "cookie",
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

            assert.strictEqual(await loginResponse.text(), userId);

            const token = await supertokens.getAccessToken();

            assert.strictEqual(token, undefined);
        }, BASE_URL);
    });

    it("should not return a token after signout", async function () {
        const coreUrl = await setupCoreApp();
        await setupST({ coreUrl });
        const page = await browser.newPage();

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
        await page.evaluate(async BASE_URL => {
            supertokens.init({
                tokenTransferMethod: "header",
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

            assert.strictEqual(await loginResponse.text(), userId);

            await supertokens.signOut();

            const token = await supertokens.getAccessToken();

            assert.strictEqual(token, undefined);
        }, BASE_URL);
    });

    it("should return refreshed token if called with an expired session", async function () {
        const coreUrl = await setupCoreApp();
        await setupST({ coreUrl });
        const page = await browser.newPage();

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
        await page.evaluate(async BASE_URL => {
            supertokens.init({
                tokenTransferMethod: "header",
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

            const oldToken = await supertokens.getAccessToken();
            await delay(5);
            assertEqual(await getNumberOfTimesRefreshCalled(), 0);
            assert.strictEqual(await loginResponse.text(), userId);

            const token = await supertokens.getAccessToken();

            assert.notStrictEqual(token, undefined);
            assert.notStrictEqual(token, oldToken);
            assertEqual(await getNumberOfTimesRefreshCalled(), 1);
        }, BASE_URL);
    });

    it("should return undefined if refresh fails", async function () {
        const coreUrl = await setupCoreApp();
        await setupST({ coreUrl });
        const page = await browser.newPage();

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });

        await page.evaluate(async BASE_URL => {
            supertokens.init({
                tokenTransferMethod: "header",
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

            assert.strictEqual(await loginResponse.text(), userId);
            await delay(5);
        }, BASE_URL);

        await page.setCookie({ name: "st-refresh-token", value: "asdf" });

        await page.evaluate(async () => {
            assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 1);
            const token = await supertokens.getAccessToken();

            assert.strictEqual(token, undefined);
            assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 2);
        });
    });
});
