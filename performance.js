"use strict";
var data = { };
var startDate = new Date();

module.exports = function(runner) {
  runner.on("start", function() {
    startDate = new Date();
  });
  runner.on('fail', function(test, err, a){
    console.log("Tests Fail! Aborting performance test.");
    console.log(err.stack);
    process.exit(1);
  });
  runner.on("end", function() {
    console.log(JSON.stringify({
      totalTime: ((new Date()) - startDate),
      functions: Object.keys(data).map(function(funcUri) {
        var record = data[funcUri];
        Object.keys(record.durations).forEach(function(i) {
          if (!(record.durations[i] instanceof Array)) return;
          record.durations[i] = minMaxAverage(record.durations[i]);
          if (!(record.optimised instanceof Array)) return;
          record.optimised = uniq(record.optimised);
        });
        return data[funcUri];
      }).sort(function(a, b) {
        return b.callCount - a.callCount;
      })
    }, null, 2));
  });
};

var Module = require('module').Module.prototype;
var orig = Module._compile;
Module._compile = function(code, filePath) {
  var compiled = orig.call(this, code, filePath);
  filePath = filePath.split(process.cwd()).pop();
  if (filePath.indexOf("node_modules") !== -1) return;
  instrument(filePath, this.exports);
};

var instrument = function(path, obj) {
  for (var i in  obj) {
    if (!(typeof obj[i] === "function")) continue;
    infectFunction(obj, i, path + ":exports." + i);
  }
};

var infectFunction = function(item, prop, funcUri) {
  var original = item[prop];
  var callCount = 0;

  data[funcUri] = {
    path: funcUri,
    callCount: 0,
    optimised: [ ],
    durations: { }
  };

  item[prop] = function() {
    return (function() {
      var functionInvokedAt = meaningfulTime();
      var functionArgs = Array.prototype.slice.call(arguments);
      var self = this;

      if (callCount > 0) {
        %OptimizeFunctionOnNextCall(original);
      }

      var newFunctionArgs = functionArgs.map(function(arg) {
        if (!(arg instanceof Function)) return arg;
        return function() {
          emitData(funcUri, "callback-" + functionArgs.indexOf(arg), timeDiff(meaningfulTime(), functionInvokedAt));
          return arg.apply(this, Array.prototype.slice.call(arguments));
        };
      });

      var out = original.apply(self, newFunctionArgs);

      if (callCount > 0) {
        switch(%GetOptimizationStatus(original)) {
          case 1: data[funcUri].optimised.push("Yes"); break;
          case 3: data[funcUri].optimised.push("Always"); break;
          case 2: data[funcUri].optimised.push("No"); break;
          case 4: data[funcUri].optimised.push("Never"); break;
          case 6: data[funcUri].optimised.push("Maybe"); break;
          default: data[funcUri].optimised.push("?"); break;
        }
      }

      callCount++;
      emitData(funcUri, "return", timeDiff(meaningfulTime(), functionInvokedAt));
      return out;
    }).apply(this, Array.prototype.slice.call(arguments));
  };

  var dependencies = original.toString().match(/^function .*?\((.*?)\)/);
  if (dependencies) {
    var newFunc = item[prop].toString();
    newFunc = '(function() { return '+newFunc.replace('function ()', 'function ('+dependencies[1]+')')+ '; })()';
    try {
      item[prop] = eval(newFunc);
    } catch(e) { }
  }

  item[prop].prototype = original.prototype;
};

var timeDiff = function(newest, oldest) {
  var diff = (parseFloat(newest) - parseFloat(oldest));
  if (diff < 0) {
    diff = ((10000 + parseFloat(newest)) - parseFloat(oldest));
  }
  return parseFloat(diff.toFixed(2));
};

var meaningfulTime = function() {
  var parts = process.hrtime();
  return (((parts[0]*1000)+(parts[1]/1000000))%10000).toFixed(2) + 'ms';
};

var emitData = function(funcUri, argIndex, duration) {
  data[funcUri].callCount++;
  data[funcUri].durations[argIndex] = data[funcUri].durations[argIndex] || [ ];
  data[funcUri].durations[argIndex].push(duration);
};

var minMaxAverage = function(list) {
  var min = 999999;
  var max = 0;
  var sum = 0;

  list.forEach(function(i) {
    if (i < min) min = i;
    if (i > max) max = i;
    sum += i;
  });

  var average = sum / list.length;

  return {
    min: min.toFixed(2),
    average: average.toFixed(2),
    max: max.toFixed(2),
    totalTime: sum.toFixed(2)
  };
};

var uniq = function(list) {
  return list.reduce(function(all, item) {
    all[item] = all[item] || 0;
    all[item]++;
    return all;
  }, { });
};
