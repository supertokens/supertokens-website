# SuperTokens

## About
This is a library written in TypeScript that implements the frontend part of user session management for websites. You can use this to make http(s) API calls to your backend that require an authenticated user.

Features:
- When you make an API call, and if the access token has expired, this library will transparently take care of refreshing the session for you. After successfully refreshing it, it will call your API for you again and return its response.
- Takes care of race conditions mentioned in the footer of this blog post: <TODO blog post link>

## Installation
```bash
npm i --save auth-website
```

## Usage
This library is to be used instead of axios in places where the API requires auth tokens.
```js
import * as AuthRequest from "auth-website";
```
### AuthRequest.init(refreshTokenURL, sessionExpiredStatusCode)
- To be called at least once before any http request, that uses this library, is made from your frontend. For example, if your website is a single page ReactJS app, then you can call this in the constructor of the root component.
```js
// @params refreshTokenURL: this is the path to API endpoint that is responsible for refreshing the session when the access token expires.
// @params sessionExpiredStatusCode: this is the status code that will be sent by any API that detects session expiry.
// @returns void
AuthRequest.init("/api/refreshtoken", 440)
```
### AuthRequest.get(url, config)
- send a GET request to this url - to be used only with your app's APIs
```js
// @params url: endpoint to your GET API
// @params config: this is same as axios config
// @returns Promise
AuthRequest.get("/someAPI", config).then(response => {
  // API response.
}).catch(err => {
  // err is of type axios error
});
```
### AuthRequest.post(url, data, config)
- send a POST request to this url - to be used only with your app's APIs
```js
// @params url: endpoint to your POST API
// @params data: post body data - key value object
// @params config: this is same as axios config
// @returns Promise
AuthRequest.post("/someAPI", data, config).then(response => {
  // API response.
}).catch(err => {
  // err is of type axios error
});
```
### AuthRequest.delete(url, config)
- send a DELETE request to this url - to be used only with your app's APIs
```js
// @params url: endpoint to your DELETE API
// @params config: this is same as axios config
// @returns Promise
AuthRequest.delete("/someAPI", config).then(response => {
  // API response.
}).catch(err => {
  // err is of type axios error
});
```
### AuthRequest.put(url, data, config)
- send a PUT request to this url - to be used only with your app's APIs
```js
// @params url: endpoint to your PUT API
// @params data: put body data - key value object
// @params config: this is same as axios config
// @returns Promise
AuthRequest.post("/someAPI", data, config).then(response => {
  // API response.
}).catch(err => {
  // err is of type axios error
});
```
### AuthRequest.doRequest(func)
- use this function to send a request using any other http method that is not mentioned above
```js
// @params func: a function that returns a Promise returned by calling the axios function
// @returns Promise
AuthRequest.doRequest(() => axios(...)).then(response => {
  // API response.
}).catch(err => {
  // err is of type axios error
});
```
### AuthRequest.attemptRefreshingSession()
- use this function when you want to manually refresh the session.
```js
// @params func: a function that returns a Promise returned by calling the axios function
// @returns Promise
AuthRequest.attemptRefreshingSession().then(success => {
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
You can play around with the demo project that uses this and the [auth-node-mysql-ref-jwt](https://github.com/supertokens/auth-node-mysql-ref-jwt) library. The demo demonstrats how this package behaves when it detects auth token theft (and the best part is that you are the attacker, muahahaha)!

## Making changes
This library is written in TypeScript (TS). When you make any changes to the .ts files in the root folder, run the following command to compile to .js:
```bash
tsc -p tsconfig.json
```

## Authors
- Written with :heart: by the folks at SuperTokens. We are a startup passionate about security and solving software challenges in a way that's helpful for everyone! Please feel free to give us feedback at team@supertokens.io, until our website is ready :grinning:

## License
MIT license. For more information, please see the license tab on this repo.
