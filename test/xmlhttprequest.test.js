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
const axios = require("axios");

const puppeteer = require("puppeteer");
const assert = require("assert");
const { BASE_URL, BASE_URL_FOR_ST, startST } = require("./utils.js");
const { spawn } = require("child_process");

describe("XmlHttpRequest tests", function () {
    let browser, page;
    before(async function () {
        spawn(
            "./test/startServer",
            [process.env.INSTALL_PATH, process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT],
            {
                stdio: "inherit"
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

                await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
                await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
                page.evaluate(BASE_URL => (window.BASE_URL = BASE_URL), BASE_URL);
            } catch {}
        }
    });

    afterEach(async function () {
        if (browser) {
            await browser.close();
            browser = undefined;
        }
    });

    it("should work with multiple headers added in sync right before send", async function () {
        await page.evaluate(async () => {
            const logs = [];
            const origLog = console.log;
            console.log = (...args) => {
                logs.push(args);
                origLog(...args);
            };

            const errors = [];
            const origErr = console.error;
            console.error = (...args) => {
                errors.push(args);
                origErr(...args);
            };

            supertokens.init({
                apiDomain: BASE_URL,
                // We need this enabled because we are using a debug log to check when we need to slow down the cookie getter
                // This way we do not have to add testing code into prod
                enableDebugLogs: true,
                cookieHandler: original => ({
                    ...original,
                    getCookie: async function () {
                        let lastLog = logs[logs.length - 1];
                        if (
                            lastLog.length > 0 &&
                            lastLog[0].includes("checking if user provided auth header matches local token")
                        ) {
                            await new Promise(res => setTimeout(res, 200));
                        }
                        return await original.getCookie();
                    }
                })
            });
            await fetch(BASE_URL + "/testing");

            const request = new XMLHttpRequest();
            request.open("GET", BASE_URL + "/testing");

            const loaded = new Promise((res, rej) => {
                request.onloadend = res;
                request.onerror = rej;
                request.ontimeout = rej;
                request.onabort = rej;
            });
            request.setRequestHeader("authorization", "asdf");
            request.send();
            await loaded;
            await new Promise(res => setTimeout(res, 500));
            assert.strictEqual(errors.length, 0);
        });
    });

    it("test that relative URLs get intercepted if frontend and backend are on same domain", async function () {
        await startST(3);
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

                let loginRequest = new XMLHttpRequest();
                loginRequest.open("POST", `/login`);
                loginRequest.setRequestHeader("Content-Type", "application/json");
                loginRequest.setRequestHeader("Accept", "application/json");
                loginRequest.send(JSON.stringify({ userId }));
                await new Promise(res => {
                    loginRequest.onload = res;
                });
                assertEqual(loginRequest.responseText, userId);

                let checkRidRequest = new XMLHttpRequest();
                checkRidRequest.open("GET", `/check-rid`);
                checkRidRequest.send();
                await new Promise(res => {
                    checkRidRequest.onload = res;
                });
                assertEqual(checkRidRequest.responseText, "success");
            });
        } finally {
            await browser.close();
        }
    });
});
