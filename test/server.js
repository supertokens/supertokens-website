let SuperTokens = require("supertokens-node-mysql-ref-jwt/express");
let { reset } = require("supertokens-node-mysql-ref-jwt/lib/build/helpers/utils");
let express = require("express");
let cookieParser = require("cookie-parser");
let bodyParser = require("body-parser");

let mysqlCommonConfig = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "root",
    database: process.env.MYSQL_DB || "auth_session",
    tables: {
        refreshTokens: "refresh_token_test",
        signingKey: "signing_key_test"
    }
};

function headerMiddleware(req, res, next) {
    let tH = req.headers["testing"];
    if (tH !== undefined) {
        res.header("testing", tH);
    }
    next();
}

function simulateBrowser(req, res, next) {
    req.headers.cookie = document.cookie;
    next();
}

class Server {
    constructor() {
        let urlencodedParser = bodyParser.urlencoded({ limit: "20mb", extended: true, parameterLimit: 20000 });
        let jsonParser = bodyParser.json({ limit: "20mb" });

        let app = express();
        app.use(urlencodedParser);
        app.use(jsonParser);
        app.use(simulateBrowser);
        app.use(cookieParser());

        app.post("/login", async (req, res) => {
            let userId = req.body.userId;
            await SuperTokens.createNewSession(res, userId);
            if (Array.isArray(res.getHeaders()["set-cookie"])) {
                document.cookie = res.getHeaders()["set-cookie"].join("; ");
            }
            res.send(userId);
        });

        app.get("/", async (req, res) => {
            try {
                await SuperTokens.getSession(req, res, true);
                if (Array.isArray(res.getHeaders()["set-cookie"])) {
                    document.cookie = res.getHeaders()["set-cookie"].join("; ");
                }
            } catch (err) {
                res.status(440).send();
                return;
            }
            res.send("success");
        });

        app.get("/testing", headerMiddleware, async (req, res) => {
            res.send("success");
        });

        app.put("/testing", headerMiddleware, async (req, res) => {
            res.send("success");
        });

        app.post("/testing", headerMiddleware, async (req, res) => {
            res.send("success");
        });

        app.delete("/testing", headerMiddleware, async (req, res) => {
            res.send("success");
        });

        app.post("/logout", async (req, res) => {
            try {
                let sessionInfo = await SuperTokens.getSession(req, res, true);
                await sessionInfo.revokeSession();
                if (Array.isArray(res.getHeaders()["set-cookie"])) {
                    document.cookie = res.getHeaders()["set-cookie"].join("; ");
                }
            } catch (err) {
                res.status(440).send();
                return;
            }
            res.send("success");
        });

        app.post("/revokeAll", async (req, res) => {
            try {
                let sessionInfo = await SuperTokens.getSession(req, res, true);
                let userId = sessionInfo.userId;
                await SuperTokens.revokeAllSessionsForUser(userId);
                if (Array.isArray(res.getHeaders()["set-cookie"])) {
                    document.cookie = res.getHeaders()["set-cookie"].join("; ");
                }
            } catch (err) {
                res.status(440).send();
                return;
            }
            res.send("success");
        });

        app.post("/refresh", async (req, res) => {
            try {
                await SuperTokens.refreshSession(req, res);
                if (Array.isArray(res.getHeaders()["set-cookie"])) {
                    document.cookie = res.getHeaders()["set-cookie"].join("; ");
                }
                refreshCalled = true;
                noOfTimesRefreshCalledDuringTest += 1;
            } catch (err) {
                res.status(440).send();
                return;
            }
            res.send("success");
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

        app.use("*", async (req, res, next) => {
            res.status(404).send();
        });

        app.use("*", async (err, req, res, next) => {
            res.send(500).send();
        });

        this.server = app.listen(8888);
    }

    static async createNew(accessTokenValidity = 1) {
        await reset();
        await SuperTokens.init({
            mysql: mysqlCommonConfig,
            tokens: {
                accessToken: {
                    validity: accessTokenValidity
                },
                refreshToken: {
                    renewTokenPath: "/refresh"
                }
            },
            cookie: {
                domain: "localhost:8888"
            }
        });
        return new Server();
    }

    close() {
        this.server.close();
        delete this;
    }
}

module.exports = Server;
