/* Copyright (c) 2024, VRAI Labs and/or its affiliates. All rights reserved.
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

const assert = require("assert");
const sinon = require("sinon");
const { BooleanClaim } = require("../lib/build");
const { DateProviderReference } = require("../lib/build/utils/dateProvider");

const ONE_HOUR_IN_MS = 3600000;

function withFakeClock(now, cb) {
    const clock = sinon.useFakeTimers({ now, shouldAdvanceTime: false });

    try {
        return cb();
    } finally {
        clock.restore();
    }
}

describe("SessionClaimValidator Refresh", () => {
    describe("Client and Server clock are in sync", () => {
        before(function () {
            DateProviderReference.init();
        });

        it("SessionClaimValidator.shouldRefresh should return false after refreshing", function () {
            const tokenPayload = {
                "st-test": {
                    v: false,
                    t: Date.now() - 20000 // setting claim fetched time to 20 seconds ago
                }
            };

            const testClaim = new BooleanClaim({
                id: "st-test",
                refresh: () => {
                    tokenPayload["st-test"].t = Date.now();
                },
                defaultMaxAgeInSeconds: 10 /* 10 seconds */
            });

            const testClaimValidator = testClaim.validators.isTrue();

            assert(testClaimValidator.shouldRefresh(tokenPayload) === true);
            testClaimValidator.refresh();
            assert(testClaimValidator.shouldRefresh(tokenPayload) === false);
        });
    });

    describe("Client Clock is ahead 1 hour of server time", () => {
        before(function () {
            DateProviderReference.init();
        });

        it("SessionClaimValidator.shouldRefresh should return true even after refreshing", function () {
            const tokenPayload = {
                "st-test": {
                    v: false,
                    t: Date.now()
                }
            };

            const testClaim = new BooleanClaim({
                id: "st-test",
                refresh: () => {
                    tokenPayload["st-test"].t = Date.now();
                },
                defaultMaxAgeInSeconds: 10 /* 10 seconds */
            });

            const testClaimValidator = testClaim.validators.isTrue();

            withFakeClock(Date.now() + ONE_HOUR_IN_MS, () => {
                assert(testClaimValidator.shouldRefresh(tokenPayload) === true);
            });

            testClaimValidator.refresh();

            withFakeClock(Date.now() + ONE_HOUR_IN_MS, () => {
                assert(testClaimValidator.shouldRefresh(tokenPayload) === true);
            });
        });

        it("SessionClaimValidator.shouldRefresh should return false after refreshing", function () {
            const tokenPayload = {
                "st-test": {
                    v: false,
                    t: Date.now() - 20000 // setting claim fetched time to 20 seconds ago
                }
            };

            const testClaim = new BooleanClaim({
                id: "st-test",
                refresh: () => {
                    tokenPayload["st-test"].t = Date.now();
                },
                defaultMaxAgeInSeconds: 10 /* 10 seconds */
            });

            const testClaimValidator = testClaim.validators.isTrue();

            // Adjust DateProvider clientClockDeviation
            DateProviderReference.getReferenceOrThrow().dateProvider.setClientClockDeviationInMillis(-ONE_HOUR_IN_MS);

            withFakeClock(Date.now() + ONE_HOUR_IN_MS, () => {
                assert(testClaimValidator.shouldRefresh(tokenPayload) === true);
            });

            testClaimValidator.refresh();

            withFakeClock(Date.now() + ONE_HOUR_IN_MS, () => {
                assert(testClaimValidator.shouldRefresh(tokenPayload) === false);
            });
        });
    });
});
