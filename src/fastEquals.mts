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
  ComparisionTypeInfo, getTypeName
} from "./comparisonNodes.mjs"
import { RecursiveEqualsResult } from "./equalsResults.mjs"
import { AssertionError } from "./assertions.mjs";

export class FastEqualsRecursiveChecker {

  public fastEquals(expected: any, actual: any): RecursiveEqualsResult {
    let counter = new ComparisionNodeMutant(expected, actual);
    let result = this.equalsFastIn(expected, actual, true, counter);
    return new RecursiveEqualsResult(counter, result);
  }

  /**
   * returns true if they are equal
   * false otherwise
   */
  equalsFastIn(expected: any, actual: any, first: boolean, counter: ComparisionNodeMutant): boolean {
    // undefined, null and NaN checks

    //optimization
    if (expected === actual) {
      counter.increment();
      if (first) {
        counter.setType(ComparisonNodeInfoType.Equal);
      }
      return true;
    }
    let tn: TypeName = getTypeName(expected);
    switch (tn) {
      case TypeName.Array:
        return this.compareArrays(counter, first, actual, expected);
      case TypeName.Boolean:
        return this.comparePrimitive(counter, expected, actual, first, tn);
      case TypeName.Map:
        return this.compareMaps(first, counter, actual, expected);
      case TypeName.NaN:
        return this.compareNaN(counter, actual);
      case TypeName.Null:
        return this.compareNull(counter, actual);
      case TypeName.Number:
        return this.comparePrimitive(counter, expected, actual, first, tn);
      case TypeName.Object:
        return this.compareObjects(expected, counter, first, actual);
      case TypeName.Set:
        throw new AssertionError("Sets are NOT currently supported, wait for ECMA 2026 to come out!");
      case TypeName.String:
        return this.comparePrimitive(counter, expected, actual, first, tn);
      case TypeName.Undefined:
        return this.compareUndefined(counter, actual);
    }
  }

  private compareObjects(expected: any, counter: ComparisionNodeMutant, first: boolean, actual: any) {
    if (Objs.isEquatable(expected)) {
      counter.increment();
      if (first) {
        counter.setType(ComparisonNodeInfoType.Equal);
      }
      if (expected.equals(actual)) {
        return true;
      }
      counter.addChildInfo(new ComparisionNodeMutant(actual, expected));
      return false;

    } else if (typeof actual === 'object') {
      return this.compareJsonStringify(counter, actual, expected, first);
    }
    counter.increment();
    counter.addChildInfo(new ComparisionNodeMutant(actual, expected).setType(ComparisonNodeInfoType.Equal));
    if (first) {
      if (getTypeName(expected) === getTypeName(actual)) {
        counter.setType(ComparisonNodeInfoType.Equal);
      } else {
        counter.setType(ComparisonNodeInfoType.Type);
      }
    }
    return false;
  }

  private comparePrimitive(counter: ComparisionNodeMutant, expected: any, actual: any, first: boolean, tn: TypeName) {
    //equals increment
    counter.increment();
    if (expected == actual) {
      //type is part of equals
      if (typeof expected === typeof actual) {
        return true;
      } else {
        if (first) {
          counter.setType(ComparisonNodeInfoType.Type);
        }
        counter.addChildInfo(new ComparisionTypeInfo(tn, getTypeName(actual)));
        return false;
      }
    } else {
      if (first) {
        counter.setType(ComparisonNodeInfoType.Equal);
      }
      counter.addChildInfo(new ComparisionNodeMutant(actual, expected).setType(ComparisonNodeInfoType.Equal));
      return false;
    }
  }

  private compareNaN(counter: ComparisionNodeMutant, actual: any) {
    counter.increment();
    if (typeof actual === 'number' && isNaN(actual)) {
      return true;
    } else {
      counter.addChildInfo(new ComparisionTypeInfo(TypeName.NaN, getTypeName(actual)));
      return false;
    }
  }

