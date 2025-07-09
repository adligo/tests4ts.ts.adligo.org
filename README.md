# tests4j.ts.adligo.org
A small portion of the Tests4j code implemented in Typescript directly.

## Working Example Usage

[tests4ts_example](https://github.com/adligo/tests4ts_example.ts.adligo.org)

## Install dependencies with npm as usual;
```
npm install @ts.adligo.org/i_io --save-dev
npm install @ts.adligo.org/i_obj --save-dev
npm install @ts.adligo.org/i_strings --save-dev
npm install @ts.adligo.org/i_tests4ts_types --save-dev
npm install @ts.adligo.org/i_tests4ts --save-dev
npm install @ts.adligo.org/junit-xml-tests4j --save-dev
npm install @ts.adligo.org/tests4ts --save-dev
npm install @ts.adligo.org/type-guards --save-dev
npm install @ts.adligo.org/junit-xml-tests4j --save-dev
```

## Import Into Your Code

```
import { I_AssertionContext } from "@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs";
import { ApiTrial } from '@ts.adligo.org/tests4ts/dist/trials.mjs';
import { TrialSuite, TrialSuiteParams } from '@ts.adligo.org/tests4ts/dist/tests4ts.mjs';
import { JUnitXmlGenerator } from '@ts.adligo.org/junit-xml-tests4j/dist/junitXmlTests4jGenerator.mjs'
```

## Write your first TrialSuite, ApiTrial and Test
```
console.log('starting tests');

export class MyApiTrial extends ApiTrial {
  //note we use Java style namespaces for backward integration with JUnits Jenkins Plugin 
  public static readonly CLAZZ_NAME = "com.example.MyApiTrial";
  
  constructor() {
    super(MyApiTrial.CLAZZ_NAME)
  }
  
  testSomething(ac: I_AssertionContext) {
    console.log('in testSomething');    
    as.isTrue(false,'This should be True!');  
  }
}

new TrialSuite('Your TrialSuite Name',[
  new ApiTrial()
]).run();
// or
//.run().printTextReport().printTestReportFiles(new JUnitXmlGenerator());
console.log('tests finished');

```




# Run the TypeScript Compile (creates a bin and dist folder)

```
 npm run tsc
```
 
# Test this Project, Compile and Deploy;

This is done in a matrix style build system either from
[fab_docker](https://github.com/adligo/fab_docker.ts.adligo.org)
or
[slink_docker](https://github.com/adligo/slink_docker.ts.adligo.org)

## Deploy 
 This command deploys, after you have logged in to  https://registry.npmjs.org/;

 ```
 npm publish --access public
 ```
