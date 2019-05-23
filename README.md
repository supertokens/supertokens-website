![SuperTokens banner](https://raw.githubusercontent.com/supertokens/supertokens-node-mysql-ref-jwt/master/images/github%20cover.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://github.com/supertokens/supertokens-website/blob/master/LICENSE)

This is a library written in TypeScript that implements the **frontend part of user session management for websites**. You can use this to make http(s) API calls to your backend that require an authenticated user.

Features:
- When you make an API call, and if the access token has expired, this library will automatically take care of refreshing the token for you. After successfully refreshing it, it will call your API with the new token again and return its response.
- Takes care of race conditions mentioned in the footer of this blog post. <TODO blog post link>

## Installation
To get started, you just need to do:
```bash
npm i --save supertokens-website
```

## Usage
This library is to be used instead of axios in places where the API requires auth tokens.
```js
import * as SuperTokensRequest from "supertokens-website";
```
### SuperTokensRequest.init(refreshTokenURL, sessionExpiredStatusCode)
- To be called at least once before any http request is made from your frontend that uses this library. For example, if your website is a single page ReactJS app, then you can call this in the constructor of the root component.
```js
// @params refreshTokenURL: this is the path to API endpoint that is responsible for refreshing the session when the access token expires.
// @params sessionExpiredStatusCode: this is the status code that will be sent by any API that detects session expiry.
// @returns void
SuperTokensRequest.init("/api/refreshtoken", 440)
```
### SuperTokensRequest.get(url, config)
- send a GET request to this url - to be used only with your app's APIs
```js
// @params url: endpoint to your GET API
// @params config: this is same as axios config
// @returns Promise
SuperTokensRequest.get("/someAPI", config).then(response => {
  // API response.
}).catch(err => {
  // err is of type axios error
});
```
### SuperTokensRequest.post(url, data, config)
- send a POST request to this url - to be used only with your app's APIs
```js
// @params url: endpoint to your POST API
// @params data: post body data - key value object
// @params config: this is same as axios config
// @returns Promise
SuperTokensRequest.post("/someAPI", data, config).then(response => {
  // API response.
}).catch(err => {
  // err is of type axios error
});
```
### SuperTokensRequest.delete(url, config)
- send a DELETE request to this url - to be used only with your app's APIs
```js
// @params url: endpoint to your DELETE API
// @params config: this is same as axios config
// @returns Promise
SuperTokensRequest.delete("/someAPI", config).then(response => {
  // API response.
}).catch(err => {
  // err is of type axios error
});
```
### SuperTokensRequest.put(url, data, config)
- send a PUT request to this url - to be used only with your app's APIs
```js
// @params url: endpoint to your PUT API
// @params data: put body data - key value object
// @params config: this is same as axios config
// @returns Promise
SuperTokensRequest.post("/someAPI", data, config).then(response => {
  // API response.
}).catch(err => {
  // err is of type axios error
});
```
### SuperTokensRequest.doRequest(func)
- use this function to send a request using any other http method that is not mentioned above
```js
// @params func: a function that returns a Promise returned by calling the axios function
// @returns Promise
SuperTokensRequest.doRequest(() => axios(...)).then(response => {
  // API response.
}).catch(err => {
  // err is of type axios error
});
```
### SuperTokensRequest.attemptRefreshingSession()
- use this function when you want to manually refresh the session.
```js
// @params func: a function that returns a Promise returned by calling the axios function
// @returns Promise
SuperTokensRequest.attemptRefreshingSession().then(success => {
  if (success) {
    // session may have refreshed successfully 
  } else {
    // user has been logged out. Redirect to login page
  }
}).catch(err => {
  // err is of type axios error
});
```

## Example code & Demo
You can play around with the [demo project](https://github.com/supertokens/auth-demo) that uses this and the [supertokens-node-mysql-ref-jwt](https://github.com/supertokens/supertokens-node-mysql-ref-jwt) library. The demo demonstrates how this package behaves when it detects auth token theft (and the best part - you are the hacker here, muahahaha!)

## Making changes
This library is written in TypeScript (TS). When you make any changes to the .ts files in the root folder, run the following command to compile to .js:
```bash
tsc -p tsconfig.json
```

## Authors
Created with :heart: by the folks at SuperTokens. We are a startup passionate about security and solving software challenges in a way that's helpful for everyone! Please feel free to give us feedback at team@supertokens.io, until our website is ready :grinning:
