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
let jsdom = require("mocha-jsdom");
let decodeJWT = require("jsonwebtoken").decode;
let verifyJWT = require("jsonwebtoken").verify;
let jwksClient = require("jwks-rsa");
let AuthHttpRequest = require("../index.js").default;
let AuthHttpRequestFetch = require("../lib/build/fetch").default;
let AuthHttpRequestAxios = require("../lib/build/axios").default;
let { interceptorFunctionRequestFulfilled, responseInterceptor } = require("../lib/build/axios");
let assert = require("assert");
let {
    delay,
    checkIfIdRefreshIsCleared,
    getNumberOfTimesRefreshCalled,
    startST,
    startSTWithJWTEnabled,
    getNumberOfTimesGetSessionCalled,
    BASE_URL,
    BASE_URL_FOR_ST,
    getNumberOfTimesRefreshAttempted,
    coreTagEqualToOrAfter,
    checkIfJWTIsEnabled
} = require("./utils");
const { spawn } = require("child_process");
let { ProcessState, PROCESS_STATE } = require("../lib/build/processState");

AuthHttpRequest.addAxiosInterceptors(axios);

describe("Axios AuthHttpRequest class tests", function() {
    jsdom({
        url: "http://localhost.org"
    });

    before(async function() {
        spawn("./test/startServer", [
            process.env.INSTALL_PATH,
            process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT
        ]);
        await new Promise(r => setTimeout(r, 1000));
    });

    after(async function() {
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/after");
        try {
            await instance.get(BASE_URL_FOR_ST + "/stop");
        } catch (err) {}
    });

    beforeEach(async function() {
        AuthHttpRequestFetch.initCalled = false;
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/beforeeach");
        await instance.post("http://localhost.org:8082/beforeeach"); // for cross domain
        await instance.post(BASE_URL + "/beforeeach");
    });

    it("refresh session, signing key interval change", async function() {
        await startST(100, true, "0.002");
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async coreSupportsMultipleSignigKeys => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);
                await axios({ url: `${BASE_URL}/`, method: "GET", headers: { "Cache-Control": "no-cache, private" } });
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                await delay(11);

                let promises = [];
                for (let i = 0; i < 250; i++) {
                    promises.push(
                        axios({ url: `${BASE_URL}/`, method: "GET", headers: { "Cache-Control": "no-cache, private" } })
                    );
                }
                for (let i = 0; i < 250; i++) {
                    await promises[i];
                }

                assertEqual(await getNumberOfTimesRefreshCalled(), coreSupportsMultipleSignigKeys ? 0 : 1);
            }, coreTagEqualToOrAfter("3.6.0"));
        } finally {
            await browser.close();
        }
    });

    it("refresh session endpoint responding with 500 rejects original request with axios error", async function() {
        await startST(100, true, "0.002");
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            let firstGet = true;
            let firstPost = true;
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/") {
                    if (firstGet) {
                        firstGet = false;
                        req.respond({
                            status: 401,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                    } else {
                        req.respond({
                            status: 200,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                success: true
                            })
                        });
                    }
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    if (firstPost) {
                        req.respond({
                            status: 401,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                        firstPost = false;
                    } else {
                        req.respond({
                            status: 500,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "test"
                            })
                        });
                    }
                } else {
                    req.continue();
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            // page.on("console", l => console.log(l.text()));
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let exception;
                try {
                    const res = await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                } catch (ex) {
                    exception = ex;
                }
                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                assertEqual(exception.config.url, `${BASE_URL}/auth/session/refresh`);
                assertEqual(exception.response.status, 500);
                assertNotEqual(exception.response.data, undefined);
                assertEqual(exception.response.data.message, "test");
            });
        } finally {
            await browser.close();
        }
    });

    it("API returning 401 will not call refresh after logout", async function() {
        await startST(100, true, "0.002");
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            // page.on("console", l => console.log(l.text()));

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async BASE_URL => {
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);
                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(await logoutResponse.data, "success");

                const refreshAttemptedBeforeApiCall = await getNumberOfTimesRefreshAttempted();

                let exception;
                try {
                    await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                } catch (ex) {
                    exception = ex;
                }

                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                assertEqual(exception.config.url, `${BASE_URL}/`);
                assertEqual(exception.response.status, 401);

                assertEqual(await getNumberOfTimesRefreshAttempted(), refreshAttemptedBeforeApiCall);
            }, BASE_URL);
        } finally {
            await browser.close();
        }
    });

    it("refresh session endpoint responding with 401 rejects original call with axios error", async function() {
        await startST(100, true, "0.002");
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            // page.on("console", l => console.log(l.text()));
            let firstGet = true;
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/") {
                    if (firstGet) {
                        firstGet = false;
                        req.respond({
                            status: 401,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                    } else {
                        req.respond({
                            status: 200,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                success: true
                            })
                        });
                    }
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    req.respond({
                        status: 401,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            message: "test"
                        })
                    });
                    firstPost = false;
                } else {
                    req.continue();
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let exception;
                try {
                    await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                } catch (ex) {
                    exception = ex;
                }
                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                assertEqual(exception.config.url, `${BASE_URL}/auth/session/refresh`);
                assertEqual(exception.response.status, 401);
                assertNotEqual(exception.response.data, undefined);
                assertEqual(exception.response.data.message, "test");
            });
        } finally {
            await browser.close();
        }
    });

    it("no refresh call after 401 response that removes session", async function() {
        await startST(100, true, "0.002");
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            let refreshCalled = 0;
            page.on("request", req => {
                const url = req.url();
                // console.log('r', url);
                if (url === BASE_URL + "/") {
                    req.respond({
                        status: 401,
                        body: JSON.stringify({ message: "test" }),
                        headers: {
                            "Content-Type": "application/json",
                            "id-refresh-token": "remove",
                            "Set-Cookie": [
                                "sIdRefreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
                                "sAccessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
                                "sRefreshToken=; Path=/auth/session/refresh; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
                            ]
                        }
                    });
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    ++refreshCalled;
                    req.respond({
                        status: 401,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ message: "nope" })
                    });
                } else {
                    req.continue();
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            // page.on("console", l => console.log(l.text()));
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let exception;
                try {
                    await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                } catch (ex) {
                    exception = ex;
                }
                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                assertEqual(exception.config.url, `${BASE_URL}/`);
                assertEqual(exception.response.status, 401);
                assertNotEqual(exception.response.data, undefined);
                assertEqual(exception.response.data.message, "test");
            });

            // Calls it once before login, but it shouldn't after that
            assert.equal(refreshCalled, 1);
        } finally {
            await browser.close();
        }
    });

    it("original endpoint responding with 500 should not call refresh without cookies", async function() {
        await startST(100, true, "0.002");
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            refreshCalled = 0;
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/") {
                    req.respond({
                        status: 500,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            message: "test"
                        })
                    });
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    ++refreshCalled;
                    req.respond({
                        status: 500,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            message: "nope"
                        })
                    });
                } else {
                    req.continue();
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            // page.on("console", l => console.log(l.text()));
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                supertokens.addAxiosInterceptors(axios);

                let exception;
                try {
                    await axios.get(`${BASE_URL}/`, { method: "GET" });
                } catch (ex) {
                    exception = ex;
                }
                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                assertEqual(exception.config.url, `${BASE_URL}/`);
                assertEqual(exception.response.status, 500);
                assertNotEqual(exception.response.data, undefined);
                assertEqual(exception.response.data.message, "test");
            });
            // It should call it once before the call - but after that doesn't work it should not try again after the API request
            assert.equal(refreshCalled, 1);
        } finally {
            await browser.close();
        }
    });

    it("refresh throwing an error with empty body doesn't cause an error", async function() {
        await startST(100, true, "0.002");
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            // page.on("console", l => console.log(l.text()));
            let firstGet = true;
            page.on("request", req => {
                const url = req.url();
                // console.log(url);
                if (url === BASE_URL + "/") {
                    if (firstGet) {
                        firstGet = false;
                        req.respond({
                            status: 401,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                    } else {
                        req.respond({
                            status: 200,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                success: true
                            })
                        });
                    }
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    req.respond({
                        status: 401,
                        body: new Uint8Array()
                    });
                    firstPost = false;
                } else {
                    req.continue();
                }
            });

            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let exception;
                try {
                    await axios({
                        url: `${BASE_URL}/`,
                        method: "GET",
                        headers: { "Cache-Control": "no-cache, private" }
                    });
                } catch (ex) {
                    exception = ex;
                }
                assertNotEqual(exception, undefined);
                assertNotEqual(exception.response, undefined);
                assertEqual(exception.config.url, `${BASE_URL}/auth/session/refresh`);
                assertEqual(exception.response.status, 401);
                assertNotEqual(exception.response.data, undefined);
                assertEqual(exception.response.data, "");
            });
        } finally {
            await browser.close();
        }
    });

    it("Test that the access token payload and the JWT have all valid claims after updating access token payload", async function() {
        await startSTWithJWTEnabled();

        let isJwtEnabled = await checkIfJWTIsEnabled();

        if (!isJwtEnabled) {
            return;
        }

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/jsondecode") {
                    let jwt = JSON.parse(req.postData()).jwt;
                    let decodedJWT = decodeJWT(jwt);

                    req.respond({
                        status: 200,
                        body: JSON.stringify(decodedJWT)
                    });
                } else {
                    req.continue();
                }
            });
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // Create a session
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                assertNotEqual(accessTokenPayload.jwt, undefined);
                assertEqual(accessTokenPayload.sub, undefined);
                assertEqual(accessTokenPayload._jwtPName, "jwt");
                assertEqual(accessTokenPayload.iss, undefined);
                assertEqual(accessTokenPayload.customClaim, "customValue");

                let jwt = accessTokenPayload.jwt;

                // Decode the JWT
                let decodeResponse = await axios.post(`${BASE_URL}/jsondecode`, JSON.stringify({ jwt }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let decodedJWT = await decodeResponse.data;

                // Verify the JWT claims
                assertEqual(decodedJWT.sub, userId);
                assertEqual(decodedJWT._jwtPName, undefined);
                assertEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assertEqual(decodedJWT.customClaim, "customValue");

                // Update access token payload
                await axios.post(
                    `${BASE_URL}/update-jwt`,
                    JSON.stringify({
                        ...accessTokenPayload,
                        customClaim: undefined,
                        newClaim: "newValue"
                    }),
                    {
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        }
                    }
                );

                // Get access token payload
                accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                // Verify new access token payload
                assertNotEqual(accessTokenPayload.jwt, undefined);
                assertEqual(accessTokenPayload.sub, undefined);
                assertEqual(accessTokenPayload._jwtPName, "jwt");
                assertEqual(accessTokenPayload.iss, undefined);
                assertEqual(accessTokenPayload.customClaim, undefined);
                assertEqual(accessTokenPayload.newClaim, "newValue");

                jwt = accessTokenPayload.jwt;

                decodeResponse = await axios.post(`${BASE_URL}/jsondecode`, JSON.stringify({ jwt }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                decodedJWT = await decodeResponse.data;

                // Verify new JWT
                assertEqual(decodedJWT.sub, userId);
                assertEqual(decodedJWT._jwtPName, undefined);
                assertEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assertEqual(decodedJWT.customClaim, undefined);
                assertEqual(decodedJWT.newClaim, "newValue");
            });
        } finally {
            await browser.close();
        }
    });

    it("Test that access token payload and JWT are valid after the property name changes and payload is updated after the session is created", async function() {
        await startSTWithJWTEnabled();

        let isJwtEnabled = await checkIfJWTIsEnabled();

        if (!isJwtEnabled) {
            return;
        }

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/jsondecode") {
                    let jwt = JSON.parse(req.postData()).jwt;
                    let decodedJWT = decodeJWT(jwt);

                    req.respond({
                        status: 200,
                        body: JSON.stringify(decodedJWT)
                    });
                } else {
                    req.continue();
                }
            });
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // Create a session
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(loginResponse.data, userId);

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                assertNotEqual(accessTokenPayload.jwt, undefined);
                assertEqual(accessTokenPayload.sub, undefined);
                assertEqual(accessTokenPayload._jwtPName, "jwt");
                assertEqual(accessTokenPayload.iss, undefined);
                assertEqual(accessTokenPayload.customClaim, "customValue");

                let jwt = accessTokenPayload.jwt;

                // Decode the JWT
                let decodeResponse = await axios.post(`${BASE_URL}/jsondecode`, JSON.stringify({ jwt }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let decodedJWT = await decodeResponse.data;

                // Verify the JWT claims
                assertEqual(decodedJWT.sub, userId);
                assertEqual(decodedJWT._jwtPName, undefined);
                assertEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assertEqual(decodedJWT.customClaim, "customValue");

                await axios.post(
                    `${BASE_URL}/reinitialiseBackendConfig`,
                    JSON.stringify({
                        jwtPropertyName: "customJWTProperty"
                    }),
                    {
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        }
                    }
                );

                // Update access token payload
                await axios.post(`${BASE_URL}/update-jwt`, JSON.stringify({ newClaim: "newValue" }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                // Get access token payload
                accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                // Verify new access token payload
                assertNotEqual(accessTokenPayload.jwt, undefined);
                assertEqual(accessTokenPayload.sub, undefined);
                assertEqual(accessTokenPayload._jwtPName, "jwt");
                assertEqual(accessTokenPayload.iss, undefined);
                assertEqual(accessTokenPayload.customClaim, undefined);
                assertEqual(accessTokenPayload.customJWTProperty, undefined);
                assertEqual(accessTokenPayload.newClaim, "newValue");

                jwt = accessTokenPayload.jwt;

                decodeResponse = await axios.post(`${BASE_URL}/jsondecode`, JSON.stringify({ jwt }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                decodedJWT = await decodeResponse.data;

                // Verify new JWT
                assertEqual(decodedJWT.sub, userId);
                assertEqual(decodedJWT._jwtPName, undefined);
                assertEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assertEqual(decodedJWT.customClaim, undefined);
                assertEqual(decodedJWT.newClaim, "newValue");
            });
        } finally {
            await browser.close();
        }
    });

    it("Test that access token payload and JWT are valid after the property name changes and session is refreshed after the session is created", async function() {
        await startSTWithJWTEnabled();

        let isJwtEnabled = await checkIfJWTIsEnabled();

        if (!isJwtEnabled) {
            return;
        }

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/jsondecode") {
                    let jwt = JSON.parse(req.postData()).jwt;
                    let decodedJWT = decodeJWT(jwt);

                    req.respond({
                        status: 200,
                        body: JSON.stringify(decodedJWT)
                    });
                } else {
                    req.continue();
                }
            });
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // Create a session
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(await loginResponse.data, userId);

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                assertNotEqual(accessTokenPayload.jwt, undefined);
                assertEqual(accessTokenPayload.sub, undefined);
                assertEqual(accessTokenPayload._jwtPName, "jwt");
                assertEqual(accessTokenPayload.iss, undefined);
                assertEqual(accessTokenPayload.customClaim, "customValue");

                let jwt = accessTokenPayload.jwt;

                // Decode the JWT
                let decodeResponse = await axios.post(`${BASE_URL}/jsondecode`, JSON.stringify({ jwt }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let decodedJWT = await decodeResponse.data;

                // Verify the JWT claims
                assertEqual(decodedJWT.sub, userId);
                assertEqual(decodedJWT._jwtPName, undefined);
                assertEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assertEqual(decodedJWT.customClaim, "customValue");

                await axios.post(
                    `${BASE_URL}/reinitialiseBackendConfig`,
                    JSON.stringify({
                        jwtPropertyName: "customJWTProperty"
                    }),
                    {
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        }
                    }
                );

                let attemptRefresh = await supertokens.attemptRefreshingSession();
                assertEqual(attemptRefresh, true);

                // Get access token payload
                accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                // Verify new access token payload
                assertEqual(accessTokenPayload.jwt, undefined);
                assertNotEqual(accessTokenPayload.customJWTProperty, undefined);
                assertEqual(accessTokenPayload.sub, undefined);
                assertEqual(accessTokenPayload._jwtPName, "customJWTProperty");
                assertEqual(accessTokenPayload.iss, undefined);
                assertEqual(accessTokenPayload.customClaim, "customValue");

                jwt = accessTokenPayload.customJWTProperty;

                decodeResponse = await axios.post(`${BASE_URL}/jsondecode`, JSON.stringify({ jwt }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                decodedJWT = await decodeResponse.data;

                // Verify new JWT
                assertEqual(decodedJWT.sub, userId);
                assertEqual(decodedJWT._jwtPName, undefined);
                assertEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assertEqual(decodedJWT.customClaim, "customValue");
            });
        } finally {
            await browser.close();
        }
    });

    it("Test that access token payload and jwt are valid after the session has expired", async function() {
        await startSTWithJWTEnabled(3);

        let isJwtEnabled = await checkIfJWTIsEnabled();

        if (!isJwtEnabled) {
            return;
        }

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/jsondecode") {
                    let jwt = JSON.parse(req.postData()).jwt;
                    let decodedJWT = decodeJWT(jwt);

                    req.respond({
                        status: 200,
                        body: JSON.stringify(decodedJWT)
                    });
                } else {
                    req.continue();
                }
            });
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // Create a session
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(loginResponse.data, userId);

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                assertNotEqual(accessTokenPayload.jwt, undefined);
                assertEqual(accessTokenPayload.sub, undefined);
                assertEqual(accessTokenPayload._jwtPName, "jwt");
                assertEqual(accessTokenPayload.iss, undefined);
                assertEqual(accessTokenPayload.customClaim, "customValue");

                let jwt = accessTokenPayload.jwt;

                let decodeResponse = await axios.post(`${BASE_URL}/jsondecode`, JSON.stringify({ jwt }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let decodedJWT = decodeResponse.data;
                let jwtExpiry = decodedJWT.exp;

                // Wait for access token to expire
                await delay(5);

                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                assertEqual(await getNumberOfTimesRefreshCalled(), 1);

                assertNotEqual(accessTokenPayload.jwt, undefined);
                assertEqual(accessTokenPayload.sub, undefined);
                assertEqual(accessTokenPayload._jwtPName, "jwt");
                assertEqual(accessTokenPayload.iss, undefined);
                assertEqual(accessTokenPayload.customClaim, "customValue");

                jwt = accessTokenPayload.jwt;

                decodeResponse = await axios.post(`${BASE_URL}/jsondecode`, JSON.stringify({ jwt }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                decodedJWT = decodeResponse.data;

                // Verify new JWT
                assertEqual(decodedJWT.sub, userId);
                assertEqual(decodedJWT._jwtPName, undefined);
                assertEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assertEqual(decodedJWT.customClaim, "customValue");

                let newJWTExpiry = decodedJWT.exp;

                assertEqual(newJWTExpiry > Math.ceil(Date.now() / 1000), true);
                assertNotEqual(newJWTExpiry, jwtExpiry);
            });
        } finally {
            await browser.close();
        }
    });

    it("Test full JWT flow with open id discovery", async function() {
        await startSTWithJWTEnabled();

        let isJwtEnabled = await checkIfJWTIsEnabled();

        if (!isJwtEnabled) {
            return;
        }

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/jsondecode") {
                    let jwt = JSON.parse(req.postData()).jwt;
                    let decodedJWT = decodeJWT(jwt);

                    req.respond({
                        status: 200,
                        body: JSON.stringify(decodedJWT)
                    });
                } else if (url === BASE_URL + "/jwtVerify") {
                    let data = JSON.parse(req.postData());
                    let jwt = data.jwt;
                    let jwksURL = data.jwksURL;
                    let client = jwksClient({
                        jwksUri: jwksURL
                    });

                    function getKey(header, callback) {
                        client.getSigningKey(header.kid, function(err, key) {
                            if (err) {
                                callback(err, null);
                                return;
                            }

                            var signingKey = key.publicKey || key.rsaPublicKey;
                            callback(null, signingKey);
                        });
                    }

                    verifyJWT(jwt, getKey, (err, decoded) => {
                        if (err) {
                            req.respond({
                                status: 500,
                                body: JSON.stringify({
                                    error: err
                                })
                            });
                            return;
                        }

                        req.respond({
                            status: 200,
                            body: JSON.stringify(decoded)
                        });
                    });
                } else {
                    req.continue();
                }
            });
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // Create a session
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(loginResponse.data, userId);

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                assertNotEqual(accessTokenPayload.jwt, undefined);
                assertEqual(accessTokenPayload.sub, undefined);
                assertEqual(accessTokenPayload._jwtPName, "jwt");
                assertEqual(accessTokenPayload.iss, undefined);
                assertEqual(accessTokenPayload.customClaim, "customValue");

                let jwt = accessTokenPayload.jwt;

                let decodeResponse = await axios.post(`${BASE_URL}/jsondecode`, JSON.stringify({ jwt }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                let decodedJWT = decodeResponse.data;

                // Verify the JWT claims
                assertEqual(decodedJWT.sub, userId);
                assertEqual(decodedJWT._jwtPName, undefined);
                assertEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assertEqual(decodedJWT.customClaim, "customValue");

                // Use the jwt issuer to get discovery configuration

                let discoveryEndpoint = decodedJWT.iss + "/.well-known/openid-configuration";

                let jwksEndpoint = (await axios.get(discoveryEndpoint)).data.jwks_uri;

                let verifyResponse = await axios.post(
                    `${BASE_URL}/jwtVerify`,
                    JSON.stringify({
                        jwt,
                        jwksURL: jwksEndpoint
                    }),
                    {
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (verifyResponse.status !== 200) {
                    throw new Error("JWT Verification failed");
                }

                decodedJWT = verifyResponse.data;

                assertEqual(decodedJWT.sub, userId);
                assertEqual(decodedJWT._jwtPName, undefined);
                assertEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assertEqual(decodedJWT.customClaim, "customValue");
            });
        } finally {
            await browser.close();
        }
    });

    it("Test that openid discovery and get jwks APIs have no cors origin restrictions", async function() {
        await startSTWithJWTEnabled();

        let isJwtEnabled = await checkIfJWTIsEnabled();

        if (!isJwtEnabled) {
            return;
        }

        let instance = axios.create();

        let discoveryResponse = await instance.get(`${BASE_URL}/auth/.well-known/openid-configuration`);

        assert.equal(discoveryResponse.headers["access-control-allow-origin"], "*");

        let getJWKSResponse = await instance.get(`${BASE_URL}/auth/jwt/jwks.json`);

        assert.equal(getJWKSResponse.headers["access-control-allow-origin"], "*");
    });

    it("test when ACCESS_TOKEN_PAYLOAD_UPDATED is fired", async function() {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            const logs = [];
            page.on("console", ev => {
                const logText = ev.text();
                if (logText.startsWith("TEST_EV$")) {
                    logs.push(logText.split("$")[1]);
                }
            });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: ev => console.log(`TEST_EV$${ev.action}`)
                });
                supertokens.addAxiosInterceptors(axios);
                let userId = "testing-supertokens-website";

                await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                console.log("TEST_EV$LOGIN_FINISH");
                await axios.post(`${BASE_URL}/update-jwt`, {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ test: 1 })
                });
                console.log("TEST_EV$UPDATE1_FINISH");
                await delay(5);
                await axios.get(`${BASE_URL}/`, {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                console.log("TEST_EV$REFRESH_FINISH");

                await axios.post(`${BASE_URL}/update-jwt`, {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ test: 2 })
                });
                console.log("TEST_EV$UPDATE2_FINISH");

                await delay(5);
                await axios.post(`${BASE_URL}/update-jwt`, {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ test: 3 })
                });
                console.log("TEST_EV$UPDATE3_FINISH");

                await axios.post(`${BASE_URL}/logout`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
            });
            assert.deepEqual(logs, [
                "SESSION_CREATED",
                "LOGIN_FINISH",
                "ACCESS_TOKEN_PAYLOAD_UPDATED",
                "UPDATE1_FINISH",
                "REFRESH_SESSION",
                "REFRESH_FINISH",
                "ACCESS_TOKEN_PAYLOAD_UPDATED",
                "UPDATE2_FINISH",
                "REFRESH_SESSION",
                "ACCESS_TOKEN_PAYLOAD_UPDATED",
                "UPDATE3_FINISH",
                "SIGN_OUT"
            ]);
        } finally {
            await browser.close();
        }
    });

    it("test ACCESS_TOKEN_PAYLOAD_UPDATED when updated with handle", async function() {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            const logs = [];
            page.on("console", ev => {
                const logText = ev.text();
                if (logText.startsWith("TEST_EV$")) {
                    logs.push(logText.split("$")[1]);
                }
            });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: ev => console.log(`TEST_EV$${ev.action}`)
                });
                supertokens.addAxiosInterceptors(axios);
                let userId = "testing-supertokens-website";

                await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                console.log("TEST_EV$LOGIN_FINISH");
                await axios.post(`${BASE_URL}/update-jwt-with-handle`, {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ test: 1 })
                });
                console.log("TEST_EV$PAYLOAD_DB_UPDATED");
                await axios.get(`${BASE_URL}/`, {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                console.log("TEST_EV$QUERY_NO_REFRESH");
                await delay(5);
                await axios.get(`${BASE_URL}/`, {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                console.log("TEST_EV$REFRESH_FINISH");

                await axios.post(`${BASE_URL}/logout`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
            });
            assert.deepEqual(logs, [
                "SESSION_CREATED",
                "LOGIN_FINISH",
                "PAYLOAD_DB_UPDATED",
                "QUERY_NO_REFRESH",
                "ACCESS_TOKEN_PAYLOAD_UPDATED",
                "REFRESH_SESSION",
                "REFRESH_FINISH",
                "SIGN_OUT"
            ]);
        } finally {
            await browser.close();
        }
    });
});
