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
    ComparisionNodeType, ComparisonNodeInfoType, TypeName
} from
        '@ts.adligo.org/i_tests4ts_types/dist/i_tests4ts_types.mjs';
import {
    I_ComparisionNode, I_ComparisionArrayInfo, I_ComparisionBaseInfo,
    I_ComparisionCollectionSizeInfo, I_ComparisionMapValueInfo, I_ComparisionSetInfo, I_ComparisionTypeInfo,
} from
        '@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs';

import { Maps, Sets } from "@ts.adligo.org/type-guards/dist/typeGuards.mjs";
import {type} from "node:os";


export class ComparisionArrayInfo implements I_ComparisionArrayInfo {
    _idx: number;
    constructor(index: number) {
        this._idx = index;
    }

    getInfoType(): ComparisonNodeInfoType {
        return ComparisonNodeInfoType.Array;
    }
    getIndex(): number {
        return this._idx;
    }
}

export class ComparisionCollectionSizeInfo implements I_ComparisionCollectionSizeInfo {
    _actualSize: number;
    _expectedSize: number;

    constructor(expectedSize: number, actualSize: number) {
        this._actualSize = actualSize;
        this._expectedSize = expectedSize;
    }

    getActualSize(): number {
        return this._actualSize
    }
    getExpectedSize(): number {
        return this._expectedSize;
    }

    getInfoType(): ComparisonNodeInfoType {
        return ComparisonNodeInfoType.CollectionSize;
    }
}

export class ComparisionMapInfo implements I_ComparisionMapValueInfo {
    _key: any;
    _actualValue: any;
    _expectedValue: any;

    constructor(key: any, expectedValue: any, actualValue: any) {
        this._key = key;
        this._actualValue = actualValue;
        this._expectedValue = expectedValue;
    }

    getActualValue() {
        return this._actualValue;
    }
    getExpectedValue() {
        return this._expectedValue;
    }

    getKey() {
        return this._key;
    }
    getInfoType(): ComparisonNodeInfoType {
        return ComparisonNodeInfoType.MapValue;
    }
}

export class ComparisionSetInfo implements I_ComparisionSetInfo {
    _actuals: Set<any>;
    _expecteds: Set<any>;
    _isMapKeys: boolean;

    constructor(missingExpected: Set<any>, missingActuals: Set<any>, isMapKeys: boolean) {
        this._actuals = Object.freeze(missingActuals);
        this._expecteds = Object.freeze(missingExpected);
        this._isMapKeys = isMapKeys;
    }

    getMissingActuals(): Set<any> {
        return this._actuals;
    }
    getMissingExpected(): Set<any> {
        return this._expecteds;
    }
    isMapKeys(): boolean {
        return this._isMapKeys;
    }
    getInfoType(): ComparisonNodeInfoType {
        return ComparisonNodeInfoType.Set;
    }
}


export class ComparisionTypeInfo implements I_ComparisionTypeInfo {
    _actualType: TypeName;
    _expectedType: TypeName;

    constructor(expected: TypeName, actual: TypeName) {
        this._actualType = actual;
        this._expectedType = expected;
    }

    getActualType(): TypeName {
       return this._actualType;
    }
    getExpectedType(): TypeName {
       return this._expectedType;
    }

    getInfoType(): ComparisonNodeInfoType {
        return ComparisonNodeInfoType.Type;
    }
}

export class RootComparisionNodeMutant implements I_ComparisionNode {
    private _actual: any;
    private _assertionCount: number = 0;
    private _expected: any;
    /**
     * Note: These reperesent the reasaon for a failure, this could have been done
     * with a chain of Errors (Errors with causese of causes).  However, this succinct
     * informative storage structure which includes the reason for the failure with a tree/branch
     * like structure will prove much more informative to the user of the tests4ts APIs!
     *
     * Additional Note: these get added backwards leaf first when we are adding them
     * so the getChildInfo method is somewhat screwy as it returns the last element
     * for 0 and the first element for getCount -1
     * @private
     */
    private _childInfo: I_ComparisionBaseInfo[] = [];

    constructor(actual: any, expected: any) {
        this._actual = actual;
        this._expected = expected;
    }

    addChildInfo(info: I_ComparisionBaseInfo): RootComparisionNodeMutant {
        this._childInfo.push(info);
        return this;
    }

    getActual() {
        return this._actual;
    }
    getAssertionCount(): number {
        return this._assertionCount;
    }
    getExpected() {
        return this._expected;
    }
    getChildInfo(idx: number): I_ComparisionBaseInfo {
        if (idx == 0) {
            return this._childInfo[this._childInfo.length - 1];
        }
        let idxRev = this._childInfo.length - 1 - idx;
        return this._childInfo[idxRev];
    }
    getChildInfoSize(): number {
        return this._childInfo.length;
    }

    hasChildInfo(): boolean {
        if (this._childInfo.length == 0) {
            return false;
        }
        return true;
    }
    increment(): RootComparisionNodeMutant {
        this._assertionCount++;
        return this;
    }
}

export class ComparisionNodeMutant extends RootComparisionNodeMutant implements I_ComparisionBaseInfo {
    _infoType: ComparisonNodeInfoType;

    constructor(expected: any, actual: any, type?: ComparisonNodeInfoType) {
        super(actual, expected);
        if (type != null) {
            this._infoType = type;
        } else {
            this._infoType = ComparisonNodeInfoType.Equal;
        }
    }

    getInfoType(): ComparisonNodeInfoType {
        return this._infoType;
    }
}

export function getTypeName(o: any): TypeName {
    let t = typeof o;
    switch (t) {
        case "boolean": return TypeName.Boolean;
        case "string": return TypeName.String;
        case "bigint": return TypeName.Number;
    }
    if (typeof o === "undefined") {
        return TypeName.Undefined;
    } else if (o === null) {
        return TypeName.Null;
    } else if (Number.isNaN(o)) {
        return TypeName.NaN;
    } else if (typeof o === "number") {
        return TypeName.Number;
    } else if (Array.isArray(o)) {
        return TypeName.Array;
    } else if (Sets.isASet(o)) {
        return TypeName.Set;
    } else if (Maps.isMap(o)) {
        return TypeName.Map;
    }
    return TypeName.Object;
}