/* Copyright (c) 2022, VRAI Labs and/or its affiliates. All rights reserved.
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

/**
 * This error usually indicates that the API exposed by the backend SDKs responded
 * with `{status: "GENERAL_ERROR"}`. This should be used to show errors to the user
 * in your frontend application.
 */
export default class STGeneralError extends Error {
    isSuperTokensGeneralError = true;

    constructor(message: string) {
        super(message);
    }

    static isThisError(err: any): err is STGeneralError {
        return err.isSuperTokensGeneralError === true;
    }
}
