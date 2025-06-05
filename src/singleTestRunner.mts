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
import { I_Proc } from './proc.mjs';
import { ApiTrial, Test, TrialSuite } from './tests4ts.mjs';

export class SingleTestRunner {
  public static readonly THE_FOLLOWING_API_TRIAL_DOT_TEST = "The following ApiTrial.Test name needs a dot?";

  private _trials: Map<string, ApiTrial>;

  constructor(trials: Map<string, ApiTrial>) {
    this._trials = new Map();
    for (const [trialName, trial] of trials) {
      this._trials.set(trialName, trial);
    }
  }


  runTrial(proc: I_Proc): void {
    let args = proc.getArgv();
    for (var i = 0; i < args.length; i++) {
      let arg = args[i];
      if (arg == '--test') {
        if (i+1 < args.length) {
          let trialAndTestName: string = args[i +1];
          if (trialAndTestName.indexOf('.') == -1) {
            proc.log(SingleTestRunner.THE_FOLLOWING_API_TRIAL_DOT_TEST);
            return;
          }
          let trialDotTest = trialAndTestName.split('.', 2);
          let trialName = trialDotTest[0];
          let testName = trialDotTest[1];
          let trialSuiteName = trialName + ' Suite ';
          let trial: ApiTrial = this._trials.get(trialName);
          if (trial == undefined) {
            proc.log("Unknown trial '" + trialName + "'");
          } else {
            let test: Test = trial.getTest(testName);
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

export function runTest(test: Test, trialSuiteName?: string, trialName?: string): void {

  if (trialSuiteName == undefined) {
    trialSuiteName = 'Generic Trial Suite ';
  }
  if (trialName == undefined) {
    trialName = 'SingleTestApiTrial';
  }
  new TrialSuite(trialSuiteName, [new ApiTrial(trialName, [test])]).run().printTextReport();
}