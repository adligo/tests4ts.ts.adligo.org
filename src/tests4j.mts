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
import {I_Out} from './i_io.ts.adligo.org@slink/i_io.mjs';

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */ 
export type I_AssertionContextConsumer = (ac : AssertionContext) => void;

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class AssertionContext {
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
        this.equals(expected, err.message);
      }
    }
  }

  public equals(expected: string, actual: string) {
    this.count++;
    if (expected != actual) {
      throw Error('The expected string is; \n\t\'' + expected + '\'\n\tHowever the actual string is;\n\t\'' + 
        actual + '\'');
    }
  }

  public getCount(): number { return this.count; } 
  public isFalse(check: boolean, message: string) {
    this.count++;
    if (check) {
      throw Error(message);
    }
  }

  public isTrue(check: boolean, message: string) {
    this.count++;
    if (!check) {
      throw Error(message);
    }
  }
}

/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 * Note a test is really a indivual Function in this implementation,
 * hoistorically in the Java tests4j implementation it's a method.
 */
export class Test {
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
export class ApiTrial {
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
  public run() {
    this.tests.forEach(t => {
      var e: string = '';
      let ac: AssertionContext = new AssertionContext();
      try {
        t.run(ac)
      } catch (x: any) {
        e = '' + x;
      }
      if (e == '') {
        this.results.push(new TestResult(ac.getCount(), t))
      } else {
        this.results.push(new TestResult(ac.getCount(), t, false, e));
        this.failures++;
      }
    });
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

  public run() {
    this.out('TrialSuite: ' + this.name);
    this.trials.forEach(t => {
     
      t.run();
      this.out('\t' + t.getName() + this.name);
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
  }

}