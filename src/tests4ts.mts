/**
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
import {I_Out} from './i_io.ts.adligo.org@slink/i_io.mjs';
import { I_Equatable,  I_Classifiable } from './i_obj.ts.adligo.org@slink/i_obj.mjs';
import { I_String, I_Named } from './i_strings.ts.adligo.org@slink/i_strings.mjs';

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
  private clazzName = 'org.adligo.ts.tests4ts.AssertionContext';
  private count: number = 0;

  public error(expected: string, runnable: () => void) {
    this.count++;
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
    let test = !expected.equals(actual);
    this.eqNeqIn(test, expected, actual, message);
  }

  public getCount(): number { return this.count; } 
  public getClass(): string { return this.clazzName; } 
  public isFalse(check: boolean, message?: string) {
    this.count++;
    if (check) {
      throw Error(message);
    }
  }

  public isTrue(check: boolean, message?: string) {
    this.count++;
    if (!check) {
      throw Error(message);
    }
  }

  public notEquals(expected: I_Equatable, actual: any, message?: string) {
    let test = expected.equals(actual);
    this.eqNeqIn(test, expected, actual, message);
  }

  public same(expected: string, actual: string, message?: string) {
    this.count++;
    if (expected != actual) {
      this.throwStringMatchError(expected, actual, message);
    }
  }

  private eqNeqIn(test: boolean, expected: I_Equatable, actual: any, message?: string) {
    this.count++;
    //out('in eqNeqIn with test = ' +test)
    if (test) {
      let expectedAsString: I_String = expected as I_String;
      let actualAsString: I_String = expected as I_String;
      if (expectedAsString.toString != undefined && actualAsString.toString != undefined) {
        this.throwStringMatchError(expectedAsString.toString(), actualAsString.toString(), message);   
      } else if (expectedAsString.toString != undefined) {
        this.throwStringMatchError(expectedAsString.toString(), 'actual didn\'t implement I_String ... ' + actual, message);
      } else if (actualAsString.toString != undefined) {
        this.throwStringMatchError('expected didn\'t implement I_String ... ' + expected, actualAsString.toString(), message);
      } else {
        this.throwStringMatchError('expected didn\'t implement I_String ... ' + expected, 
          'actual didn\'t implement I_String ... ' + actual, message);
      }
    }
  }
  private throwStringMatchError(expected: string, actual: string, message?: string) {
    var s = '';
    if (message != undefined) {
      s = s + message;
    }

    throw Error(s + '\nThe expected string is; \n\t\'' + expected + '\'\n\tHowever the actual string is;\n\t\'' + 
      actual + '\'');
  }
}

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 * Note a test is really a indivual Function in this implementation,
 * hoistorically in the Java tests4j implementation it's a method.
 */
export class Test implements I_Named {
  private acConsumer: I_AssertionContextConsumer;
  private name: string;

  constructor(name: string, assertionContextConsumer: I_AssertionContextConsumer) {
    this.name = name;
    this.acConsumer = assertionContextConsumer;
  }

  public getName() { return this.name; }
  public run(assertionCtx: AssertionContext) { this.acConsumer(assertionCtx); }
}

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class TestResult {
  private assertionCount : number;
  private test: Test;
  private pass: boolean;
  private errorMessage: string;

  constructor(assertionCount: number, test: Test, pass?: boolean, errorMessage?: string) {
    this.assertionCount = assertionCount;
    this.test = test;
    if (pass == undefined) {
      this.pass = true
    } else {
      this.pass = pass;
    }
    if (errorMessage == undefined) {
      this.errorMessage = '';
    } else {
      this.errorMessage = errorMessage;
    }
  }


  public isPass() { return this.pass}
  public getAssertionCount() { return this.assertionCount }
  public getErrorMessage() { return this.errorMessage; }
  public getName() { return this.test.getName(); }
}

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class ApiTrial implements I_Named {
  private name: string;
  private tests: Test[];
  private results: TestResult[] = [];
  private failures: number = 0;

  constructor(name: string, tests: Test[]) {
    this.name = name;
    this.tests = tests;
  }
  public getAssertionCount() { return this.results.map(r => r.getAssertionCount()).reduce((sum, current) => sum + current, 0); }
  public getFailureCount() { return this.failures; }
  public getName() { return this.name; }
  public getTestCount() { return this.tests.length; }
  public getTestResults() { return this.results; }
  public run(): I_Runnable {
    //out('In run of ' + this.getName());
    let funs: Function[] = new Array(this.tests.length);
    for (var i = 0; i< this.tests.length; i++) {
      let t: Test = this.tests[i];
      //out('Aggergating async function for  ' + t.getName());
      funs[i] = async () => {
        var e: string = '';
        let ac: AssertionContext = new AssertionContext();
        try {
          //out('Running  ' + t.getName());
          console.log('Running Test t ' + JSON.stringify(t) + ' with ac ' + JSON.stringify(ac));
          t.run(ac)
        } catch (x: any) {
          e = '' + x;
        }
        if (e == '') {
          //out('Assertion count is  ' + ac.getCount() + ' for test ' + t.getName());
          this.results.push(new TestResult(ac.getCount(), t))
        } else {
          this.results.push(new TestResult(ac.getCount(), t, false, e));
          this.failures++;
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
  private name: string;
  private out: I_Out;
  private trials: ApiTrial[];


  constructor(name: string, trials: ApiTrial[], out? : I_Out) {
    this.name = name;
    if (out == undefined) {
     this.out = (s) => console.log(s);
    } else {
      this.out = out;
    }
    this.trials = trials;
  }

  public run(): TrialSuite {
    this.out('TrialSuite: run ' + this.name);
    let funAll = async () => {
      let funs : Function[] = new Array(this.trials.length);
      for (var i =0; i < this.trials.length; i++) {
        let t: ApiTrial = this.trials[i]; 
        funs[i] = t.run();
      }
      return await Promise.all(funs);
    }
    funAll();
    return this;
  }

  printTextReport(): TrialSuite  {
    this.trials.forEach(t => {
      this.out('\t' + t.getName() + ' ' + this.name);
      this.out('\t\tAssertions: ' + t.getAssertionCount());
      this.out('\t\tFailures: ' + t.getFailureCount());
      this.out('\t\tTests: ' + t.getTestCount());
      if (t.getFailureCount() != 0) {
        t.getTestResults().forEach(r => {
          if ( !r.isPass()) {
            this.out('\t\t\t' + r.getName() + " : " + r.getErrorMessage());
          }
        });
      }
    });
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
    this.trials.forEach(t => {
      var fname : string = 'build/test-reports/' + t.getName() + '.xml';
      console.log("creating file " + fname);
      var xmlString: string = converter.convertToXml(t);
      this.createFile(fname, xmlString);
    });
    return this;
  }
}