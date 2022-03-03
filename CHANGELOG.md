# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [unreleased]

-   add workflow to verify if pr title follows conventional commits

## [11.0.0] - 2022-03-03

### Breaking changes
- Adds user context to all functions exposed to the user, and to API and Recipe interface functions. This is a non breaking change for User exposed function calls, but a breaking change if you are using the override feature.
- All recipe functions now accept an object (instead of inidividual parameters), this is a breaking change only if you are using the override feature.

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
-   Uses non arrow functions in api and recipe interface impl to allow for "true" inheritance in override: https://github.com/supertokens/supertokens-node/issues/199
-   Uses `bind(this)` when calling original implementation
-   Added bundle size checking for PRs

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

-   Updated test behavior for cores after 3.6

## [8.2.0]

### Added

-   A sessionExpiredOrRevoked propety on the "UNAUTHORIZED" event.

## [8.1.2] - 2021-07-29

### Fixes

-   Fixes typescript issue with default imports. (Related to https://github.com/supertokens/supertokens-auth-react/issues/297)

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