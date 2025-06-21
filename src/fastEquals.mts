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
import {RecursiveEqualsResult} from "./equalsResults.mjs"

export class FastEqualsRecursiveChecker {

    public fastEquals(expected: any, actual: any): RecursiveEqualsResult {
        let counter = new ComparisionNodeMutant(expected, actual);
        if (this.equalsFastIn(expected, actual, true, counter)) {
            return new RecursiveEqualsResult(counter, true);
        } else {
            return new RecursiveEqualsResult(counter, false);
        }
    }

    /**
     * returns true if they are equal
     * false otherwise
     */
    equalsFastIn(expected: any, actual: any, first: boolean, counter: ComparisionNodeMutant): boolean {
        // undefined, null and NaN checks

        if (expected === undefined) {
            counter.increment();
            if (actual === undefined) {
                return true;
            } else {
                return false;
            }
        } else if (expected === null) {
            counter.increment();
            if (actual === null) {
                return true;
            } else {
                return false;
            }
        } else if (typeof expected === 'number' && isNaN(expected)) {
            counter.increment();
            if (typeof actual === 'number' && isNaN(actual)) {
                return true;
            } else {
                return false;
            }
        }

        if (Array.isArray(expected)) {
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
            /*
            removing all Set stuff until it works on the node CLI
          } else if (Sets.isSet(expected)) {
            counter.increment();
            if (Sets.isSet(actual)) {
              let eSet = expected as Set<any>;
              let aSet = actual as Set<any>;
              counter.increment();
              if (eSet.size == aSet.size) {
                let aNotInE = Sets.difference(eSet, aSet);
                let eNotInA = Sets.difference(aSet, eSet);
                if (eNotInA.size != 0 || aNotInE.size != 0) {
                  counter.setInfo(new ComparisionSetInfo(eNotInA, aNotInE, false));
                  return false;
                } else {
                  return true;
                }
              } else {
                counter.setInfo(new ComparisionCollectionSizeInfo(eSet.size, aSet.size))
                return false;
              }
            } else {
              return false;
            }
            */
        } else if (Maps.isMap(expected)) {
            if (first) {
                counter.setType(ComparisonNodeInfoType.Type);
            }
            counter.increment();
            if (Maps.isMap(actual)) {
                let eMap = expected as Map<any, any>;
                let aMap = actual as Map<any, any>;
                counter.increment();
                if (eMap.size == aMap.size) {
                    for (const [key, value] of Object.entries(eMap)) {
                        if (aMap.has(key)) {
                            let actualValue = aMap.get(key);
                            if (this.equalsFastIn(value, actual, false, counter)) {
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
                            return false;
                        }
                    }
                    for (const [aKey, aValue] of Object.entries(aMap)) {
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
                    return false;
                }
            } else {
                return false;
            }
        } else if (Objs.isEquatable(expected)) {
            counter.increment();
            if (expected.equals(actual)) {
                return true;
            }
            return false;
        } else if (typeof expected === 'object') {
            counter.increment();
            // a final hack for data equality,
            if (typeof actual === 'object') {
                if (Maps.isMap(actual)) {
                    //edge case empty maps turn into {}
                    return false;
                }
                //
                // Note this was done for ease of use, if you don't like this behavior
                //  we recommend you override the equals method on your expected object
                //
                if (JSON.stringify(expected) == JSON.stringify(actual)) {
                    return true;
                }
            }
        } else {
            counter.increment();
            //other primitives
            if (expected === actual) {
                return true;
            } else if (expected == actual) {
                if (typeof expected === typeof actual) {
                    return true;
                }
            }
        }
        counter.addChildInfo(new ComparisionNodeMutant(actual, expected).setType(ComparisonNodeInfoType.Equal));
        return false;
    }

}