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
// The following commented out xml tags with slinks will flag to the slink command line program, that these paths can be modfied
// from the slink logic instead of hard coding them like I have currently done.
//<slinks>

import {
  I_AssertionContext,
  I_AssertionContextConsumer,
  I_Eval,
  I_Test,
  I_TestFactory,
  I_TestFactoryParams,
  I_TestParams,
  I_TestRunner,
  I_Trial
} from "@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs";
import { AssertionError } from "./assertions.mjs";
import { isNull } from "@ts.adligo.org/type-guards/dist/typeGuards.mjs"

class Eval implements I_Eval {
  eval(javaScript: string): any {
    return eval(javaScript);
  }
}

export class TestParams implements I_TestParams {
  public static of(name: string) {
    let tp = new TestParams();
    tp._name = name;
    return tp;
  }

  public static isI_TestParams(o: any) {
    if (isNull(o)) {
      return false;
    } else if (isNull((o as I_TestParams).getName)) {
      return false;
    } else if (isNull((o as I_TestParams).getTestRunner)) {
      return false;
    } else if (isNull((o as I_TestParams).isIgnored)) {
      return false;
    }
    return true;

  }

  private _name: string;
  private _ignore: boolean = false;
  private _testRunner: I_TestRunner;

  public ignore(): I_TestParams {
    this._ignore = true;
    return this;
  }

  public getName() {
    return this._name;
  }
  getTestRunner(): I_TestRunner {
    return this._testRunner;
  }

