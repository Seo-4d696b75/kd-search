/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/

console.log("index.ts");
var num = +process.argv[2];
console.log(fizzbuzz(num));
function fizzbuzz(num) {
    if (num % 15 == 0) {
        return "FizzBuzz";
    }
    else if (num % 3 == 0) {
        return "Fizz";
    }
    else if (num % 5 == 0) {
        return "Buzz";
    }
    return num.toString();
}

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2tkLW5lYXJlc3Qtc2VhcmNoLy4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5jb25zb2xlLmxvZyhcImluZGV4LnRzXCIpO1xyXG52YXIgbnVtID0gK3Byb2Nlc3MuYXJndlsyXTtcclxuY29uc29sZS5sb2coZml6emJ1enoobnVtKSk7XHJcbmZ1bmN0aW9uIGZpenpidXp6KG51bSkge1xyXG4gICAgaWYgKG51bSAlIDE1ID09IDApIHtcclxuICAgICAgICByZXR1cm4gXCJGaXp6QnV6elwiO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobnVtICUgMyA9PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiRml6elwiO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobnVtICUgNSA9PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiQnV6elwiO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bS50b1N0cmluZygpO1xyXG59XHJcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==