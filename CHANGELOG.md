# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [unreleased]

## [20.1.5] - 2024-10-03

### Changes

- Added `3.1` and `4.0` to the list of supported FDIs
- Now we throw and log an error if a successful refresh response doesn't have the `front-token` header. This used to break the session state.

## [20.1.4] - 2024-07-11

### Changes

- Removed redundant `removeToken` calls
- Improves test stability

## [20.1.3] - 2024-07-09

- Adds new test

## [20.1.2] - 2024-06-26

### Changes

- Fixed a session refresh loop caused by blocked cookie writes. The SDK would throw/log a helpful error message when this happens.

## [20.1.1] - 2024-06-13

### Changes

- Added a warning if the SDK can't save to cookies to help people notice/debug these issues faster.

### Fixes

- Fixed an issue in the Axios interceptor that caused it to throw when encountering a network error

## [20.1.0] - 2024-05-31

### Changes

- Fixed the session refresh loop in all the request interceptors that occurred when an API returned a 401 response despite a valid session. Interceptors now attempt to refresh the session a maximum of ten times before throwing an error. The retry limit is configurable via the `maxRetryAttemptsForSessionRefresh` option.

## [20.0.1] - 2024-05-24

### Changes

- Added 2.0 and 3.0 to supported FDIs
- Now we use the locking to make sure that refreshing claims happens only once even for concurrent validateClaims calls
  - The locking mechanism is configurable through by providing a `lockFactory` function in the configuration

## [20.0.0] - 2024-04-03

### Breaking changes

The `shouldDoInterceptionBasedOnUrl` function now returns true: 
- If `sessionTokenBackendDomain` is a valid subdomain of the URL's domain. This aligns with the behavior of browsers when sending cookies to subdomains.
- Even if the ports of the URL you are querying are different compared to the `apiDomain`'s port ot the `sessionTokenBackendDomain` port (as long as the hostname is the same, or a subdomain of the `sessionTokenBackendDomain`): https://github.com/supertokens/supertokens-website/issues/217


**Before:**

  ```javascript
    shouldDoInterceptionBasedOnUrl("https://sub.api.example.com", "", "api.example.com") // false
    shouldDoInterceptionBasedOnUrl("https://sub.api.example.com", "", ".api.example.com") // true
    shouldDoInterceptionBasedOnUrl("https://sub.api.example.com", "", "example.com") // false
    shouldDoInterceptionBasedOnUrl("https://sub.api.example.com", "", ".example.com") // true
    shouldDoInterceptionBasedOnUrl("https://api.example.com", "", ".example.com:8080") // false
    shouldDoInterceptionBasedOnUrl("https://api.example.com", "https://example.com:8080") // false
  ```

**After:**
  
  ```javascript
    shouldDoInterceptionBasedOnUrl("https://sub.api.example.com", "", "api.example.com") // true
    shouldDoInterceptionBasedOnUrl("https://sub.api.example.com", "", ".api.example.com") // true
    shouldDoInterceptionBasedOnUrl("https://sub.api.example.com", "", "example.com") // true
    shouldDoInterceptionBasedOnUrl("https://sub.api.example.com", "", ".example.com") // true
    shouldDoInterceptionBasedOnUrl("https://api.example.com", "", ".example.com:8080") // true
    shouldDoInterceptionBasedOnUrl("https://api.example.com", "https://example.com:8080") // true
  ```

## [19.0.1] - 2024-03-18
- Fixes test server

## [19.0.0] - 2024-03-14

### Breaking changes

- Rename `validatorId` in claim validation errors to `id` to match the backend SDKs

### Changes

- Added `1.19` to the list of supported FDIs

## [18.0.2] - 2024-02-23

### Fixes

- Fix the type of the `builder` object the function override callback gets. It is not longer optional.

## [18.0.1] - 2024-02-06

### Fixes

- Fix an issue that caused `attemptRefreshingSession` to throw in some cases when getting a 401 response from the refresh endpoint

## [18.0.0] - 2024-01-18

## Breaking Changes

- The default `DateProvider` implementation relies on `localStorage`. If your environment lacks support for `localStorage`, you must provide custom implementations for either the `DateProvider` or `localStorage`.

### Added

- Added a `DateProvider`, that both built-in and custom validators can use instead of `Date.now` to get an estimate of the server clock.
- Added the `dateProvider` prop to the configuration that can be used to customize the built-in `DateProvider`.
- Added `getClockSkewInMillis` as an overrideable function that estimates the time difference between the backend and the client.
- Added a test to check that relative URLs get intercepted correctly

