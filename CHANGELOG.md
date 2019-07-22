# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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