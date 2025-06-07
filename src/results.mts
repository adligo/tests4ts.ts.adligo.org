/**
 * This file contains the TestResult class and was extracted from tests4ts.mts in
 * order to avoid a circular depencency with coverage.mts
 *
 * Copyright 2025 Adligo Inc / Scott Morgan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
    I_AssertionContext,
    I_AssertionContextConsumer, I_AssertionContextFactory,
    I_FileConverter,
    I_Runnable,
    I_Test,
    I_TestResult, I_TestResultFactory,
    I_Trial
} from "@ts.adligo.org/i_tests4ts/src/i_tests4ts.mjs";

export class TestResultParams {
    _assertionCount : number;
    _test: I_Test;

    constructor(assertionCount: number, test: I_Test) {
        this._assertionCount = assertionCount;
        this._test = test;
    }
}

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class TestResult implements I_TestResult {
    private _assertionCount : number;
    private _test: I_Test;
    private _pass: boolean;
    private _errorMessage: string;

    constructor(params: TestResultParams, pass?: boolean, errorMessage?: string) {
        this._assertionCount = params._assertionCount;
        this._test = params._test;
        if (pass == undefined) {
            this._pass = true
        } else {
            this._pass = pass;
        }
        if (errorMessage == undefined) {
            this._errorMessage = '';
        } else {
            this._errorMessage = errorMessage;
        }
    }

    collectCoverage() {
        throw new Error('Coverage Not Currently Enabled');
    }


    isPass() {
        return this._pass
    }

    getAssertionCount() {
        return this._assertionCount
    }

    getErrorMessage() {
        return this._errorMessage;
    }

    getName() {
        return this._test.getName();
    }
}