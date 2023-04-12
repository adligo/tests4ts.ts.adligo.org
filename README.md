# tests4j.ts.adligo.org
A small portion of the Tests4j code implemented in Typescript directly.

## Install with npm as usual;
```
npm install @ts.adligo.org/tests4j --save-dev
```

## Import Into Your Code
```
import {ApiTrial, AssertionContext, Test, TrialSuite} from '@ts.adligo.org/tests4j'
```
Note the convention is a tests project with slinks, but can be anywhere.

## Write your first TrialSuite, ApiTrial and Test
```
console.log('starting tests');
new TrialSuite('Your TrialSuite Name',[
  new ApiTrial('Your ApiTrial Name', [
    new Test('testSomething',(ac) => {
      console.log('in testSomething');    
      as.isTrue(false,'This should be True!');  
    })
  ])
]).run();
console.log('tests finished');

```


# Test this Project, Compile and Deploy;
Run the local tests
```
 npm run test
```
Run the TypeScript Compile (creates a bin and dist folder)
```
 npm run tsc
```
 
 ## Deploy 
 This command deploys, after you have logged in to  https://registry.npmjs.org/;
 ```
 npm publish --access public
 ```
