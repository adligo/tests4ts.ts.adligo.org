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
import { I_AssertionContext, I_AssertionContextConsumer, I_AssertionContextResult, I_EquatableString, I_Runnable } from
  '@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs';

import { I_Equatable } from '@ts.adligo.org/i_obj/dist/i_obj.mjs';
import { I_String } from '@ts.adligo.org/i_strings/dist/i_strings.mjs';
import { Errors, Objs, Strings } from "@ts.adligo.org/type-guards/dist/typeGuards.mjs";
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
      throw Error('The runnable was expected to throw an Error, however it did NOT throw an error.');
    } else {
      let ex: Error = err as Error;
      if (ex.message != expected) {
        this.same(expected, err.message);
      }
    }
  }

  equals(expected: I_EquatableString | I_Equatable | I_String | string | any, actual: I_String | string | any, message?: string): void {
    var test = false;
    if (expected != undefined) {
      if (Objs.isEquatable(expected)) {
        test = !expected.equals(actual);
      } else {
        test = expected != actual;
      }
    }
    this.eqNeqIn(test, expected, actual, message);
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
      throw Error(message);
    }
  }

  isTrue(check: boolean, message?: string) {
    this._count++;
    if (!check) {
      throw Error(message);
    }
  }

  notEquals(expected: I_EquatableString | I_Equatable | I_String | string | any, actual: I_String | string | any, message?: string): void {
    this._count++;
    if (Objs.isEquatable(expected)) {
      let test = expected.equals(actual);
      this.eqNeqIn(test, expected, actual, message);
    } else {
      this.eqNeqIn(expected != actual, expected, actual, message);
    }
  }

  same(expected: I_String | string | any, actual: I_String | string | any, message?: string): void {
    this._count++;
    if (expected != actual) {
      this.stringMatchError(expected, actual, message);
    }
  }

  notSame(expected: I_String | string | any,  actual: I_String | string | any, message?: string): void {
    this._count++;
    if (expected == actual) {
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
    this.thrownIn(expected, actual, 1,  message);
  }

  private thrownIn(expected: any, actual: any, counter: number, message?: string): void {
    this._count++;
    if (actual == undefined) {
      throw new Error('' + message + '\n\tNo Error was thrown.');
    }

    this._count++;
    if ( !Errors.hasName(expected)) {
      throw new Error('' + message + "\n\tThe expected error doesn't have a name?");
    }
    this._count++;
    if ( !Errors.hasName(actual)) {
      throw new Error('' + message + "\n\tThe actual error doesn't have a name?");
    }
    this._count++;
    if (expected.name != actual.name) {
      this.eqNeqIn(true, expected.name, actual.name, message);
    }

    this._count++;
    if ( !Errors.hasMessage(expected)) {
      throw new Error('' + message + "\n\tThe expected error doesn't have a message?");
    }
    this._count++;
    if ( !Errors.hasMessage(actual)) {
      throw new Error('' + message + "\n\tThe actual error doesn't have a message?");
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
        throw new Error('' + message + "\n\tThe expected error has a cause, however, the actual error does NOT!");
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
      if (expectedAsString != actualAsString) {
        this.stringMatchError(expectedAsString, actual, message);
      }
    }
  }
  private stringMatchError(expected: string, actual: string, message?: string) {
    var s = '';
    if (message != undefined) {
      s = s + message;
    }

    throw Error(s + '\nThe expected is; \n\t\'' + expected + '\'\n\tHowever the actual is;\n\t\'' +
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
    if ( typeof obj === 'string' ) {
      return obj;
    }
    //implicit toString conversion, but will likely turn into '[Object]'
    return '' + obj;
  }
}