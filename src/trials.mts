/**
 *
 * This file contains the exported ApiTrial from tests4ts.mts
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
  I_AssertionContext, I_AssertionContextConsumer, I_AssertionContextFactory,
  I_FileConverter, I_Runnable, I_Test,
  I_TestResult, I_TestResultFactory, I_Trial, TrialType
} from "@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs";
import { AssertionContext } from "./assertions.mjs";
import { TrialSuite } from "./tests4ts.mjs";
import { I_Named } from "@ts.adligo.org/i_strings/dist/i_strings.mjs";

import { Errors } from "@ts.adligo.org/type-guards/dist/typeGuards.mjs";

export class TrialParams implements I_Named {
  public static of(trialName: string): TrialParams {
    return new TrialParams(trialName);
  }
  _trialName: string;

  constructor(trialName: string) {
    this._trialName = trialName;
  }

  public getName(): string {
    return this._trialName;
  }
}



/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
abstract class AbstractTrial implements I_Trial {
  public static readonly A_TEST_WITH_AN_EMPTY_NAME_HAS_BEEN_SENT = "A test with an empty or undefined name has been sent ???";
  public static readonly A_TEST_WITH_THE_FOLLOWING_DUPLICATE_NAME_HAS_BEEN_SENT = "A test with the following duplicate name has been sent ??? ";
  public static readonly TEST_NAMES_SHOULD_NOT_CONTAIN_DOTS = 
    "The following test name is fully qualified with dots to separate name-space components, please remove these as they are implied;";

  private _name: string;
  private _ignored: number = 0;
  private _tests: I_Test[];
  private _testsMap: Map<string, I_Test>;
  private _results: I_TestResult[] = [];
  private _failures: number = 0;

  constructor(trialNameOrP: string | TrialParams, tests: I_Test[]) {
    if (trialNameOrP instanceof TrialSuite) {
      let params = trialNameOrP as TrialParams;
      this._name = params.getName();
    } else {
      this._name = trialNameOrP as string;
    }
    this._tests = tests;
    this._testsMap = new Map();
    for (var i = 0; i < this._tests.length; i++) {
      let test = tests[i];
      let testName = test.getName();
      if (testName == undefined || testName.trim() == '') {
        throw Error(AbstractTrial.A_TEST_WITH_AN_EMPTY_NAME_HAS_BEEN_SENT);
      }
      if (this._testsMap.has(testName)) {
        throw Error(AbstractTrial.A_TEST_WITH_THE_FOLLOWING_DUPLICATE_NAME_HAS_BEEN_SENT + test.getName());
      }
      if (testName.includes('.')) {
        throw Error(AbstractTrial.TEST_NAMES_SHOULD_NOT_CONTAIN_DOTS + '\n  ' +  test.getName());
      }
      this._testsMap.set(test.getName(), test);
    }
  }

  getAssertionCount() {
    return this._results.map(r => r.getAssertionCount()).reduce((sum, current) => sum + current, 0);
  }

  getFailureCount() {
    return this._failures;
  }

  getIgnored() {
    return this._ignored;
  }

  getName() {
    return this._name;
  }

  getTestCount() {
    return this._tests.length;
  }

  getTest(testName: string): I_Test {
    return this._testsMap.get(testName) as I_Test;
  }

  getTestResults() {
    return this._results;
  }

  abstract getType(): TrialType;

  run(assertionCtxFactory: I_AssertionContextFactory, testResultFactor: I_TestResultFactory): I_Runnable {
    //out('In run of ' + this.getName());
    let funs: Function[] = new Array(this._tests.length);
    for (var i = 0; i < this._tests.length; i++) {
      let t: I_Test = this._tests[i];
      var caught: any;
      //out('Aggergating async function for  ' + t.getName());
      funs[i] = async () => {
        var failureErrorMessage: string = '';
        let ac: I_AssertionContext = assertionCtxFactory.newAssertionContext();
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
          failureErrorMessage = '\n\nTest ' + t.getName() + ' Failed\n'
          failureErrorMessage = this.appendErrorDetails(x, failureErrorMessage);
        }
        this._results.push(testResultFactor.newTestResultFailure(ac.getCount(), t, failureErrorMessage));
        this._failures++;
        return;
      }
      funs[i]();
    }
    return async () => {
      return await Promise.all(funs)
    };
  }

  private appendErrorDetails(caught: any, failureErrorMessage: string) {
    if (caught != undefined) {
      if (Errors.hasStack(caught)) {
        //the stack has the error message
        failureErrorMessage += caught.stack;
      } else if (Errors.hasMessage(caught)) {
        failureErrorMessage += caught.message + '\n';
      } else {
        failureErrorMessage += +caught + '\n';
      }

      var cause = caught.cause;
      while (cause != undefined) {
        failureErrorMessage += "\n\n Cause: " + cause.name;
        failureErrorMessage = this.appendErrorDetails(cause, failureErrorMessage);
        cause = caught.cause;
      }
    }
    return failureErrorMessage;
  }
}

export class ApiTrial extends AbstractTrial implements I_Trial {

  getAssertionCount(): number { return super.getAssertionCount(); }

  getFailureCount(): number { return super.getFailureCount(); }

  getIgnored(): any { return super.getIgnored(); }

  getTestCount(): number { return super.getTestCount(); }

  getTest(testName: string): I_Test { return super.getTest(testName); }

  getTestResults(): I_TestResult[] { return super.getTestResults(); }

  getType() {
    return TrialType.ApiTrial;
  }

  run(assertionCtxFactory: I_AssertionContextFactory, testResultFactory: I_TestResultFactory): I_Runnable {
    return super.run(assertionCtxFactory, testResultFactory);
  }
}

export class SourceFileTrialParams implements I_Named {
  public static of(trialName: string): TrialParams {
    return new TrialParams(trialName);
  }
  _trialName: string;

  constructor(trialName: string) {
    this._trialName = trialName;
  }

  public getName(): string {
    return this._trialName;
  }
}

export class SourceFileTrial extends AbstractTrial implements I_Trial {

  constructor(trialNameOrP: string | SourceFileTrialParams, tests: I_Test[]) {
    super(trialNameOrP, tests);
  }


  getAssertionCount(): number { return super.getAssertionCount(); }

  getFailureCount(): number { return super.getFailureCount(); }

  getIgnored(): any { return super.getIgnored(); }

  getTestCount(): number { return super.getTestCount(); }

  getTest(testName: string): I_Test { return super.getTest(testName); }

  getTestResults(): I_TestResult[] { return super.getTestResults(); }

  getType() {
    return TrialType.SourceFileTrial;
  }

  run(assertionCtxFactory: I_AssertionContextFactory, testResultFactory: I_TestResultFactory): I_Runnable {
    return super.run(assertionCtxFactory, testResultFactory);
  }


}

