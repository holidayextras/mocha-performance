# mocha-performance



Install the module:
```
$ npm install mocha-performance
```

Add an npm-script to your project (and correct the path to your tests!):
```javascript
{
  "scripts": {
    "performance": "node --allow-natives-syntax ./node_modules/mocha/bin/_mocha --reporter mocha-performance ./test/**/*.js",
  }
}
```

Generate performance statistics:
```
$ npm run performance

> jsonapi-server@0.8.0 performance /home/ninj4/repos/jsonapi-server
> node --allow-natives-syntax --harmony ./node_modules/mocha/bin/_mocha --reporter mocha-performance ./test/*.js

{
  "totalTime": 797,
  "functions": [
    {
      "path": "/lib/responseHelper.js:exports._generateLink",
      "callCount": 404,
      "optimised": {
        "No": 368,
        "Yes": 35
      },
      "durations": {
        "return": {
          "min": "0.00",
          "average": "0.06",
          "max": "2.21",
          "totalTime": "22.79"
        }
      }
    },
    ...
  ]
}
```
