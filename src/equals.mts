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
  I_AssertionContext, I_AssertionContextConsumer, I_AssertionContextResult,
  I_ComparisionNode, I_ComparisionArrayInfo, I_ComparisionBaseInfo,
  I_ComparisionCollectionSizeInfo, I_ComparisionMapValueInfo, I_ComparisionSetInfo, I_ComparisionTypeInfo,
  I_EquatableString, I_Runnable
} from
  '@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs';

import { I_Equatable } from '@ts.adligo.org/i_obj/dist/i_obj.mjs';
import { I_String } from '@ts.adligo.org/i_strings/dist/i_strings.mjs';
import { Errors, isNil, Objs, Maps, Sets, Strings } from "@ts.adligo.org/type-guards/dist/typeGuards.mjs";
import {
  ComparisionArrayInfo,
  ComparisionCollectionSizeInfo,
  ComparisionNodeMutant,
  ComparisionMapInfo,
  ComparisionSetInfo,
  ComparisionTypeInfo,
  RootComparisionNodeMutant, getTypeName
} from "./comparisonNodes.mjs"
import { RecursiveEqualsResult } from "./equalsResults.mjs"
import { AssertionError } from "./assertions.mjs";

export enum FastOrDeep {
  Deep,
  Fast,
}
export class EqualsRecursiveChecker {
  _fastOrDeep: FastOrDeep;

  constructor(fastOrDeep: FastOrDeep) {
    this._fastOrDeep = fastOrDeep;
  }

  public equals(expected: any, actual: any): RecursiveEqualsResult {
    let counter = new RootComparisionNodeMutant(expected, actual);
    let result = this.equalsIn(expected, actual,  counter);
    return new RecursiveEqualsResult(counter, result);
  }

  /**
   * returns true if they are equal
   * false otherwise
   */
  equalsIn(expected: any, actual: any,  counter: RootComparisionNodeMutant): boolean {
    // undefined, null and NaN checks

    //optimization
    if (expected === actual) {
      counter.increment();
      return true;
    }
    let tn: TypeName = getTypeName(expected);
    switch (tn) {
      case TypeName.Array:
        return this.compareArrays(counter, actual, expected);
      case TypeName.Boolean:
        return this.comparePrimitive(counter, expected, actual, tn);
      case TypeName.Map:
        return this.compareMaps(counter, actual, expected);
      case TypeName.NaN:
        return this.compareNaN(counter, actual);
      case TypeName.Null:
        return this.compareNull(counter, actual);
      case TypeName.Number:
        return this.comparePrimitive(counter, expected, actual, tn);
      case TypeName.Object:
        return this.compareObjects(expected, counter, actual);
      case TypeName.Set:
        throw new AssertionError("Sets are NOT currently supported, wait for ECMA 2026 to come out!");
      case TypeName.String:
        return this.comparePrimitive(counter, expected, actual, tn);
      case TypeName.Undefined:
        return this.compareUndefined(counter, actual);
    }
  }

  private compareObjects(expected: any, counter: RootComparisionNodeMutant, actual: any) {
    if (Objs.isEquatable(expected)) {
      counter.increment();
      if (expected.equals(actual)) {
        return true;
      }
      counter.addChildInfo(new ComparisionNodeMutant(actual, expected));
      return false;

    } else if (typeof actual === 'object') {
      return this.compareJsonStringify(counter, actual, expected);
    }
    counter.increment();
    counter.addChildInfo(new ComparisionNodeMutant(actual, expected));
    return false;
  }

  private comparePrimitive(counter: RootComparisionNodeMutant, expected: any, actual: any, tn: TypeName) {
    //equals increment
    counter.increment();
    if (expected == actual) {
      //type is part of equals
      if (typeof expected === typeof actual) {
        return true;
      } else {
        counter.addChildInfo(new ComparisionTypeInfo(tn, getTypeName(actual)));
        return false;
      }
    } else {
      counter.addChildInfo(new ComparisionNodeMutant(actual, expected));
      return false;
    }
  }

  private compareNaN(counter: RootComparisionNodeMutant, actual: any) {
    counter.increment();
    if (typeof actual === 'number' && isNaN(actual)) {
      return true;
    } else {

      counter.addChildInfo(new ComparisionTypeInfo(TypeName.NaN, getTypeName(actual)));
      return false;
    }
  }

  private compareNull(counter: RootComparisionNodeMutant, actual: any) {
    counter.increment();
    if (actual === null) {
      return true;
    } else {
      counter.addChildInfo(new ComparisionTypeInfo(TypeName.Null, getTypeName(actual)));
      return false;
    }
  }

  private compareUndefined(counter: RootComparisionNodeMutant, actual: any) {
    counter.increment();
    if (actual === undefined) {
      return true;
    } else {
      counter.addChildInfo(new ComparisionTypeInfo(TypeName.Undefined, getTypeName(actual)));
      return false;
    }
  }

