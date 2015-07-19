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
```
