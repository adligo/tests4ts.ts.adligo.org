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
import {I_AssertionContext, I_AssertionContextConsumer, I_AssertionContextResult, I_Runnable} from
        '@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs';
import {I_Equatable} from "@ts.adligo.org/i_obj/dist/i_obj.mjs";
import {I_String} from "@ts.adligo.org/i_strings/dist/i_strings.mjs";
/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class AssertionContext implements I_AssertionContextResult, I_AssertionContext {
    private _clazzName = 'org.adligo.ts.tests4ts.AssertionContext';
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

    equals(expected: any, actual: any, message?: string) {
        var test = false;
        if (expected != undefined) {
            if (typeof (expected) == 'object') {
                if (expected.equals != undefined) {
                    test = !expected.equals(actual);
                } else {
                    test = expected != actual;
                }
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
        return this._clazzName;
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

    notEquals(expected: I_Equatable, actual: any, message?: string) {
        let test = expected.equals(actual);
        this.eqNeqIn(test, expected, actual, message);
    }

    same(expected: string, actual: string, message?: string) {
        this._count++;
        if (expected != actual) {
            this.StringMatchError(expected, actual, message);
        }
    }

    /**
     *
     * @param testFailed true when the test failed
     * @param expected
     * @param actual
     * @param message
     * @private
     */
    private eqNeqIn(testFailed: boolean, expected: I_Equatable, actual: any, message?: string) {
        this._count++;
        //out('in eqNeqIn with test = ' +test)
        if (testFailed) {
            let expectedAsString: I_String = expected as I_String;
            let actualAsString: I_String = actual as I_String;
            if (expectedAsString.toString != undefined && actualAsString.toString != undefined) {
                this.StringMatchError(expectedAsString.toString(), actualAsString.toString(), message);
            } else if (expectedAsString.toString != undefined) {
                this.StringMatchError(expectedAsString.toString(), 'actual didn\'t implement I_String ... ' + actual, message);
            } else if (actualAsString.toString != undefined) {
                this.StringMatchError('expected didn\'t implement I_String ... ' + expected, actualAsString.toString(), message);
            } else {
                this.StringMatchError('expected didn\'t implement I_String ... ' + expected,
                    'actual didn\'t implement I_String ... ' + actual, message);
            }
        }
    }
    private StringMatchError(expected: string, actual: string, message?: string) {
        var s = '';
        if (message != undefined) {
            s = s + message;
        }

        throw Error(s + '\nThe expected is; \n\t\'' + expected + '\'\n\tHowever the actual is;\n\t\'' +
            actual + '\'');
    }

    notSame(expected: string, actual: string, message?: string): void {
        throw new Error("TODO implement notSame");
    }

    thrown(error: Error, runner: I_Runnable, message?: string): void {
        throw new Error("TODO implement thrown");
    }
}