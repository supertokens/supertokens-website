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
let { BASE_URL_FOR_ST, BASE_URL, startST, resetAuthHttpRequestFetch } = require("./utils");
let { default: AuthHttpRequestFetch } = require("../lib/build/fetch");
let { ProcessState, PROCESS_STATE } = require("../lib/build/processState");
let puppeteer = require("puppeteer");

describe("General Error Tests", function () {
    jsdom({
        url: "http://localhost",
    });

    before(async function () {
        spawn("./test/startServer", [
            process.env.INSTALL_PATH,
            process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT,
        ]);
        await new Promise((r) => setTimeout(r, 1000));
    });

    after(async function () {
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/after");
        try {
            await instance.get(BASE_URL_FOR_ST + "/stop");
        } catch (err) {}
    });

    beforeEach(async function () {
        resetAuthHttpRequestFetch();
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/beforeeach");
        await instance.post("http://localhost.org:8082/beforeeach"); // for cross domain
        await instance.post(BASE_URL + "/beforeeach");
    });

    it("Test that signOut throws general error correctly", async function () {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);

            page.on("request", (req) => {
                const url = req.url();

                if (url === BASE_URL + "/auth/signout") {
                    return req.respond({
                        status: 200,
                        body: JSON.stringify({
                            status: "GENERAL_ERROR",
                            message: "general error from signout API",
                        }),
                    });
                }

                req.continue();
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                });

                let userId = "testing-supertokens-website";

                // Create a session
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userId }),
                });

                assertEqual(await loginResponse.text(), userId);
                let testFailed = true;

                try {
                    await supertokens.signOut();
                } catch (e) {
                    if (e.message === "general error from signout API") {
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
