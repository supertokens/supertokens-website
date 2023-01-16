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
let AuthHttpRequest = require("../index.js").default;
let jsdom = require("mocha-jsdom");
let assert = require("assert");
let { resetSessionClaimValidatorStore } = require("./utils");
const sinon = require("sinon");
const { SessionClaimValidatorStore } = require("../lib/build/utils/sessionClaimValidatorStore.js");

const passingValidator = {
    shouldRefresh: () => false,
    id: "test-validator-pass",
    refresh: () => {},
    validate: () => ({ isValid: true })
};

const failingValidator = {
    shouldRefresh: () => false,
    id: "test-validator-fail",
    refresh: () => {},
    validate: () => ({ isValid: false, reason: { message: "testReason" } })
};

describe("AuthHttpRequest claim handling", function () {
    let accessTokenStub;
    jsdom({
        url: "http://localhost"
    });
    beforeEach(async function () {
        sinon.restore();
        global.document = {};
        resetSessionClaimValidatorStore();
        accessTokenStub = sinon.stub().returns({});
        AuthHttpRequest.init({
            apiDomain: "localhost.org",

            override: {
                functions: (oI) => ({
                    ...oI,
                    getAccessTokenPayloadSecurely: accessTokenStub
                })
            }
        });
    });

    describe("AuthHttpRequest validateClaims", () => {
        describe("SessionClaimValidatorStore interactions", () => {
            it("should call override with empty list if nothing is added", async () => {
                const ctx = { test: Date.now() };
                const cb = sinon.expectation.create("overrideGlobalClaimValidators").once().withExactArgs([], ctx);
                cb.returns([]);
                await AuthHttpRequest.validateClaims(cb, ctx);
                sinon.verify();
            });

            it("should call override with the appropriate args when claims are added", async () => {
                SessionClaimValidatorStore.addClaimValidatorFromOtherRecipe(passingValidator);

                const ctx = {};
                const cb = sinon.expectation
                    .create("overrideGlobalClaimValidators")
                    .once()
                    .withExactArgs([passingValidator], ctx);
                cb.returns([]);
                await AuthHttpRequest.validateClaims(cb, ctx);
                sinon.verify();
            });

            it("should return empty array if all global validators pass", async () => {
                SessionClaimValidatorStore.addClaimValidatorFromOtherRecipe(passingValidator);

                assert.deepEqual(await AuthHttpRequest.validateClaims(), []);
            });

            it("should return non-empty array if a global validator fails", async () => {
                SessionClaimValidatorStore.addClaimValidatorFromOtherRecipe(failingValidator);

                assert.deepEqual(await AuthHttpRequest.validateClaims(), [
                    {
                        validatorId: failingValidator.id,
                        reason: {
                            message: "testReason"
                        }
                    }
                ]);
            });
        });

        describe("validateClaims", () => {
            it("should return empty array if no validators are present", async () => {
                assert.deepEqual(await AuthHttpRequest.validateClaims(), []);
            });

            it("should return empty array if all validators pass", async () => {
                assert.deepEqual(await AuthHttpRequest.validateClaims(() => [passingValidator]), []);
            });

            it("should return empty array if all validators after the override", async () => {
                SessionClaimValidatorStore.addClaimValidatorFromOtherRecipe(failingValidator);
                assert.deepEqual(await AuthHttpRequest.validateClaims(() => [passingValidator]), []);
            });

            it("should return non-empty array if a local validator fails", async () => {
                SessionClaimValidatorStore.addClaimValidatorFromOtherRecipe(passingValidator);
                assert.deepEqual(await AuthHttpRequest.validateClaims(() => [failingValidator]), [
                    {
                        validatorId: failingValidator.id,
                        reason: {
                            message: "testReason"
                        }
                    }
                ]);
            });

            it("should return failure reasons in the order returned from the override", async () => {
                SessionClaimValidatorStore.addClaimValidatorFromOtherRecipe(failingValidator);
                assert.deepEqual(
                    await AuthHttpRequest.validateClaims((globalClaimValidators) => [
                        ...globalClaimValidators,
                        {
                            shouldRefresh: () => false,
                            id: "test-validator-fail2",
                            refresh: () => {},
                            validate: () => ({ isValid: false, reason: { message: "testReason" } })
                        },
                        {
                            shouldRefresh: () => false,
                            id: "test-validator-fail3",
                            refresh: () => {},
                            validate: () => ({ isValid: false, reason: { message: "testReason" } })
                        }
                    ]),
                    [
                        {
                            validatorId: failingValidator.id,
                            reason: {
                                message: "testReason"
                            }
                        },
                        {
                            validatorId: "test-validator-fail2",
                            reason: {
                                message: "testReason"
                            }
                        },
                        {
                            validatorId: "test-validator-fail3",
                            reason: {
                                message: "testReason"
                            }
                        }
                    ]
                );
            });

            it("should call refresh only if shouldRefresh returns true", async () => {
                const accessTokenPayload = { test: Date.now() };
                const ctx = {};

                accessTokenStub.resolves(accessTokenPayload);

                const notCalledRefresh = sinon.expectation.create("refresh").never();

                const refresh = sinon.expectation
                    .create("refresh")
                    .once()
                    .withExactArgs(accessTokenPayload, ctx)
                    .resolves(undefined);

                assert.deepEqual(
                    await AuthHttpRequest.validateClaims(() => [
                        {
                            id: "no-refresh",
                            shouldRefresh: () => false,
                            refresh,
                            validate: () => ({ isValid: true })
                        },
                        {
                            id: "no-refresh",
                            shouldRefresh: () => false,
                            notCalled: notCalledRefresh,
                            validate: () => ({ isValid: true })
                        }
                    ]),
                    []
                );

                sinon.verify();
            });

            it("should refresh all claims before validation", async () => {
                const validator1 = {
                    id: "test1",
                    shouldRefresh: sinon.stub().returns(true),
                    refresh: sinon.spy(),
                    validate: sinon.stub().returns({ isValid: true })
                };

                const validator2 = {
                    id: "test2",
                    shouldRefresh: sinon.stub().returns(true),
                    refresh: sinon.spy(),
                    validate: sinon.stub().returns({ isValid: true })
                };

                assert.deepEqual(await AuthHttpRequest.validateClaims(() => [validator1, validator2]), []);

                assert.ok(validator1.shouldRefresh.calledImmediatelyBefore(validator1.refresh));
                assert.ok(validator1.refresh.calledBefore(validator2.shouldRefresh));
                assert.ok(validator2.shouldRefresh.calledImmediatelyBefore(validator2.refresh));
                assert.ok(validator2.refresh.calledBefore(validator1.validate));
                assert.ok(validator1.validate.calledImmediatelyBefore(validator2.validate));
            });
        });
    });
});