  private compareNull(counter: ComparisionNodeMutant, actual: any) {
    counter.increment();
    if (actual === null) {
      return true;
    } else {
      counter.addChildInfo(new ComparisionTypeInfo(TypeName.Null, getTypeName(actual)));
      return false;
    }
  }

  private compareUndefined(counter: ComparisionNodeMutant, actual: any) {
    counter.increment();
    if (actual === undefined) {
      return true;
    } else {
      counter.addChildInfo(new ComparisionTypeInfo(TypeName.Undefined, getTypeName(actual)));
      return false;
    }
  }

  private compareArrays(counter: ComparisionNodeMutant, first: boolean, actual: any, expected: any) {
    counter.increment();
    if (first) {
      counter.setType(ComparisonNodeInfoType.Type);
    }
    if (Array.isArray(actual)) {
      let eArray = expected as Array<any>;
      let aArray = actual as Array<any>;
      counter.increment();
      if (eArray.length == aArray.length) {
        let len = eArray.length;
        for (let i = 0; i < len; i++) {
          if (!this.equalsFastIn(eArray[i], aArray[i], false, counter)) {
            //add child info about where the failure occured, so we have a path like structure

            counter.addChildInfo(new ComparisionArrayInfo(i));
            counter.addChildInfo(new ComparisionCollectionSizeInfo(eArray.length, aArray.length));
            counter.addChildInfo(new ComparisionTypeInfo(TypeName.Array, getTypeName(actual)));
            //console.log(JSON.stringify(lastInfo));
            return false;
          }
        }
        return true;
      } else {

        counter.addChildInfo(new ComparisionCollectionSizeInfo(eArray.length, aArray.length));
        counter.addChildInfo(new ComparisionTypeInfo(TypeName.Array, getTypeName(actual)));
        return false;
      }
    } else {
      return false;
    }
  }

  private compareMaps(first: boolean, counter: ComparisionNodeMutant, actual: any, expected: any) {
    if (first) {
      counter.setType(ComparisonNodeInfoType.Type);
    }
    counter.increment();
    if (Maps.isMap(actual)) {
      let eMap = expected as Map<any, any>;
      let aMap = actual as Map<any, any>;
      counter.increment();
      if (eMap.size == aMap.size) {
        for (const [key, value] of eMap) {
          if (aMap.has(key)) {
            let actualValue = aMap.get(key);
            if (this.equalsFastIn(value, actualValue, false, counter)) {
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
          counter.increment();
          if (eMap.has(aKey)) {
            // already checked
          } else {
            counter.addChildInfo(new ComparisionMapInfo(aKey, null, aValue));
            counter.addChildInfo(new ComparisionCollectionSizeInfo(eMap.size, aMap.size));
            counter.addChildInfo(new ComparisionTypeInfo(TypeName.Map, getTypeName(actual)));
            return false;
          }
        }
        return true;
      } else {
        counter.addChildInfo(new ComparisionCollectionSizeInfo(eMap.size, aMap.size));
        counter.addChildInfo(new ComparisionTypeInfo(TypeName.Map, getTypeName(actual)));
        return false;
      }
    } else {
      counter.addChildInfo(new ComparisionTypeInfo(TypeName.Map, getTypeName(actual)));
      return false;
    }
  }

  private compareJsonStringify(counter: ComparisionNodeMutant, actual: any, expected: any, first: boolean) {
    counter.increment();
    // a final hack for data equality compare the JSON
    // but first the typeNames,
    if (TypeName.Object === getTypeName(actual)) {
      if (JSON.stringify(expected) == JSON.stringify(actual)) {
        return true;
      } else {
        if (first) {
          counter.setType(ComparisonNodeInfoType.Equal);
        }
        counter.addChildInfo(new ComparisionNodeMutant(actual, expected));
        return false;
      }
    } else {
      if (first) {
        counter.setType(ComparisonNodeInfoType.Type);
      }
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