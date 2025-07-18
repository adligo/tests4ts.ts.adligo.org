/**
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
import { I_Proc, ProcStub } from './proc.mjs';
import { I_AssertionContext, I_AssertionContextConsumer, I_Test, I_TestFactory, I_Trial } from "@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs";
import { TrialSuite } from './tests4ts.mjs';
import { ApiTrial, TrialParams } from './trials.mjs';
import {TestFactoryDelegate} from "./tests.mjs";

export class SingleTestRunner {
  public static readonly THE_FOLLOWING_API_TRIAL_DOT_TEST = "The following ApiTrial.Test name needs a dot?";

  private _trials: Map<string, I_Trial>;

  constructor(trials: Map<string, I_Trial>) {
    this._trials = new Map();
    for (const [trialName, trial] of trials) {
      this._trials.set(trialName, trial);
    }
  }


  runTest(): SingleTestRunner {
    this.runTestWithProc(new ProcStub());
    return this;
  }
  
  runTestWithProc(proc: I_Proc): void {

    let args = proc.getArgv();
    proc.log("SingleTestRunner with " + this._trials.size + " trials and argv \n " + args);
    for (var i = 0; i < args.length; i++) {
      let arg = args[i].toLowerCase().trim();
      proc.log(" checking arg " + arg);
      if ('-test'.includes(arg)) {
        proc.log(" found arg -test ");
        if (i+1 < args.length) {
          let trialAndTestName: string = args[i +1];
          if (trialAndTestName.indexOf('.') == -1) {
            proc.log(SingleTestRunner.THE_FOLLOWING_API_TRIAL_DOT_TEST);
            return;
          }
          let trialDotTest = trialAndTestName.split('.');
          let namespaceParts = trialDotTest.length
          let trialParts = trialDotTest.slice(0, namespaceParts - 1);
          let trialName = trialParts.join('.');
          let testName = trialDotTest[namespaceParts - 1];
          proc.log("SingleTestRunner with Trial " + trialName + " test " + testName);
          let trialSuiteName = trialName + ' Suite ';
          let trial: I_Trial = this._trials.get(trialName);
          if (trial == undefined) {
            proc.log("Unknown trial '" + trialName + "'");
          } else {
            let test: I_Test = trial.getTest(testName);
            if (test == undefined) {
              proc.log("Unknown test '" + testName + "' in trial '" + trialName + "'");
            }
            new TrialSuite(trialSuiteName, [new ApiTrial(trialName, [test])]).run().printTextReport();
            return;
          }
        }
      }
    }

  }
}

export class RunTestParams {
  _assertionCallback : I_AssertionContextConsumer;
  _trialName?: string;
  _testName?: string;
  constructor(assertionCallback: I_AssertionContextConsumer, trialName?: string, testName?: string) {
    this._assertionCallback = assertionCallback;
    if (testName == null) {
      testName = 'Some Test Name';
    }
    this._testName = testName;
    if (trialName == null) {
      trialName = 'Some Trial Name';
    }
    this._trialName = trialName;
  }
}

class RunOneTestTrialDelegate extends  ApiTrial {
  _acConsumer: I_AssertionContextConsumer;

  constructor(params: RunTestParams) {
    super(params._trialName);
    this._acConsumer = params._assertionCallback;
  }

  testDelegate(ac: I_AssertionContext) {
    this._acConsumer(ac);
  }
}
export function run(params: RunTestParams): void {
  let trialDelegate = new RunOneTestTrialDelegate(params);
  new TrialSuite(params._trialName, [trialDelegate]).run().printTextReport();
}

export function runTest(trial: I_Trial, testName: string): void {
  let trialDelegate = new ApiTrial(new TrialParams(trial.getName()).withTestFactory(new TestFactoryDelegate(trial, testName)));
  new TrialSuite(trial.getName(), [trialDelegate]).run().printTextReport();
}