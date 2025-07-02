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
  I_AssertionContext,
  I_AssertionContextResult,
  I_EquatableString, I_RecursiveEqualsResult,
  I_RecursiveEqualsResultErrorFormmater,
  I_Runnable
} from '@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs';
import {RecursiveEqualsResultErrorFormmater} from './formatters.mjs';
import {EqualsRecursiveChecker, FastOrDeep} from './equals.mjs';

import {I_Equatable} from '@ts.adligo.org/i_obj/dist/i_obj.mjs';
import {I_String} from '@ts.adligo.org/i_strings/dist/i_strings.mjs';
import {Errors, isNil, Maps, Objs, Sets} from "@ts.adligo.org/type-guards/dist/typeGuards.mjs";
import {RecursiveEqualsResult} from "./equalsResults.mjs";

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

export class AssertionContextParams {
  private _formatter: I_RecursiveEqualsResultErrorFormmater;

  getFormatter(): I_RecursiveEqualsResultErrorFormmater {
    return this._formatter;
  }

  withFormatter(formatter: I_RecursiveEqualsResultErrorFormmater) {
    this._formatter = formatter;
  }
}
/**
 * To see how-to / usage go to https://github.com/adligo/tests4ts.ts.adligo.org
 */
export class AssertionContext implements I_AssertionContextResult, I_AssertionContext {
  private static readonly CLAZZ_NAME = 'org.adligo.ts.tests4ts.AssertionContext';
  private _count: number = 0;
  private _equalsDeep: EqualsRecursiveChecker = new EqualsRecursiveChecker(FastOrDeep.Deep);
  private _equalsFast: EqualsRecursiveChecker = new EqualsRecursiveChecker(FastOrDeep.Fast);
  private _formatter: I_RecursiveEqualsResultErrorFormmater;

  constructor(params?: AssertionContextParams) {
    if (!isNil(params)) {
      this._formatter = params.getFormatter();
    }
    if (isNil(this._formatter)) {
      this._formatter = new RecursiveEqualsResultErrorFormmater();
    }
  }

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
    let result: I_RecursiveEqualsResult = this._equalsDeep.equals(expected, actual);
    this._count += result.getAssertionCount();
    if ( !result.isSuccess()) {
      throw new AssertionError(this._formatter.format(result, message));
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
    let result: I_RecursiveEqualsResult = this._equalsFast.equals(expected, actual);
    this._count += result.getAssertionCount();
    if (result.isSuccess()) {
      throw new AssertionError(this._formatter.format(result, message));
    }
  }

  same(expected: I_String | string | any, actual: I_String | string | any, message?: string): void {
    this._count++;
    if (!(expected === actual)) {
      throw new AssertionError(this._formatter.format(
          RecursiveEqualsResult.of(expected, actual), message));
    }
  }

  notSame(expected: I_String | string | any, actual: I_String | string | any, message?: string): void {
    this._count++;
    if (expected === actual) {
      throw new AssertionError(this._formatter.format(
          RecursiveEqualsResult.of(expected, actual), message));
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
      throw new AssertionError(this._formatter.format(
          RecursiveEqualsResult.of(expected.name, actual.name), message));
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
      throw new AssertionError(this._formatter.format(
          RecursiveEqualsResult.of(expected.message, actual.message), message));
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
}