## [17.0.5] - 2024-01-03

### Fixes

- Fix typo in debug logging

## [17.0.4] - 2023-09-24

### Test changes

-   Split some test suites into multiple files to help with test parallelization

## [17.0.3] - 2023-09-XX

### Changes

- Added `1.18` to supported FDI versions

## [17.0.2] - 2023-07-19

### Changes

- Added `1.17` to supported FDI versions

## [17.0.1] - 2023-07-04

### Changes

- Added `shouldDoInterceptionBasedOnUrl` as an overrideable function to the recipe interface

### Fixes

- Fixed an issue where the Authorization header was getting removed unnecessarily

## [17.0.0] - 2023-06-07

### Breaking changes

- Made SessionClaimValidator a type instead of an abstract class

## [16.0.10] - 2023-05-19

### Fixes

- Always clearing locally stored access and refresh tokens if the front-token is removed to handle proxies omitting empty headers

## [16.0.9] - 2023-05-05

### Changes

- Updated tests/test server to match new backend version supporting v3 access tokens

### Fixes

- Fixes fetch interceptor calling clone on URL instances

## [16.0.8] - 2023-04-25
- Passes windowHandler's localstorage to browser-tabs-lock as well.

## [16.0.7] - 2023-04-19
- Relaxes test constraint related to legacy axios interceptor.

## [16.0.6] - 2023-04-18
### Fixes

-   Refactored XMLHttpRequest interceptor to fix a possible issue timing issue: https://github.com/supertokens/supertokens-website/issues/208

## [16.0.5] - 2023-04-13

### Fixes

-   Fixed an issue that could cause an infinite refresh loop in the legacy axios interceptor (explicitly disabling the XHR interceptor) if the access token changed during the request

## [16.0.4] - 2023-03-29

### Changes

-   Switched dependency away from the removed/unpublished `mocha-split-tests` package

## [16.0.3] - 2023-03-13
### Changes

- Adding refresh tokens to refresh calls even if access token isn't present to make manual testing easier.

## [16.0.2] - 2023-03-07
- Exposed getGlobalClaimValidators function via utils.

## [16.0.1] - 2023-02-02

### Fixes

-   Fixed a rare case where the XHR interceptor didn't handle empty response headers correctly

## [16.0.0] - 2023-02-01

### Breaking changes

-   Only supporting FDI 1.16
-   The backend SDK should be updated to a version supporting the header-based sessions!
    -   supertokens-node: >= 13.0.0
    -   supertokens-python: >= 0.12.0
    -   supertokens-golang: >= 0.10.0
-   Renamed configuration options:
    -   `sessionScope` renamed to `sessionTokenFrontendDomain`
    -   `cookieDomain` renamed to `sessionTokenBackendDomain`
- Added `getHost` function to the `WindowHandlerInterface`.

### Added

-   Added support for authorizing requests using the `Authorization` header instead of cookies
    -   Added `tokenTransferMethod` config option
    -   Check out https://supertokens.com/docs/thirdpartyemailpassword/common-customizations/sessions/token-transfer-method for more information
- Added `includesAny` validator to Primitive Array claims.

## [15.0.0] - 2022-12-09

### Added
- Add ability to specify a lockFactory to override the default browser-tabs-lock

### Changed

- Added `getWindowUnsafe` to the WindowHandlerInterface. This function should return the raw window object.

## [14.0.3] - 2022-11-24

### Fixes

- doesSessionExist now refreshes the session if it detects an expired access token

## [14.0.2] - 2022-10-24

### Fixes

- XMLHttpRequest event dispatching should now work in Safari.
- A race-condition blocking XMLHttpRequests in Chrome is now fixed.

## [14.0.1] - 2022-10-21

### Fixes
- Retrying request post refreshing now remembers the original input body.

## [14.0.0] - 2022-10-17

### Added

- Adding an interceptor for XMLHttpRequest by default upon initializing SuperTokens
- Marked `addAxiosInterceptors` as deprecated
- Request interception can now be disabled by adding `superTokensDoNotDoInterception` to the hash of the request (works as a queryparam as well)

## [13.1.1] - 2022-10-14

- Removed default max age from claims

## [13.1.0] - 2022-09-14
### Added