  private compareArrays(counter: RootComparisionNodeMutant, actual: any, expected: any) {
    counter.increment();
    if (! Array.isArray(actual)) {
      counter.addChildInfo(new ComparisionTypeInfo(TypeName.Array, getTypeName(actual)));
      return false;
    }
    let eArray = expected as Array<any>;
    let aArray = actual as Array<any>;
    if (this._fastOrDeep === FastOrDeep.Fast) {
      counter.increment();
      if (eArray.length != aArray.length) {
        counter.addChildInfo(new ComparisionCollectionSizeInfo(eArray.length, aArray.length));
        counter.addChildInfo(new ComparisionTypeInfo(TypeName.Array, getTypeName(actual)));
        return false;
      }
    }
    let len = eArray.length;
    if (aArray.length < len) {
      len = aArray.length;
    }
    //compare everything we can!
    for (let i = 0; i < len; i++) {
      if (!this.equalsIn(eArray[i], aArray[i], counter)) {
        //add child info about where the failure occured, so we have a path like structure

        counter.addChildInfo(new ComparisionArrayInfo(i));
        counter.addChildInfo(new ComparisionCollectionSizeInfo(eArray.length, aArray.length));
        counter.addChildInfo(new ComparisionTypeInfo(TypeName.Array, getTypeName(actual)));
        //console.log(JSON.stringify(lastInfo));
        return false;
      }
    }
    if (this._fastOrDeep === FastOrDeep.Deep) {
      counter.increment();
      if (eArray.length != aArray.length) {
        counter.addChildInfo(new ComparisionCollectionSizeInfo(eArray.length, aArray.length));
        counter.addChildInfo(new ComparisionTypeInfo(TypeName.Array, getTypeName(actual)));
        return false;
      }
    }
    return true;
  }

  private compareMaps(counter: RootComparisionNodeMutant, actual: any, expected: any) {
    counter.increment();
    if ( !Maps.isMap(actual)) {
      counter.addChildInfo(new ComparisionTypeInfo(TypeName.Map, getTypeName(actual)));
      return false;
    }
    let eMap = expected as Map<any, any>;
    let aMap = actual as Map<any, any>;

    if (this._fastOrDeep === FastOrDeep.Fast) {
      counter.increment();
      if (eMap.size != aMap.size) {
        counter.addChildInfo(new ComparisionCollectionSizeInfo(eMap.size, aMap.size));
        counter.addChildInfo(new ComparisionTypeInfo(TypeName.Map, getTypeName(actual)));
        return false;
      }
    }

    //compare everything we can from both maps keys
    for (const [key, value] of eMap) {
      if (aMap.has(key)) {
        let actualValue = aMap.get(key);
        if (this.equalsIn(value, actualValue, counter)) {
          // they matched
        } else {
          counter.addChildInfo(new ComparisionMapInfo(key, value, actualValue));
          counter.addChildInfo(new ComparisionCollectionSizeInfo(eMap.size, aMap.size));
          counter.addChildInfo(new ComparisionTypeInfo(TypeName.Map, getTypeName(actual)));
          return false;
        }
      } else {
        //the actual map doesn't have the key
        counter.addChildInfo(new ComparisionMapInfo(key, value, null));
        counter.addChildInfo(new ComparisionCollectionSizeInfo(eMap.size, aMap.size));
        counter.addChildInfo(new ComparisionTypeInfo(TypeName.Map, getTypeName(actual)));
        return false;
      }
    }
    for (const [aKey, aValue] of aMap) {
      if (eMap.has(aKey)) {
        // already checked
      } else {
        counter.increment();
        counter.addChildInfo(new ComparisionMapInfo(aKey, null, aValue));
        counter.addChildInfo(new ComparisionCollectionSizeInfo(eMap.size, aMap.size));
        counter.addChildInfo(new ComparisionTypeInfo(TypeName.Map, getTypeName(actual)));
        return false;
      }
    }
    if (this._fastOrDeep === FastOrDeep.Deep) {
      counter.increment();
      if (eMap.size != aMap.size) {
        counter.addChildInfo(new ComparisionCollectionSizeInfo(eMap.size, aMap.size));
        counter.addChildInfo(new ComparisionTypeInfo(TypeName.Map, getTypeName(actual)));
        return false;
      }
    }
    return true;
  }

  private compareJsonStringify(counter: RootComparisionNodeMutant, actual: any, expected: any) {
    counter.increment();
    // a final hack for data equality compare the JSON
    // but first the typeNames,
    if (TypeName.Object === getTypeName(actual)) {
      if (JSON.stringify(expected) == JSON.stringify(actual)) {
        return true;
      } else {
        counter.addChildInfo(new ComparisionNodeMutant(actual, expected));
        return false;
      }
    } else {
      counter.addChildInfo(new ComparisionNodeMutant(actual, expected));
      return false;
    }
  }

  private truthyAndSameType(expected: any, actual: any): boolean {
    if (expected == actual) {
      if (typeof expected === typeof actual) {
        return true;
      }
    } else {
      return false;
    }
    return false;
  }
}