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

export class SingleTrialRunner {
  private _trials: Map<string, ApiTrial>;

  constructor(trials: Map<string, ApiTrial>) {
    this._trials = trials;
  }

  runTrial(proc: I_Proc): void {
    let args = proc.getArgv();
    for (var i = 0; i < args.length; i++) {
      let arg = args[i];
      if (arg == '--trial') {
        if (i+1 < args.length) {
          let trialName = args[i +1];
          let trialSuiteName = trialName + ' Suite ';
          let trial = this._trials.get(trialName);
          if (trial == undefined) {
            proc.log("Unknown trial '" + trialName + "'");
          } else {
            new TrialSuite(trialSuiteName, [trial]).run().printTextReport();
            return;
          }
        }
      }
    }

  }
}
export function runTrial(trial: ApiTrial, trialSuiteName?: string): void {

  if (trialSuiteName == undefined) {
    trialSuiteName = 'Generic Trial Suite ';
  }
  new TrialSuite(trialSuiteName, [trial]).run().printTextReport();
}