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

export class AssertionError extends Error {
  public static isAssertionError(error: Error) {
    if (isNil((error as AssertionError).isAssertionError)) {
      return false;
    }
    return true;
  }
  readonly name: string = "AssertionError";
  
  constructor(message: string) {
    super(message);
  }
  
  isAssertionError() { return true; }
}

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class AssertionContext implements I_AssertionContextResult, I_AssertionContext {
  private static readonly CLAZZ_NAME = 'org.adligo.ts.tests4ts.AssertionContext';
  private _count: number = 0;

  public error(expected: string, runnable: () => void) {
    this._count++;
    var err: any;
    try {
      runnable();
    } catch (e) {
      err = e;
    }
    if (err == undefined) {
      throw new AssertionError('The runnable was expected to throw an Error, however it did NOT throw an error.');
    } else {
      let ex: Error = err as Error;
      if (ex.message != expected) {
        this.same(expected, err.message);
      }
    }
  }

  equals(expected: I_EquatableString | I_Equatable | I_String | string | any, actual: I_String | string | any, message?: string): void {
    if (!this.equalsDeepCheckIn(expected, actual, message)) {
      var test = this.notEqualsCheckIn(expected, actual);
      this.eqNeqIn(test, expected, actual, message);
    }
  }


  getCount(): number {
    return this._count;
  }

  getClass(): string {
    return AssertionContext.CLAZZ_NAME;
  }

  isFalse(check: boolean, message?: string) {
    this._count++;
    if (check) {
      throw new AssertionError(message);
    }
  }

  isTrue(check: boolean, message?: string) {
    this._count++;
    if (!check) {
      throw new AssertionError(message);
    }
  }

  notEquals(expected: I_EquatableString | I_Equatable | I_String | string | any, actual: I_String | string | any, message?: string): void {
    var test = !this.notEqualsCheckIn(expected, actual);
    this.eqNeqIn(test, expected, actual, message);
  }

  same(expected: I_String | string | any, actual: I_String | string | any, message?: string): void {
    this._count++;
    if (!(expected === actual)) {
      this.stringMatchError(this.toString(expected), this.toString(actual), message);
    }
  }

  notSame(expected: I_String | string | any, actual: I_String | string | any, message?: string): void {
    this._count++;
    if (expected === actual) {
      this.stringMatchError(expected, actual, message);
    }
  }

  notNull(expected: string, message?: string): void {
    this._count++;
    if (expected == undefined) {
      var s = '';
      if (message != undefined) {
        s = s + message;
      }
      throw Error(s + '\nThe expected null.');
    }
  }

  thrown(expected: Error, runner: I_Runnable, message?: string): void {
    var actual;
    try {
      runner();
    } catch (e) {
      actual = e;
    }
    this.thrownIn(expected, actual, 1, message);
  }

  private thrownIn(expected: any, actual: any, counter: number, message?: string): void {
    this._count++;
    if (actual == undefined) {
      throw new Error('' + message + '\n\tNo Error was thrown.');
    }

    this._count++;
    if (!Errors.hasName(expected)) {
      throw new AssertionError('' + message + "\n\tThe expected error doesn't have a name?");
    }
    this._count++;
    if (!Errors.hasName(actual)) {
      throw new AssertionError('' + message + "\n\tThe actual error doesn't have a name?");
    }
    this._count++;
    if (expected.name != actual.name) {
      this.eqNeqIn(true, expected.name, actual.name, message);
    }

    this._count++;
    if (!Errors.hasMessage(expected)) {
      throw new Error('' + message + "\n\tThe expected error doesn't have a message?");
    }
    this._count++;
    if (!Errors.hasMessage(actual)) {
      throw new AssertionError('' + message + "\n\tThe actual error doesn't have a message?");
    }
    this._count++;
    if (expected.message != actual.message) {
      this.eqNeqIn(true, expected.message, actual.message, message);
    }

    if (Errors.hasCause(expected)) {
      this._count++;
      if (Errors.hasCause(actual)) {
        this.thrownIn(expected.cause, actual.cause, counter + 1, message);
      } else {
        throw new AssertionError('' + message + "\n\tThe expected error has a cause, however, the actual error does NOT!");
      }
    }
  }

  /**
   * This protected method increments the assertion count
   */
  _increment() {
    this._count++;
  }


  /**
   *
   * @param testFailed true when the test failed
   * @param expected
   * @param actual
   * @param message
   * @private
   */
  private eqNeqIn(testFailed: boolean, expected: I_String | string | any, actual: I_String | string | any, message?: string) {
    this._count++;
    //out('in eqNeqIn with test = ' +test)
    if (testFailed) {
      let expectedAsString: string = this.toString(expected);
      let actualAsString: string = this.toString(actual)
      this.stringMatchError(expectedAsString, actualAsString, message);
    }
  }

  /**
   * Perform a deep check of a collection
   * @param expected
   * @param actual
   * @param message
   * @return Returns true if this was an Array, Map or Set and subsequent checks occurred, false otherwise.
   * @private
   */
  private equalsDeepCheckIn(expected: any, actual: any, message?: string): boolean {
    //setup messageFormatting
    var sMsg = ''
    if (message == undefined || message == null) {
      //do nothing
    } else {
      sMsg = message;
    }

    if (Array.isArray(expected)) {
      this._count++;
      if (!Array.isArray(actual)) {
        this.stringMatchError('isArray == true', this.toString(actual), message);
      }
      let eArray = expected as Array<any>;
      let aArray = actual as Array<any>;
      this._count++;
      var len = eArray.length;
      if (aArray.length < len) {
        len = aArray.length;
      }
      //compare everything we can to attempt to be as informative as possible
      //recurse to the equals method
      for (let i = 0; i < len; i++) {
        this.equals(eArray[i], aArray[i], sMsg + '\n\t\tThe array element at the following index should match idx: ' + i);
      }
      if (eArray.length != aArray.length) {
        this.stringMatchError('Array size ' + eArray.length, 'Array size ' + aArray.length, message);
      }
      return true;
      /*
      yanking all Set tests until it is supported on the node CLI
    } else if (Sets.isSet(expected)) {
      this._count++;
      if (!Sets.isSet(actual)) {
        this.stringMatchError('isSet == true', this.toString(actual), message);
      }
      let eSet = expected as Set<any>;
      let aSet = actual as Set<any>;

      let eNotInA = Sets.difference(eSet, aSet);
      let aNotInE = Sets.difference(aSet, eSet);

      this._count++;
      if (eNotInA.size == 0 && aNotInE.size == 0) {
        return true;
      } else if (eNotInA.size == 0) {
        throw new Error(sMsg + "\n\tThe following elements are missing from the expected Set;\n\t\t" + [...aNotInE] + "\n");
      } else {
        throw new Error(sMsg + "\n\tThe following elements are missing from the actual Set;\n\t\t" + [...eNotInA] + "\n");
      }
      */
    } else if (Maps.isMap(expected)) {
      this._count++;
      if (!Maps.isMap(actual)) {
        this.stringMatchError('isMap == true', this.toString(actual), message);
      }
      let eMap = expected as Map<any, any>;
      let aMap = actual as Map<any, any>;
      this._count++;
      var len = eMap.size;
      var over = eMap;
      if (aMap.size < len) {
        len = aMap.size;
        over = aMap;
      }
      //compare everything we can to attempt to be as informative as possible
      //recurse to the equals method
      for (const key of over.keys()) {
        this._count++;
        if (eMap.has(key)) {
          if (aMap.has(key)) {
            //they both have the key
          } else {
            throw new AssertionError(sMsg + "\n\t The expected Map has the following key, which is missing from the actual Map; \n\t\t'" + key + "'");
          }
        } else {
          throw new AssertionError(sMsg + "\n\t The expected Map is missing the following key, which is present in the actual Map; \n\t\t'" + key + "'");
        }
        this.equals(eMap.get(key), aMap.get(key), sMsg + "\n\tThe value with the following key should match;\n\t\t '" + key + "'\n");
      }
      //
      let allKeys: Set<any> = new Set(eMap.keys());
      allKeys = allKeys.union(new Set(aMap.keys()));
      allKeys = allKeys.difference(new Set(over.keys()));
      this._count++;
      //this is a bug in JavaScripts Map implementation
      //console.log('before check allKeys.size is ' + allKeys.size);
      if (allKeys.size >= 1) {
        let keys = new Set(allKeys.keys());
        //console.log("the single key is '" + keys[0] + "'");
        if (allKeys.size == 1 && keys[0] == undefined) {
          console.log("This is a bug in EsNext why would a Map have a undefined key, someone please fix! ");
        } else {
          if (eMap === over) {
            throw new AssertionError(sMsg + "\n\tThe following keys are missing from the expected Map;\n\t\t" + [...keys] + "\n");
          } else {
            throw new AssertionError(sMsg + "\n\tThe following keys are missing from the actual Map;\n\t\t" + [...keys] + "\n");
          }
        }
      }
      this._count++;
      if (eMap.size != aMap.size) {
        this.stringMatchError('Map size ' + eMap.size, 'Map size ' + aMap.size, message);
      }
      return true;
    }
    return false;
  }

  private notEqualsCheckIn(expected: any, actual: any): boolean {
    var checkNotEqual = false;
    if (typeof expected === 'undefined' && expected == undefined) {
      if (typeof actual === 'undefined' && actual == undefined) {
        return checkNotEqual;
      } else {
        //the actual is not undefined so fail
        return true;
      }
    }
    if (typeof expected === 'object' && expected == null) {
      if (typeof actual === 'object' && actual == null) {
        return checkNotEqual;
      } else {
        //the actual is not null so fail
        return true;
      }
    }
    if (typeof expected === 'number' && isNaN(expected)) {
      if (typeof actual === 'number' && isNaN(actual)) {
        return checkNotEqual;
      } else {
        //the actual is not a NaN so fail
        return true;
      }
    }

    if (Objs.isEquatable(expected)) {
      checkNotEqual = !expected.equals(actual);
    } else {
      if (expected === actual) {
        //there the same so leave the test variable false (test pass)
      } else {
        //there not the same so check types
        if (typeof expected === typeof actual) {
          //there the same type so they might be equal
          if (expected == actual) {
            //there also loosly equal so leave the test variable false (test pass)
          } else {
            //there not loosly equal so fail
            checkNotEqual = true;
          }
        } else {
          //there not the same type so fail
          checkNotEqual = true;
        }
      }
    }
    return checkNotEqual;
  }

  /**
   * Perform a deep notEquals check of a collection, which is somewhat screwy
   *   the goal is to put as quick as possible if there not equals because that's a passing
   *   check for the notEquals assertion in the public API.  Generally, I don't think users of the
   *   API will be interested in why there not equals.
   * @param expected
   * @param actual
   * @param message
   * @return Returns true if this was an Array, Map or Set and subsequent notEquals checks occurred, false otherwise.
   * @private
   */
  private notEqualsDeepCheckIn(expected: any, actual: any, message?: string): boolean {
    //setup messageFormatting
    var sMsg = ''
    if (message == undefined || message == null) {
      //do nothing
    } else {
      sMsg = message;
    }

    if (Array.isArray(expected)) {
      this._count++;
      if (Array.isArray(actual)) {
        let eArray = expected as Array<any>;
        let aArray = actual as Array<any>;

        if (eArray.length == aArray.length) {
          var len = eArray.length;
          for (let i = 0; i < len; i++) {
            // recurse in case there are nested collections or objects
            // TODO improve this code, to call equals and recurse into collections
            this.notEquals(eArray[i], aArray[i], sMsg + '\n\t\tThe array element at the following index should NOT be equals at idx: ' + i);
          }
          return false;
        } else {
          //there not equals, so pass back to the notEquals method
          return false;
        }
      } else {
        //there not equals, so pass back to the notEquals method
        return false;
      }
    } else if (Sets.isSet(expected)) {
      this._count++;
      if (Sets.isSet(actual)) {

      } else {
        //there not equals, so pass back to the notEquals method
        return false;
      }
    } else if (Maps.isMap(expected)) {
      this._count++;
      if (!Maps.isMap(actual)) {
        this.stringMatchError('isMap == true', this.toString(actual), message);
      }
      let eMap = expected as Map<any, any>;
      let aMap = actual as Map<any, any>;
      this._count++;
      var len = eMap.size;
      var over = eMap;
      if (aMap.size < len) {
        len = aMap.size;
        over = aMap;
      }
      //compare everything we can to attempt to be as informative as possible
      //recurse to the equals method
      for (const key of over.keys()) {
        this._count++;
        if (eMap.has(key)) {
          if (aMap.has(key)) {
            //they both have the key
          } else {
            throw new AssertionError(sMsg + "\n\t The expected Map has the following key, which is missing from the actual Map; \n\t\t'" + key + "'");
          }
        } else {
          throw new AssertionError(sMsg + "\n\t The expected Map is missing the following key, which is present in the actual Map; \n\t\t'" + key + "'");
        }
        this.equals(eMap.get(key), aMap.get(key), sMsg + "\n\tThe value with the following key should match;\n\t\t '" + key + "'\n");
      }
      //
      let allKeys: Set<any> = new Set(eMap.keys());
      allKeys = allKeys.union(new Set(aMap.keys()));
      allKeys = allKeys.difference(new Set(over.keys()));
      this._count++;
      //this is a bug in JavaScripts Map implementation
      //console.log('before check allKeys.size is ' + allKeys.size);
      if (allKeys.size >= 1) {
        let keys = new Set(allKeys.keys());
        //console.log("the single key is '" + keys[0] + "'");
        if (allKeys.size == 1 && keys[0] == undefined) {
          console.log("This is a bug in EsNext why would a Map have a undefined key, someone please fix! ");
        } else {
          if (eMap === over) {
            throw new AssertionError(sMsg + "\n\tThe following keys are missing from the expected Map;\n\t\t" + [...keys] + "\n");
          } else {
            throw new AssertionError(sMsg + "\n\tThe following keys are missing from the actual Map;\n\t\t" + [...keys] + "\n");
          }
        }
      }
      this._count++;
      if (eMap.size != aMap.size) {
        this.stringMatchError('Map size ' + eMap.size, 'Map size ' + aMap.size, message);
      }
      return true;
    }
    return false;
  }

  private stringMatchError(expected: string, actual: string, message?: string) {
    var s = '';
    if (message != undefined) {
      s = s + message + '\n';
    }

    throw new AssertionError(s + 'The expected is; \n\t\'' + expected + '\'\n\n\tHowever the actual is;\n\t\'' +
      actual + '\'');
  }

  private isEquals(obj: I_EquatableString | I_Equatable | string | any, other: any): boolean {
    if (obj == undefined) {
      return false;
    }
    if (Objs.isEquatable(obj)) {
      return obj.equals(other);
    }
    return obj == other;
  }

  private toString(obj: I_String | string | any): string {
    if (obj == undefined) {
      return obj;
    }
    if (Strings.isI_String(obj)) {
      return (obj as I_String).toString();
    }
    if (typeof obj === 'string') {
      return obj;
    }

    if (typeof obj === 'object') {
      return JSON.stringify(obj);
    }
    //implicit toString conversion, but will likely turn into '[Object]'
    return '' + obj;
  }
}





