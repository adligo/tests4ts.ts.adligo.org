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
import {I_Out} from '@ts.adligo.org/i_io/dist/i_io.mjs';
import {I_Named} from '@ts.adligo.org/i_strings/dist/i_strings.mjs';
import {TestResult, TestResultParams} from "./results.mjs";
import {
  I_AssertionContext,
  I_AssertionContextConsumer, I_AssertionContextFactory,
  I_FileConverter,
  I_Runnable,
  I_Test,
  I_TestResult, I_TestResultFactory,
  I_Trial
} from "@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs";
import {AssertionContext} from "./assertions.mjs";

//Hack to fix the formatting in WebStorms console?
process.env.LC_CTYPE='UTF-8';
//</slinks>

function out(message: string ) {
  console.count(message);
}

export class DefaultAssertionContextFactory implements I_AssertionContextFactory {
  newAssertionContext(): I_AssertionContext {
    return new AssertionContext();
  }
}

export class DefaultTestResultFactory implements I_TestResultFactory {
    newTestResult(assertionCount: number, test: I_Test): I_TestResult {
        return new TestResult(new TestResultParams(assertionCount, test));
    }
    newTestResultFailure(assertionCount: number, test: I_Test, errorMessage: string): I_TestResult {
      return new TestResult( new TestResultParams(assertionCount, test), false, errorMessage);
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
export class Test implements I_Test {
  private _acConsumer: I_AssertionContextConsumer;
  private _name: string;
  private _ignored: boolean;

  constructor(testNameOrP: string | TestParams, assertionContextConsumer: I_AssertionContextConsumer) {
    if (testNameOrP instanceof TestParams) {
      let params = testNameOrP as TestParams;
      this._name = params.getName();
      this._ignored = params.isIgnored();
    } else {
      this._name = testNameOrP as string;
    }

    this._acConsumer = assertionContextConsumer;
  }

  getName() {
    return this._name;
  }

  ignore(): Test {
    this._ignored = true;
    return this;
  }

  isIgnored() {
    return this._ignored;
  }

  run(assertionCtx: I_AssertionContext) {
    this._acConsumer(assertionCtx);
  }
}

export class TrialSuiteParams implements  I_Named {
  public static of(trialSuiteName: string): TrialSuiteParams {
    return new TrialSuiteParams();
  }
  private _assertionContextFactory?: I_AssertionContextFactory;
  private _trialSuiteName: string;
  private _testResultFactory: I_TestResultFactory;


  public getName() {
    return this._trialSuiteName;
  }
  public getAssertionContextFactory(): I_AssertionContextFactory | undefined {
    return this._assertionContextFactory;
  }

  public getTestResultFactory(): I_TestResultFactory | undefined {
    return this._testResultFactory;
  }

  public withAssertionContextFactory(assertionContextFactory: I_AssertionContextFactory): TrialSuiteParams {
    this._assertionContextFactory = assertionContextFactory;
    return this;
  }

  public withTestResultFactory(testResultFactory: I_TestResultFactory): TrialSuiteParams {
    this._testResultFactory = testResultFactory;
    return this;
  }
}
/**
 * To see how-to / usage go to https://github.com/adligo/tests4j.ts.adligo.org
 */
export class TrialSuite {
  private _assertionContextFactory: I_AssertionContextFactory;
  private _name: string;
  private _out: I_Out;
  private _trials: I_Trial[];
  private _testResultFactory: I_TestResultFactory;


  constructor(trialSuiteNameOrP: string | TrialSuiteParams, trials: I_Trial[], out? : I_Out) {
    if (trialSuiteNameOrP instanceof TrialSuiteParams) {
      let params = trialSuiteNameOrP as TrialSuiteParams;
      this._assertionContextFactory = params.getAssertionContextFactory();
      this._name = params.getName();
      this._testResultFactory = params.getTestResultFactory();
    } else {
      this._name = trialSuiteNameOrP as string;
    }
    if (this._assertionContextFactory == undefined) {
      this._assertionContextFactory = new DefaultAssertionContextFactory();
    }
    if (this._testResultFactory == undefined) {
      this._testResultFactory = new DefaultTestResultFactory();
    }
    this._trials = trials;
    if (out == undefined) {
     this._out = (s) => console.log(s);
    } else {
      this._out = out;
    }
  }

  public run(): TrialSuite {
    this._out('TrialSuite: run ' + this._name);
    let funAll = async () => {
      let funs : Function[] = new Array(this._trials.length);
      for (var i =0; i < this._trials.length; i++) {
        let t: I_Trial = this._trials[i];
        funs[i] = t.run(this._assertionContextFactory,
            this._testResultFactory);
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
    var summaryMessage = '\n\n\n---------------------  Test Results -----------------------';
    this._trials.forEach(t => {
      this._out('\t' + t.getName() + ' ' + this._name);
      ta += t.getAssertionCount();
      tf += t.getFailureCount();
      tt += t.getTestCount();
      ti += t.getIgnored();
      summaryMessage += '\n\t\tAssertions: ' + t.getAssertionCount();
      summaryMessage += '\n\t\tFailures: ' + t.getFailureCount();
      summaryMessage += '\n\t\tTests: ' + t.getTestCount();
      if (t.getFailureCount() != 0) {
        t.getTestResults().forEach(r => {
          if ( !r.isPass()) {
            summaryMessage += '\n\t\t\t' + r.getName() + " : " + r.getErrorMessage();
          }
        });
      }
    });
    summaryMessage += '\n\n\nTotal for ' + this._trials.length + " Trials ";
    summaryMessage += '\n\tAssertions: ' + ta;
    summaryMessage += '\n\tFailures: ' + tf;
    summaryMessage += '\n\tIgnored: ' + ti;
    summaryMessage += '\n\tTests: ' + tt;
    this._out(summaryMessage);
    return this;
  }

  createDir(dirPath: string) {
    const absolutePath = path.resolve(dirPath); // Resolve to an absolute path
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true }); // Create directory, including parent directories if they don't exist
    }
  }

  createFile(filePath: string, content: string) {
    const absolutePath = path.resolve(filePath);
    const dirPath = path.dirname(absolutePath);
    this.createDir(dirPath); // Ensure directory exists before creating file
    fs.writeFileSync(absolutePath, content);
  }

  printTestReportFiles(converter: I_FileConverter): TrialSuite  {
    this.createDir('build');
    this.createDir('build/test-reports');
    this._trials.forEach(t => {
      var fname : string = 'build/test-reports/' + t.getName() + '.' + converter.getFileNameExtension();
      console.log("creating file " + fname);
      var xmlString: string = converter.convert(t);
      this.createFile(fname, xmlString);
    });
    return this;
  }
}