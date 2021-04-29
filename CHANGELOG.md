# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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