- Support for new FDI (1.15)
- Added the `API_INVALID_CLAIM` event and the related `invalidClaimStatusCode` config prop.
- Adds base classes, types for session claims, and the `getInvalidClaimsFromResponse`, `validateClaims`, `getClaimValue` functions.

## [13.0.2] - 2022-08-11
### Changes

- Updates README
- Updates dependencies to fix building in node 17 + match typescript version of auth-react
- Refactors the way the SDK exports the error class

## [13.0.1] - 2022-06-27
- Fixes node dependency for integration tests

## [13.0.0] - 2022-06-27

### Breaking changes

- Removes `setCookieSync` and `getCookieSync` from the interface for `cookieHandler` when calling `SuperTokens.init`

## [12.2.0] - 2022-06-25
- Adds new FDI support (1.14)

## [12.1.0] - 2022-06-15

### Changed

- Calling `SuperTokens.signOut` now throws `STGeneralError` if the API responds with a general error status

## [12.0.0] - 2022-06-02

- Adds tests for custom cookie and window handlers

### Added

- You can now configure a `postAPIHook` when calling `SuperTokens.init` to subscribe to and handle to network responses

### Breaking changes

- Adds user context to all functions exposed to the user, and to API and Recipe interface functions. This is a non breaking change for User exposed function calls, but a breaking change if you are using the recipe override feature.
- All recipe functions now accept an object (instead of inidividual parameters), this is a breaking change only if you are using the override feature.
- Recipe functions no longer accept the `config` parameter, this is a breaking change if you are using the override feature
- Renames properties for `windowHandler`
  - getLocalStorage -> RENAMED to localStorage
  - getSessionStorage -> RENAMED to sessionStorage
- `windowHandler` uses a new interface type for localStorage and sessionStorage

## [11.0.2] - 2022-05-14

- Updates debug log message

## [11.0.1] - 2022-05-13

- Adds debug logs

## [11.0.0] - 2022-05-11

- Add the `ACCESS_TOKEN_PAYLOAD_UPDATED` event

## [10.1.0] - 2022-05-10

### Adds

- A new config property `cookieHandler` that allows for custom handling when the SDK reads/writes cookies
- A new config property `windowHandler` that allows for custom handling when the SDK uses any functions from the Window API.

## [10.0.11] - 2022-04-28

- For electron apps, prod build, we now handle `window.location.hostname` being an empty string.

## [10.0.10] - 2022-04-10

### Fixes

