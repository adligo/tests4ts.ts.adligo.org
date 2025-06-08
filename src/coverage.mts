/**
 * This file code related to code coverage which I'm picking up from c8 most likely using the JSON reporter(s).
 * 
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
  I_AssertionContextConsumer, I_AssertionContextFactory,
  I_FileConverter,
  I_Runnable,
  I_Test,
  I_TestResult, I_TestResultFactory,
  I_Trial
} from "@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs";
import { TestResult, TestResultParams} from "./results.mjs";

export class CoverageCleaner {
  
  /**
   * this method should delete the coverage directory to make sure 
   * it's not there when c8 runs
   */
  public cleanup() {
    
  }
}

export class CoverageTestResultFactory implements  I_TestResultFactory {
    newTestResult(assertionCount: number, test: I_Test): I_TestResult {
        throw new Error("Method not implemented.");
    }
    newTestResultFailure(assertionCount: number, test: I_Test, errorMessage: string): I_TestResult {
        throw new Error("Method not implemented.");
    }
}

export class TestResultWithCoverage extends TestResult implements I_TestResult {

}
export class Percentage {
  _numerator: number;
  _denominator: number;
  
  constructor(numerator: number, denominator: number) {
    this._numerator = numerator;
    this._denominator = denominator;
  }
  
  getPct(): number {
    return this._numerator/ this._denominator;
  }
}

/**
 * I eventually want to do what I did with tests4j.adligo.org
 * which is to keep track of code coverage file by file.  It should be 
 * much simpler in JavaScript since it's a single thread, however it's going to be somewhat 
 * repetative the way the c8 tool works.  Perhaps I can figure out a way to fork processes
 * to do it concurrently after I have mutiple files to test this way at once... hmm
 */
export class SourceFileCoverage {
  _sourceFileName: string;
  //TODO
  
}

/**
 * 
 */
export class SourceFileCoverageSettings {
  _sourceFileName: string;
  _thresholdExpectations?: SourceFileCoverageThresholdExpectations;
  //TODO
}

/**
 * 
 */
export class SourceFileCoverageThresholdExpectations {
  _sourceFileName: string;
  //TODO
  
}