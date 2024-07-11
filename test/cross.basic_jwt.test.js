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
    describe(`${name}: basic jwt handling`, function () {
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

        it("Test that the access token payload and the JWT have all valid claims after creating, refreshing and updating the payload", async function () {
            await startSTWithJWTEnabled();
            await setup();

            let isJwtEnabled = await checkIfJWTIsEnabled();

            if (!isJwtEnabled) {
                return;
            }

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
            await page.evaluate(async v3AccessTokenSupported => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // Create a session
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

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                assertEqual(accessTokenPayload.customClaim, "customValue");
                let jwt;

                if (v3AccessTokenSupported) {
                    jwt = await supertokens.getAccessToken();
                    assertEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload._jwtPName, undefined);
                } else {
                    assertNotEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload.sub, undefined);
                    assertEqual(accessTokenPayload._jwtPName, "jwt");
                    assertEqual(accessTokenPayload.iss, undefined);

                    jwt = accessTokenPayload.jwt;
                }

                // Decode the JWT
                let decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                let decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify the JWT claims
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assert.strictEqual(decodedJWT.customClaim, "customValue");

                // Update access token payload
                await toTest({
                    url: `${BASE_URL}/update-jwt`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ newClaim: "newValue" })
                });

                // Get access token payload
                accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();
                assertEqual(accessTokenPayload.customClaim, undefined);
                assertEqual(accessTokenPayload.newClaim, "newValue");

                // Verify new access token payload
                if (v3AccessTokenSupported) {
                    jwt = await supertokens.getAccessToken();
                    assertEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload._jwtPName, undefined);
                } else {
                    assertNotEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload.sub, undefined);
                    assertEqual(accessTokenPayload._jwtPName, "jwt");
                    assertEqual(accessTokenPayload.iss, undefined);

                    jwt = accessTokenPayload.jwt;
                }

                decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify new JWT
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.customClaim, undefined);
                assert.strictEqual(decodedJWT.newClaim, "newValue");

                let attemptRefresh = await supertokens.attemptRefreshingSession();
                assert.strictEqual(attemptRefresh, true);

                // Verify new access token payload
                assertEqual(accessTokenPayload.customClaim, undefined);
                assertEqual(accessTokenPayload.newClaim, "newValue");

                // Verify new access token payload
                if (v3AccessTokenSupported) {
                    jwt = await supertokens.getAccessToken();
                    assertEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload._jwtPName, undefined);
                } else {
                    assertNotEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload.sub, undefined);
                    assertEqual(accessTokenPayload._jwtPName, "jwt");
                    assertEqual(accessTokenPayload.iss, undefined);

                    jwt = accessTokenPayload.jwt;
                }

                decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify new JWT
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.customClaim, undefined);
                assert.strictEqual(decodedJWT.newClaim, "newValue");
            }, v3AccessTokenSupported);
        });

        it("Test that the access token payload and the JWT have all valid claims after updating access token payload", async function () {
            await startSTWithJWTEnabled();

            let isJwtEnabled = await checkIfJWTIsEnabled();

            if (!isJwtEnabled) {
                return;
            }

            await setup();
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
            await page.evaluate(async v3AccessTokenSupported => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // Create a session
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

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();
                assertEqual(accessTokenPayload.customClaim, "customValue");
                let jwt;

                if (v3AccessTokenSupported) {
                    jwt = await supertokens.getAccessToken();
                    assertEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload._jwtPName, undefined);
                } else {
                    assertNotEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload.sub, undefined);
                    assertEqual(accessTokenPayload._jwtPName, "jwt");
                    assertEqual(accessTokenPayload.iss, undefined);

                    jwt = accessTokenPayload.jwt;
                }

                // Decode the JWT
                let decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                let decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify the JWT claims
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assert.strictEqual(decodedJWT.customClaim, "customValue");

                // Update access token payload
                await toTest({
                    url: `${BASE_URL}/update-jwt`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        customClaim: undefined,
                        newClaim: "newValue"
                    })
                });

                // Get access token payload
                accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();
                assert.strictEqual(accessTokenPayload.customClaim, undefined);
                assert.strictEqual(accessTokenPayload.newClaim, "newValue");

                if (v3AccessTokenSupported) {
                    jwt = await supertokens.getAccessToken();
                    assertEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload._jwtPName, undefined);
                } else {
                    assertNotEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload.sub, undefined);
                    assertEqual(accessTokenPayload._jwtPName, "jwt");
                    assertEqual(accessTokenPayload.iss, undefined);

                    jwt = accessTokenPayload.jwt;
                }

                decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify new JWT
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.customClaim, undefined);
                assert.strictEqual(decodedJWT.newClaim, "newValue");
            }, v3AccessTokenSupported);
        });

        it("Test that access token payload and JWT are valid after the property name changes and payload is updated", async function () {
            await startSTWithJWTEnabled();

            let isJwtEnabled = await checkIfJWTIsEnabled();

            if (!isJwtEnabled || v3AccessTokenSupported) {
                return;
            }

            await setup();
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
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // Create a session
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

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                assertNotEqual(accessTokenPayload.jwt, undefined);
                assert.strictEqual(accessTokenPayload.sub, undefined);
                assert.strictEqual(accessTokenPayload._jwtPName, "jwt");
                assert.strictEqual(accessTokenPayload.iss, undefined);
                assert.strictEqual(accessTokenPayload.customClaim, "customValue");

                let jwt = accessTokenPayload.jwt;

                // Decode the JWT
                let decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                let decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify the JWT claims
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assert.strictEqual(decodedJWT.customClaim, "customValue");

                await toTest({
                    url: `${BASE_URL}/reinitialiseBackendConfig`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        jwtPropertyName: "customJWTProperty"
                    })
                });

                // Update access token payload
                await toTest({
                    url: `${BASE_URL}/update-jwt`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ newClaim: "newValue" })
                });

                // Get access token payload
                accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                // Verify new access token payload
                assertNotEqual(accessTokenPayload.jwt, undefined);
                assert.strictEqual(accessTokenPayload.sub, undefined);
                assert.strictEqual(accessTokenPayload._jwtPName, "jwt");
                assert.strictEqual(accessTokenPayload.iss, undefined);
                assert.strictEqual(accessTokenPayload.customClaim, undefined);
                assert.strictEqual(accessTokenPayload.customJWTProperty, undefined);
                assert.strictEqual(accessTokenPayload.newClaim, "newValue");

                jwt = accessTokenPayload.jwt;

                decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify new JWT
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assert.strictEqual(decodedJWT.customClaim, undefined);
                assert.strictEqual(decodedJWT.newClaim, "newValue");
            });
        });

        it("Test that access token payload and JWT are valid after the property name changes and session is refreshed", async function () {
            await startSTWithJWTEnabled();

            let isJwtEnabled = await checkIfJWTIsEnabled();

            if (!isJwtEnabled || v3AccessTokenSupported) {
                return;
            }

            await setup();
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
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // Create a session
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

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                assertNotEqual(accessTokenPayload.jwt, undefined);
                assert.strictEqual(accessTokenPayload.sub, undefined);
                assert.strictEqual(accessTokenPayload._jwtPName, "jwt");
                assert.strictEqual(accessTokenPayload.iss, undefined);
                assert.strictEqual(accessTokenPayload.customClaim, "customValue");

                let jwt = accessTokenPayload.jwt;

                // Decode the JWT
                let decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                let decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify the JWT claims
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assert.strictEqual(decodedJWT.customClaim, "customValue");

                await toTest({
                    url: `${BASE_URL}/reinitialiseBackendConfig`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        jwtPropertyName: "customJWTProperty"
                    })
                });

                let attemptRefresh = await supertokens.attemptRefreshingSession();
                assert.strictEqual(attemptRefresh, true);

                // Get access token payload
                accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                // Verify new access token payload
                assert.strictEqual(accessTokenPayload.jwt, undefined);
                assertNotEqual(accessTokenPayload.customJWTProperty, undefined);
                assert.strictEqual(accessTokenPayload.sub, undefined);
                assert.strictEqual(accessTokenPayload._jwtPName, "customJWTProperty");
                assert.strictEqual(accessTokenPayload.iss, undefined);
                assert.strictEqual(accessTokenPayload.customClaim, "customValue");

                jwt = accessTokenPayload.customJWTProperty;

                decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify new JWT
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assert.strictEqual(decodedJWT.customClaim, "customValue");
            });
        });

        it("Test that access token payload and jwt are valid after the session has expired", async function () {
            await startSTWithJWTEnabled(3);

            let isJwtEnabled = await checkIfJWTIsEnabled();

            if (!isJwtEnabled) {
                return;
            }

            await setup();
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
            await page.evaluate(async v3AccessTokenSupported => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // Create a session
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

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();
                assert.strictEqual(accessTokenPayload.customClaim, "customValue");

                let jwt;

                if (v3AccessTokenSupported) {
                    jwt = await supertokens.getAccessToken();
                    assertEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload._jwtPName, undefined);
                } else {
                    assertNotEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload.sub, undefined);
                    assertEqual(accessTokenPayload._jwtPName, "jwt");
                    assertEqual(accessTokenPayload.iss, undefined);

                    jwt = accessTokenPayload.jwt;
                }

                let decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                let decodedJWT = JSON.parse(decodeResponse.responseText);

                let jwtExpiry = decodedJWT.exp;

                // Wait for access token to expire
                await delay(5);

                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();

                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);

                assert.strictEqual(accessTokenPayload.customClaim, "customValue");

                if (v3AccessTokenSupported) {
                    jwt = await supertokens.getAccessToken();
                    assertEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload._jwtPName, undefined);
                } else {
                    assertNotEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload.sub, undefined);
                    assertEqual(accessTokenPayload._jwtPName, "jwt");
                    assertEqual(accessTokenPayload.iss, undefined);

                    jwt = accessTokenPayload.jwt;
                }

                decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify new JWT
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assert.strictEqual(decodedJWT.customClaim, "customValue");

                let newJwtExpiry = decodedJWT.exp;

                assert.strictEqual(newJwtExpiry > Math.ceil(Date.now() / 1000), true);
                assertNotEqual(jwtExpiry, newJwtExpiry);
            }, v3AccessTokenSupported);
        });

        it("Test full JWT flow with open id discovery", async function () {
            await startSTWithJWTEnabled(20);

            let isJwtEnabled = await checkIfJWTIsEnabled();

            if (!isJwtEnabled) {
                return;
            }

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
                        client.getSigningKey(header.kid, function (err, key) {
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
            await setup();
            await page.evaluate(async v3AccessTokenSupported => {
                let userId = "testing-supertokens-website";

                // Create a session
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

                // Verify access token payload
                let accessTokenPayload = await supertokens.getAccessTokenPayloadSecurely();
                assert.strictEqual(accessTokenPayload.customClaim, "customValue");

                let jwt;

                if (v3AccessTokenSupported) {
                    jwt = await supertokens.getAccessToken();
                    assertEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload._jwtPName, undefined);
                } else {
                    assertNotEqual(accessTokenPayload.jwt, undefined);
                    assertEqual(accessTokenPayload.sub, undefined);
                    assertEqual(accessTokenPayload._jwtPName, "jwt");
                    assertEqual(accessTokenPayload.iss, undefined);

                    jwt = accessTokenPayload.jwt;
                }

                let decodeResponse = await toTest({
                    url: `${BASE_URL}/jsondecode`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jwt })
                });

                let decodedJWT = JSON.parse(decodeResponse.responseText);

                // Verify the JWT claims
                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assert.strictEqual(decodedJWT.customClaim, "customValue");

                // Use the jwt issuer to get discovery configuration

                let discoveryEndpoint = decodedJWT.iss + "/.well-known/openid-configuration";

                let jwksEndpoint = (await (await fetch(discoveryEndpoint)).json()).jwks_uri;

                let verifyResponse = await toTest({
                    url: `${BASE_URL}/jwtVerify`,
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        jwt,
                        jwksURL: jwksEndpoint
                    })
                });

                if (verifyResponse.statusCode !== 200) {
                    throw new Error("JWT Verification failed");
                }

                decodedJWT = JSON.parse(verifyResponse.responseText);

                assert.strictEqual(decodedJWT.sub, userId);
                assert.strictEqual(decodedJWT._jwtPName, undefined);
                assert.strictEqual(decodedJWT.iss, "http://0.0.0.0:8080/auth");
                assert.strictEqual(decodedJWT.customClaim, "customValue");
            }, v3AccessTokenSupported);
        });
    });
});