- Setting headers in first param of fetch (https://github.com/supertokens/supertokens-website/issues/116)

## [10.0.9] - 2022-03-18

### Adds

- New FDI support (v1.13)
- Workflow to verify if pr title follows conventional commits

## [10.0.8] - 2022-01-25

### Fixes

- Issue https://github.com/supertokens/supertokens-website/issues/99

## [10.0.7] - 2022-01-13

### Adds

- FDI 1.12 compatibility

## [10.0.6] - 2021-12-16

### Added

- Compatibility with FDI 1.11
- Add tests for using session with jwt enabled
- Fixes https://github.com/supertokens/supertokens-website/issues/98

## [10.0.5] - 2021-11-17

### Changes

- Re-organises code to remove circular dependencies: https://github.com/supertokens/supertokens-auth-react/issues/334

## [10.0.4] - 2021-11-15

- Uses supertokens-js-override from npm

## [10.0.2] - 2021-11-08

### Changed:

- When calling a user's API, uses rid "anti-csrf" instead of session to solve https://github.com/supertokens/supertokens-node/issues/202

## [10.0.2] - 2021-10-30

### Added

- FDI 1.10 support (just changing the frontendDriverInterfaceSupported.json)

## [10.0.1] - 2021-10-28

### Changes

- Uses non arrow functions in api and recipe interface impl to allow for "true" inheritance in override: https://github.com/supertokens/supertokens-node/issues/199
- Uses `bind(this)` when calling original implementation
- Added bundle size checking for PRs

## [10.0.0] - 2021-10-21

### Breaking changes

- Renames `getJWTPayloadSecurely` to `getAccessTokenPayloadSecurely`

## [9.0.4] - 2021-10-13

### Fixes

- Fixed how we transform fetch responses with an empty body into axios responses

## [9.0.3] - 2021-10-08

### Fixes

- Not calling refresh after API calls if the refresh API returned an error
- Not calling refresh after an 401 response has removed the session

## [9.0.2] - 2021-10-01

### Fixes

- Moved axios to dev dependency
- Fixed axios refresh error test

### Changes

- Using fetch instead of axios to call the refresh API

## [9.0.1] - 2021-10-01

### Fixes

- Adds axios as a dependency

## [9.0.0] - 2021-10-01

### Breaking changes

- Rejecting with axios response object if a call through axios gets an unexpected error during session refresh. This is a breaking change since it changes the API (even if it's an error).

## [8.2.3] - 2021-09-29

### Changed

- Disabled source map generation

## [8.2.2] - 2021-09-27

### Changed

- New FDI 1.9

## [8.2.1]

### Changed

- Updated test behavior for cores after 3.6

## [8.2.0]

### Added

- A sessionExpiredOrRevoked propety on the "UNAUTHORIZED" event.

## [8.1.2] - 2021-07-29

### Fixes

- Fixes typescript issue with default imports. (Related to https://github.com/supertokens/supertokens-auth-react/issues/297)

## [8.1.1] - 2021-06-25

### Fixed:

- Handles `Uncaught ReferenceError: process is not defined` during getting if testing or not.

## [8.1.0] - 2021-06-25

### Added:

- `SESSION_CREATED` event, which can be consumed by `onHandleEvent`

### Fixed:

- If a new session is created, and we try and fetch userId or jwtPayload before the frontToken is set, then it would throw an error. However, now we wait for the frontend token to be set / removed and then return the requested information.
- Fires `UNAUTHORISED` event before attempting to refresh if we know that a session does not exist.
- Fires `SIGN_OUT` event when `signOut` is called and a session doesn't exist.

### Refactor:

- Removes use of `addedFetchInterceptor` in `fetch.ts`

## [8.0.0] - 2021-06-06

### Added:

- Recipe interface that can be overrided
- `preAPIHook` and `onHandleEvent` functions

### Changed:

- `sessionScope` is a now a string

### Removed:

- Backward compatibility with cross domain localstorage
- Removes `setAuth0API`, `getAuth0API` and `getRefreshURLDomain` functions.
- Removed `refreshAPICustomHeaders` and `signoutAPICustomHeaders` from config. Use `preAPIHook` instead.

## [7.2.2] - 2021-06-14

### Fixes:

- Pushes new version to show this version as latest in npm

## [7.2.1] - 2021-06-11

### Fixes:

- Fixes issue https://github.com/supertokens/supertokens-node/issues/134

## [7.2.0] - 2021-06-05

### Added:

- Allow specifying of `cookieDomain` in config to add interceptors to multiple API subdomain: https://github.com/supertokens/supertokens-website/issues/58

## [7.1.1] - 2021-05-31

### Fixed:

- Fixes .d.ts file to allow all styles of imports

### Added:

- Adds a ts testing file in test folder.

## [7.1.0] - 2021-05-11

### Added:

- Support for sessions if used within an iframe: https://github.com/supertokens/supertokens-website/issues/53

## [7.0.1] - 2021-05-07

### Fixed:

- https://github.com/supertokens/supertokens-website/issues/50: originalFetch was being assigned twice such that the the refresh call was calling it too, resulting in a refresh inside a refresh -> deadlock
- When fetching the idRefreshToken from the frontend, if the backend is not working, we assume that the session doesn't exist.

## [7.0.0] - 2021-05-01

### Changed:

- Uses frontend set cookies instead of localstorage so that sub domain session works on Safari
- Sends `rid` on each request - acts as a CSRF protection measure (see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#use-of-custom-request-headers)
- Refreshes session if the frontend set cookies are deleted (due to privacy features in Safari).
- New FDI 1.8

## [6.0.1] - 2021-04-29

### Changed:

- Updates dependencies:
  - browser-tabs-lock
  - https://github.com/supertokens/supertokens-website/pull/43
  - https://github.com/supertokens/supertokens-website/pull/39
  - https://github.com/supertokens/supertokens-website/pull/38

## [6.0.0] - 2021-04-13

### Changed:

- Uses localstorage and iframes (for cross domain communication of localstorage) for session storage instead of cookies
- `getUserId` and `doesSessionExist` now return `Promises`

## [5.1.0] - 2021-03-29

### Added:

- Sign out support
- Support for FDI 1.7

## [5.0.11] - 2021-04-05

### Fixed:

- Sets the cookies set by the frontend to never expire. Previously they were being set as Session cookies which cause them to be removed on browser restart, resulting in an inconsistent state.

## [5.0.10] - 2021-03-05

### Changed:

- Fixes normalisation of URL and path in case the path has a dot in it

## [5.0.9] - 2021-02-04

### Added:

- Compatibility with new FDI version

## [5.0.8] - 2021-01-27

### Fixes:

- Adds ability to use relative path for fetch and axios

## [5.0.7] - 2021-01-15

### Added:

- Compatibility with new FDI version

## [5.0.6] - 2021-01-06

### Fixed:

- Correctly handles fetch interception if the type of url is not a string

## [5.0.5] - 2020-12-19

### Changed:

- Applies dependabot dependency changes

## [5.0.4] - 2020-12-19

### Changed:

- Adds package-lock as per https://github.com/supertokens/supertokens-website/issues/28

## [5.0.3] - 2020-12-10

### Fixes:

- Better error messages for SSR.

## [5.0.2] - 2020-11-30

### Changed

- Added compatibility with new FDI. No change needed for this SDK, but added this since it's still compatible

## [5.0.1] - 2020-11-19

### Changed

- If the sessionScope is the same as the current domain, then we do not use it when setting cookies. This is because we do not want the browser to automatically add a leading dot. See https://github.com/supertokens/supertokens-website/issues/25

## [5.0.0] - 2020-10-24

### Changed

- Enforce interception for fetch and axios for easier use - issue #19
- Renames `websiteRootDomain` to `sessionScope`
- Removes `refreshTokenUrl` from input and replaces it with `apiDomain` and `apiBasePath`.
- The refresh API will alway be `apiDomain + apiBasePath + "/session/refresh"`
- Normalizing of user input
- Updates supported FDI to be `1.3`
- Changes to tests to use the new config
- Does not send frontend SDK version anymore

## [4.4.1] - 2020-10-03

### Changed

- Changed success refresh call status code to >= 200 && < 300

## [4.4.0] - 2020-08-30

### Changed

- Stores Anti CSRF token in cookie that can be shared across sub domains. This value is then read and added to the request header separately.
- Compatible with FDI 1.2 and not with previous versions
- Adds ability to get userID and JWT payload (securely) from the frontend

## [4.3.0] - 2020-08-20

### Changed

- Adds 1.1 as supported FDI

## [4.2.0] - 2020-08-11

### Changed

- Changed the default session expiry status code to 401
- Changed function signature of `init` for `axios` and `fetch`
- Enables `fetch` interception by default
- Automatically adds credentials to `axios` and `fetch` - which can be disabled

### Fixes:

- If current hostname is `localhost`, we do not add that as an explicit domain when setting the `IRTFrontend` cookie.

## [4.1.5] - 2020-07-30

### Added

- Function to get Refresh URL's domain
- Function to set and get Auth0's API path

## [4.1.4] - 2020-06-09

### Added

- New tests added for testing JWT payload update

### Changed

- For testing, cookie domain changed from localhost to localhost.org
- In testing, GET "/" API will return userId of the logged in user

## [4.1.3] - 2020-04-02

### Changed

- In axios interception, when handling error, we no longer create a new axios instance

## [4.1.2] - 2020-03-20

### Changed

- Update license in package.json to match github's license.

## [4.1.1] - 2020-03-18

### Changed

- Updated dependency browser-tabs-lock's version

## [4.1.0] - 2020-03-17

### Changed

- Makes frontend id refresh token's cookie path = `/` So that it is accessible throughout a website and not just the page that was used to login the user (in case tha page was not `/`).

## [4.0.12] - 2020-03-09

### Changed

- Relaxes constraint for checking if session is alive

## [4.0.0]

### Changed

- Handles id refresh token via frontend cookies so that non sub domain cross domain requests can be made.

## [3.2.0] - 2019-07-22

### Added

- Added ability to check if a session exists or not.

## [3.1.0] - 2019-07-15

### Changed

- Minor changes.

## [3.0.3] - 2019-07-14

### Changed

- Adds support for api on a different domain (as long as there is a shared sub domain between currently loaded page and API) - via setting withCredentials to true.

## [3.0.2] - 2019-07-10

### Changed

- makeSuper is now a part of the default import

## [3.0.1] - 2019-07-10

### Changed

- creates fetch interceptor so that users do not need to change their existing fetch calls

### Added

- added support for axios calls

## [3.0.0] - 2019-07-10

### Added

- handling of anti-csrf token
- package testing
