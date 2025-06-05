/**
 *
 *
 *
  * Copyright 2023 Adligo Inc / Scott Morgan
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
//const fs = require('fs');
//const path = require('path');
import * as fs from 'fs';
import * as path from 'path';
// The following commented out xml tags with slinks will flag to the slink command line program, that these paths can be modfied 
// from the slink logic instead of hard coding them like I have currently done.
//<slinks>
import {I_Out} from '../../i_io.ts.adligo.org/src/i_io.mjs';
import { I_Equatable,  I_Classifiable } from '../../i_obj.ts.adligo.org/src/i_obj.mjs';
import { I_String, I_Named } from '../../i_strings.ts.adligo.org/src/i_strings.mjs';
//</slinks>

function out(message: string ) {
  console.count(message);
}
/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */ 
export type I_AssertionContextConsumer = (ac : AssertionContext) => void;

/**
 * Converts a Trial's Results into a xml string that can be printed as a file
 */
export interface I_XmlConverter {
   convertToXml(trial: ApiTrial): string;
}
export type I_Runnable = () => void;
/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class AssertionContext implements I_Classifiable {
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

  public equals(expected: any, actual: any, message?: string) {
    var test = false;
    if (expected != undefined) {
       if (typeof(expected) == 'object') {
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

  public getCount(): number { return this._count; }
  public getClass(): string { return this._clazzName; }
  public isFalse(check: boolean, message?: string) {
    this._count++;
    if (check) {
      throw Error(message);
    }
  }

  public isTrue(check: boolean, message?: string) {
    this._count++;
    if (!check) {
      throw Error(message);
    }
  }

  public notEquals(expected: I_Equatable, actual: any, message?: string) {
    let test = expected.equals(actual);
    this.eqNeqIn(test, expected, actual, message);
  }

  public same(expected: string, actual: string, message?: string) {
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
}

export class TestParams {
  public static of(name: string) {
    let tp = new TestParams();
    tp._name = name;
    return tp;
  }

  
  private _name: string;
  private _ignore: boolean = false;
  
  public ignore(): TestParams {
    this._ignore = true;
    return this;
  }
  
  public getName() {
    return this._name;
  }
  public isIgnored() {
    return this._ignore;
  }
}

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 * Note a test is really a indivual Function in this implementation,
 * hoistorically in the Java tests4j implementation it's a method.
 */
export class Test implements I_Named {
  private _acConsumer: I_AssertionContextConsumer;
  private _name: string;
  private _ignored: boolean;

  constructor(params: TestParams, assertionContextConsumer: I_AssertionContextConsumer) {
    this._name = params.getName();
    this._ignored = params.isIgnored();
    this._acConsumer = assertionContextConsumer;
  }

  public getName() { return this._name; }
  public ignore() : Test { this._ignored = true; return this; }
  public isIgnored() { return this._ignored; }
  public run(assertionCtx: AssertionContext) { this._acConsumer(assertionCtx); }
}

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class TestResult {
  private _assertionCount : number;
  private _test: Test;
  private _pass: boolean;
  private _errorMessage: string;

  constructor(assertionCount: number, test: Test, pass?: boolean, errorMessage?: string) {
    this._assertionCount = assertionCount;
    this._test = test;
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


  public isPass() { return this._pass}
  public getAssertionCount() { return this._assertionCount }
  public getErrorMessage() { return this._errorMessage; }
  public getName() { return this._test.getName(); }
}

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class ApiTrial implements I_Named {
  public static readonly A_TEST_WITH_AN_EMPTY_NAME_HAS_BEEN_SENT = "A test with an empty or undefined name has been sent ???";
  public static readonly A_TEST_WITH_THE_FOLLOWING_DUPLICATE_NAME_HAS_BEEN_SENT = "A test with the following duplicate name has been sent ??? ";

  private _name: string;
  private _ignored: number = 0;
  private _tests: Test[];
  private _testsMap: Map<string,Test>;
  private _results: TestResult[] = [];
  private _failures: number = 0;



  constructor(name: string, tests: Test[]) {
    this._name = name;
    this._tests = tests;
    this._testsMap = new Map();
    for (var i = 0; i< this._tests.length; i++) {
      let test = tests[i];
      if (test.getName() == undefined || test.getName().trim() == '') {
        throw Error(ApiTrial.A_TEST_WITH_AN_EMPTY_NAME_HAS_BEEN_SENT);
      }
      if (this._testsMap.has(test.getName())) {
        throw Error(ApiTrial.A_TEST_WITH_THE_FOLLOWING_DUPLICATE_NAME_HAS_BEEN_SENT + test.getName());
      }
      this._testsMap.set(test.getName(), test);
    }

  }
  public getAssertionCount() { return this._results.map(r => r.getAssertionCount()).reduce((sum, current) => sum + current, 0); }
  public getFailureCount() { return this._failures; }
  public getIgnored() { return this._ignored; }
  public getName() { return this._name; }
  public getTestCount() { return this._tests.length; }
  public getTest(testName: string) { return this._testsMap.get(testName); }
  public getTestResults() { return this._results; }
  public run(): I_Runnable {
    //out('In run of ' + this.getName());
    let funs: Function[] = new Array(this._tests.length);
    for (var i = 0; i< this._tests.length; i++) {
      let t: Test = this._tests[i];
      var caught: any;
      //out('Aggergating async function for  ' + t.getName());
      funs[i] = async () => {
        var e: string = '';
        let ac: AssertionContext = new AssertionContext();
        try {
          if (t.isIgnored()) {
            console.log('IGNORING Test ' + t.getName());
            this._ignored++;
          } else {
            //out('Running  ' + t.getName());
            //+ ' with ac ' + JSON.stringify(ac)
            console.log('Running Test ' + t.getName());
            t.run(ac)
          }
        } catch (x: any) {
          caught = x;
          e = '\n\nTest ' + t.getName() + ' Failed\n' + x + '\n';
          if (caught != undefined) {
            e += caught.stack;
            var cause = caught.cause;
            while (cause != undefined) {
              e += "\n\n Cause: " + cause.name + " " + cause.message + "\n" + cause.stack;
              cause = caught.cause;
            }
          }
        }
        if (e == '') {
          //out('Assertion count is  ' + ac.getCount() + ' for test ' + t.getName());
          this._results.push(new TestResult(ac.getCount(), t))
        } else {
          this._results.push(new TestResult(ac.getCount(), t, false, e));
          this._failures++;
        }
        return;
      }
      funs[i]();
    }
    return async () => { return await Promise.all(funs)};
  }
}

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class TrialSuite {
  private _name: string;
  private _out: I_Out;
  private _trials: ApiTrial[];


  constructor(name: string, trials: ApiTrial[], out? : I_Out) {
    this._name = name;
    if (out == undefined) {
     this._out = (s) => console.log(s);
    } else {
      this._out = out;
    }
    this._trials = trials;
  }

  public run(): TrialSuite {
    this._out('TrialSuite: run ' + this._name);
    let funAll = async () => {
      let funs : Function[] = new Array(this._trials.length);
      for (var i =0; i < this._trials.length; i++) {
        let t: ApiTrial = this._trials[i];
        funs[i] = t.run();
      }
      return await Promise.all(funs);
    }
    funAll();
    return this;
  }

  printTextReport(): TrialSuite  {
    var ta = 0;
    var tf = 0;
    var tt = 0;
    var ti = 0;
    this._trials.forEach(t => {
      this._out('\t' + t.getName() + ' ' + this._name);
      ta += t.getAssertionCount();
      tf += t.getFailureCount();
      tt += t.getTestCount();
      ti += t.getIgnored();
      this._out('\t\tAssertions: ' + t.getAssertionCount());
      this._out('\t\tFailures: ' + t.getFailureCount());
      this._out('\t\tTests: ' + t.getTestCount());
      if (t.getFailureCount() != 0) {
        t.getTestResults().forEach(r => {
          if ( !r.isPass()) {
            this._out('\t\t\t' + r.getName() + " : " + r.getErrorMessage());
          }
        });
      }
    });
    this._out('\n\nTotal for ' + this._trials.length + " Trials ");
    this._out('\tAssertions: ' + ta);
    this._out('\tFailures: ' + tf);
    this._out('\tIgnored: ' + ti);
    this._out('\tTests: ' + tt);
    return this;
  }

  createDir(dirPath) {
    const absolutePath = path.resolve(dirPath); // Resolve to an absolute path
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true }); // Create directory, including parent directories if they don't exist
    }
  }

  createFile(filePath, content) {
    const absolutePath = path.resolve(filePath);
    const dirPath = path.dirname(absolutePath);
    this.createDir(dirPath); // Ensure directory exists before creating file
    fs.writeFileSync(absolutePath, content);
  }

  printTestReportFiles(converter: I_XmlConverter): TrialSuite  {
    this.createDir('build');
    this.createDir('build/test-reports');
    this._trials.forEach(t => {
      var fname : string = 'build/test-reports/' + t.getName() + '.xml';
      console.log("creating file " + fname);
      var xmlString: string = converter.convertToXml(t);
      this.createFile(fname, xmlString);
    });
    return this;
  }
}