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
let SuperTokens = require("supertokens-node");
let express = require("express");
let cookieParser = require("cookie-parser");
let bodyParser = require("body-parser");
let http = require("http");
let { startST, stopST, killAllST, setupST, cleanST, setKeyValueInConfig } = require("./utils");
let { package_version } = require("../../lib/build/version");
let noOfTimesRefreshCalledDuringTest = 0;
let noOfTimesGetSessionCalledDuringTest = 0;

let urlencodedParser = bodyParser.urlencoded({ limit: "20mb", extended: true, parameterLimit: 20000 });
let jsonParser = bodyParser.json({ limit: "20mb" });

let app = express();
app.use(urlencodedParser);
app.use(jsonParser);
app.use(cookieParser());

SuperTokens.init([
    {
        hostname: "localhost",
        port: 9000
    }
]);

app.options("*", async (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
    res.header("Access-Control-Allow-Headers", "content-type");
    res.header("Access-Control-Allow-Methods", "*");
    SuperTokens.setRelevantHeadersForOptionsAPI(res);
    res.send("");
});

app.post("/login", async (req, res) => {
    try {
        let userId = req.body.userId;
        let session = await SuperTokens.createNewSession(res, userId);
        res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
        res.header("Access-Control-Allow-Credentials", true);
        res.send(session.userId);
    } catch (err) {
        res.status(500).send("");
    }
});

app.post("/startst", async (req, res) => {
    let accessTokenValidity = req.body.accessTokenValidity === undefined ? 1 : req.body.accessTokenValidity;
    let enableAntiCsrf = req.body.enableAntiCsrf === undefined ? true : req.body.enableAntiCsrf;
    await setKeyValueInConfig("access_token_validity", accessTokenValidity);
    await setKeyValueInConfig("enable_anti_csrf", enableAntiCsrf);
    let pid = await startST();
    res.send(pid + "");
});

app.post("/beforeeach", async (req, res) => {
    noOfTimesRefreshCalledDuringTest = 0;
    noOfTimesGetSessionCalledDuringTest = 0;
    await killAllST();
    await setupST();
    await setKeyValueInConfig("cookie_domain", '"localhost"');
    await setKeyValueInConfig("cookie_secure", "false");
    res.send();
});

app.post("/after", async (req, res) => {
    await killAllST();
    await cleanST();
    res.send();
});

app.post("/stopst", async (req, res) => {
    await stopST(req.body.pid);
    res.send("");
});

app.post("/testUserConfig", async (req, res) => {
    res.status(200).send();
});

app.post("/multipleInterceptors", async (req, res) => {
    res.status(200).send(
        req.headers.interceptorheader2 !== undefined && req.headers.interceptorheader1 !== undefined
            ? "success"
            : "failure"
    );
});

app.get("/", async (req, res) => {
    try {
        noOfTimesGetSessionCalledDuringTest += 1;
        await SuperTokens.getSession(req, res, true);
        res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
        res.header("Access-Control-Allow-Credentials", true);
        res.send("success");
    } catch (err) {
        res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
        res.header("Access-Control-Allow-Credentials", true);
        res.status(440).send();
    }
});

app.use("/testing", async (req, res) => {
    let tH = req.headers["testing"];
    if (tH !== undefined) {
        res.header("testing", tH);
    }
    res.send("success");
});

app.post("/logout", async (req, res) => {
    try {
        let sessionInfo = await SuperTokens.getSession(req, res, true);
        await sessionInfo.revokeSession();
        res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
        res.header("Access-Control-Allow-Credentials", true);
        res.send("success");
    } catch (err) {
        res.status(440).send();
    }
});

app.post("/revokeAll", async (req, res) => {
    try {
        let sessionInfo = await SuperTokens.getSession(req, res, true);
        let userId = sessionInfo.userId;
        await SuperTokens.revokeAllSessionsForUser(userId);
        res.send("success");
    } catch (err) {
        res.status(440).send();
    }
});

app.post("/refresh", async (req, res) => {
    try {
        await SuperTokens.refreshSession(req, res);
        refreshCalled = true;
        noOfTimesRefreshCalledDuringTest += 1;
    } catch (err) {
        res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
        res.header("Access-Control-Allow-Credentials", true);
        res.status(440).send();
        return;
    }
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
    res.header("Access-Control-Allow-Credentials", true);
    res.send("refresh success");
});

app.get("/refreshCalledTime", async (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
    res.status(200).send("" + noOfTimesRefreshCalledDuringTest);
});

app.get("/getSessionCalledTime", async (req, res) => {
    res.status(200).send("" + noOfTimesGetSessionCalledDuringTest);
});
app.get("/getPackageVersion", async (req, res) => {
    res.status(200).send("" + package_version);
});

app.get("/ping", async (req, res) => {
    res.send("success");
});

app.get("/testHeader", async (req, res) => {
    let testHeader = req.headers["st-custom-header"];
    let success = true;
    if (testHeader === undefined) {
        success = false;
    }
    let data = {
        success
    };
    res.send(JSON.stringify(data));
});

app.get("/checkDeviceInfo", (req, res) => {
    let sdkName = req.headers["supertokens-sdk-name"];
    let sdkVersion = req.headers["supertokens-sdk-version"];
    res.send(sdkName === "website" && sdkVersion === package_version ? true : false);
});

app.post("/checkAllowCredentials", (req, res) => {
    res.send(req.headers["allow-credentials"] !== undefined ? true : false);
});

app.get("/index", (req, res) => {
    res.sendFile("index.html", { root: __dirname });
});
app.get("/testError", (req, res) => {
    res.status(500).send("test error message");
});

app.get("/stop", async (req, res) => {
    process.exit();
});

app.use("*", async (req, res, next) => {
    res.status(404).send();
});

app.use("*", async (err, req, res, next) => {
    res.send(500).send(err);
});

let server = http.createServer(app);
server.listen(8080, "0.0.0.0");
