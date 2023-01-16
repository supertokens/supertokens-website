module.exports.addGenericTestCases = function (getTestCases) {
    getTestCases("fetch", (config) => {
        supertokens.init({
            onHandleEvent: (ev) => console.log(`TEST_EV$${JSON.stringify(ev)}`),
            ...config,
            apiDomain: BASE_URL,
        });
        window.toTest = async (config) => {
            const resp = await fetch(config.url, config);
            const responseText = await resp.text();

            return {
                url: resp.url,
                statusCode: resp.status,
                headers: resp.headers,
                responseText,
            };
        };
    });

    getTestCases("XHR", (config) => {
        supertokens.init({
            onHandleEvent: (ev) => console.log(`TEST_EV$${JSON.stringify(ev)}`),
            ...config,
            apiDomain: BASE_URL,
        });
        window.toTest = async (config) => {
            const request = new XMLHttpRequest();
            request.open(config.method || "GET", config.url);
            config.headers = config.headers || {};
            for (const [name, value] of Object.entries(config.headers)) {
                request.setRequestHeader(name, value);
            }
            if (config.credentials === "include") {
                request.withCredentials = true;
            }
            const loaded = new Promise((res, rej) => {
                request.onloadend = res;
                request.onerror = rej;
                request.ontimeout = rej;
                request.onabort = rej;
            });
            request.send(config.body);
            await loaded;
            const headers = new Headers(
                request
                    .getAllResponseHeaders()
                    .trim()
                    .split("\r\n")
                    .map((line) => line.split(": "))
            );
            const responseText = request.responseText;

            return {
                url: request.responseURL,
                statusCode: request.status,
                headers,
                responseText,
            };
        };
    });

    getTestCases("axios with axios interceptor", (config) => {
        supertokens.addAxiosInterceptors(axios);
        supertokens.init({
            onHandleEvent: (ev) => console.log(`TEST_EV$${JSON.stringify(ev)}`),
            ...config,
            apiDomain: BASE_URL,
        });
        window.toTest = async (config) => {
            let resp;
            try {
                resp = await axios({
                    method: config.method,
                    data: config.body,
                    url: config.url,
                    headers: config.headers,
                    withCredentials: config.credentials === "include",
                    responseType: "text",
                });
            } catch (err) {
                resp = err.response;
            }
            return {
                url: resp.config.url,
                statusCode: resp.status,
                headers: new Headers(Object.entries(resp.headers)),
                responseText: resp.data,
            };
        };
    });

    getTestCases("axios", (config) => {
        supertokens.init({
            onHandleEvent: (ev) => console.log(`TEST_EV$${JSON.stringify(ev)}`),
            ...config,
            apiDomain: BASE_URL,
        });
        window.toTest = async (config) => {
            let resp;
            try {
                resp = await axios({
                    method: config.method,
                    data: config.body,
                    url: config.url,
                    headers: config.headers,
                    withCredentials: config.credentials === "include",
                    responseType: "text",
                });
            } catch (err) {
                resp = err.response;
            }
            return {
                url: resp.config.url,
                statusCode: resp.status,
                headers: new Headers(Object.entries(resp.headers)),
                responseText: resp.data,
            };
        };
    });

    getTestCases("angular HTTPClient", async (config) => {
        await loadAngular();

        supertokens.init({
            onHandleEvent: (ev) => console.log(`TEST_EV$${JSON.stringify(ev)}`),
            ...config,
            apiDomain: BASE_URL,
        });

        window.toTest = async (config) => {
            let resp;
            try {
                resp = await angularHttpClient
                    .request(config.method || "GET", config.url, {
                        headers: config.headers,
                        body: config.body,
                        withCredentials: config.credentials === "include",
                        responseType: "text",
                        observe: "response",
                    })
                    .toPromise();
            } catch (error) {
                if (error.status === 0) {
                    // A client-side or network error occurred. Handle it accordingly.
                    throw error;
                } else {
                    // This mains we have a wrong error code, and this is about the same as resp above
                    resp = error;
                }
            }

            return {
                url: resp.url,
                statusCode: resp.status,
                headers: resp.headers,
                responseText: resp.error || resp.body,
            };
        };
    });
};
