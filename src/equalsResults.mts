/**
 * This file contains the base AssertionContext which can be extended
 * by your library if you want.
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
    I_ComparisionNode, I_RecursiveEqualsResult
} from
        '@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs';

import {RootComparisionNodeMutant} from './comparisonNodes.mjs';

export class RecursiveEqualsResult implements I_RecursiveEqualsResult {
    /**
     * returns a failure result
     * @param expected
     * @param actual
     */
    public static of(expected: any, actual: any): I_RecursiveEqualsResult {
        return new RecursiveEqualsResult(new RootComparisionNodeMutant(actual, expected), false);
    }
    public static ofResult(expected: any, actual: any, success: boolean): I_RecursiveEqualsResult {
        return new RecursiveEqualsResult(new RootComparisionNodeMutant(actual, expected), success);
    }
    private _assertionCount: number;
    private _success: boolean;
    private _comparisionNode: I_ComparisionNode;

    constructor(comparisionNode: I_ComparisionNode, success: boolean,) {
        this._assertionCount = comparisionNode.getAssertionCount();
        this._success = success;
        this._comparisionNode = comparisionNode;
    }

    public getAssertionCount(): number { return this._assertionCount; }

    public getComparisionNode(): I_ComparisionNode { return this._comparisionNode }
    /**
     * if this is true then they were equals
     * if this is false they were notEquals
     */
    public isSuccess(): boolean { return this._success }
}