  public isIgnored() {
    return this._ignore;
  }
  public withTestRunner(testRunner: I_TestRunner): I_TestParams {
    this._testRunner = testRunner;
    return this;
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
  private _testRunner: I_TestRunner;

  constructor(testNameOrP: string | I_TestParams, assertionContextConsumer?: I_AssertionContextConsumer) {
    if (TestParams.isI_TestParams(testNameOrP)) {
      let params = testNameOrP as I_TestParams;
      this._name = params.getName();
      this._ignored = params.isIgnored();
      this._testRunner = params.getTestRunner();
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

  run(assertionCtx: I_AssertionContext): void {
    if (isNull(this._testRunner)) {
      //legacy depreicated method
      this._acConsumer(assertionCtx);
    } else {
      this._testRunner.run(assertionCtx);
    }
  }
}

export class TestFactoryParams implements I_TestFactoryParams {
  /**
   * This is the class with the test methods
   */
  private _instancesWithTestMethods: any[];
  private _testNamePrefix: string = 'test';
  private _testIgnoredSuffix: string = 'Ignored';

  constructor(testPrefix?: string, testIgnoredSuffix?: string, instancesWithTestMethods?: any[]) {
    if (instancesWithTestMethods != null) {
      this._instancesWithTestMethods = instancesWithTestMethods;
    }
    if (testPrefix != null) {
      this._testNamePrefix = testPrefix;
    }
    if (testIgnoredSuffix != null) {
      this._testIgnoredSuffix = testIgnoredSuffix;
    }
  }

  getInstancesWithTestMethods(): any[] {
    if (isNull(this._instancesWithTestMethods)) {
      return [];
    }
    return this._instancesWithTestMethods;
  }

  getTestNamePrefix(): string {
    return this._testNamePrefix;
  }

  getTestIgnoredSuffix(): string {
    return this._testIgnoredSuffix;
  }
}

export class TestFactory implements I_TestFactory {
  public static getFunctionNames(o: any): string[] {
    let proto = Object.getPrototypeOf(o);
    return Object.getOwnPropertyNames(proto);
  }

  getTests(params: I_TestFactoryParams, trial: I_Trial): I_Test[] {
    let result: I_Test[] = [];
    let instances: any[] = params.getInstancesWithTestMethods();
    instances.push(trial);
    let testPrefix: string = params.getTestNamePrefix();
    let ignoredSuffix: string = params.getTestIgnoredSuffix();
    for (const inst of instances) {
      const functionNames: string[] = TestFactory.getFunctionNames(inst)
      let testsToParams: Map<string, I_TestParams> = new Map();
      for (const key of functionNames) {
        if (key.indexOf(testPrefix) == 0) {
          //testX or textXIgnored
          if (key.includes(ignoredSuffix)) {
            //testXIgnored
            let testName = key.substring(0, key.length - ignoredSuffix.length );
            if (testsToParams.has(testName)) {
              let tp: TestParams = testsToParams.get(testName) as TestParams;
              tp.withTestRunner(new TestRunner(inst, testName));
            } else {
              testsToParams.set(testName, TestParams.of(testName).ignore());
            }
          } else {
            //test
            if (testsToParams.has(key)) {
              let tp: TestParams = testsToParams.get(key) as TestParams;
              tp.withTestRunner(new TestRunner(inst, key));
            } else {
              testsToParams.set(key, TestParams.of(key).withTestRunner(new TestRunner(inst, key)));
            }
          }
        }
      }
      for (const [key, value] of testsToParams) {
        result.push(new Test(value as I_TestParams));
      }
    }
    return result;
  }

  getTestsDefault(trial: I_Trial): I_Test[] {
    return this.getTests(new TestFactoryParams(), trial);
  }
}

export class TestRunner implements I_TestRunner {
  static throwConstructorError(testInstance: any, testFunctionName: string, cause?: Error) {
    let error = new Error('Unable to find the following testMethod on the testInstance; ' +
        JSON.stringify(testInstance) + '\n\t testMethod: ' + testFunctionName)
    if (isNull(cause)) {
      throw error;
    }
    error.cause = cause;
    throw error;
  }
  _eval: I_Eval;
  _testInstance: any;
  _testFunctionName: string;

  constructor(testInstance: any, testFunctionName: any, theEval?: I_Eval) {
    if (theEval != null && theEval != undefined) {
      this._eval = theEval;
    } else {
      this._eval = new Eval();
    }
    this._testInstance = testInstance;
    this._testFunctionName = testFunctionName;
    if (isNull(testInstance)) {
      throw new Error('TestInstance must be present (not null or undefined).');
    }
    const ti = testInstance;
    let evalJavaScriptString = 'console.log(JSON.stringify(ti)); ';
    //let evalJavaScriptString = 'this._testInstance.' + this._testFunctionName + ' != undefined';
    const func = new Function("testInstance", "testInstance." + testFunctionName + " == undefined");
    try {
      if (func(testInstance)) {
        TestRunner.throwConstructorError(testInstance, testFunctionName);
      }
    } catch (e) {
      TestRunner.throwConstructorError(testInstance, testFunctionName, e);
    }
  }


  /** 
   * This has some screwy hack in it because the following code
   * <pre><code>
   * func(this._testInstance, assertionCtx);
   * </code></pre>
   * seems to always throw an exception, although it calls your code 
   * and is debuggable from WebStorm ... hmmm
   */
  run(assertionCtx: I_AssertionContext): void {
    const func = new Function("testInstance", "assertionCtx",
        " testInstance." + this._testFunctionName + "(assertionCtx); ");
    func(this._testInstance, assertionCtx);
    //let evalJavaScriptString = 'this._testInstance.' + this._testFunctionName + '(assertionCtx);';
    //this._eval.eval(evalJavaScriptString);
  }
}

/**
 * This class is for the singleTestRunner.mts
 * to trick the code into only having a single test
 */
export class TestFactoryDelegate implements  I_TestFactory {
  _trial: I_Trial;
  _testName: string;
  _testFactory: I_TestFactory = new TestFactory();

  constructor(trial: I_Trial, testName: string) {
    this._trial = trial;
    this._testName = testName;
  }

  getTests(params: I_TestFactoryParams, trial: I_Trial): I_Test[] {
      let tests: I_Test[] = this._testFactory.getTests(params, this._trial);
      let r: I_Test[] = [];
      for (const t of tests) {
        let test: I_Test = t as I_Test;
        if (test.getName() === this._testName) {
          r.push(test);
        }
      }
      return r;
  }
}