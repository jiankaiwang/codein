/*
 * desc : quick view to Swift language
 * docv : 0.1.0
 * plat : CodeIn
 * swif : 5.1.3
 */
 
/*
 * eg.1 : variable declearation and basic operators
 * note :
 * |- let is different from var in declearing a variable
 * |- string concatenation operator is +
 */
var start = 1
let end = 20
var sumFromStartToEnd : Int = 0
sumFromStartToEnd = ((start + end) * 20) / 2

let resLabel = "eg.1 : Sum calculating from 1 to 20 is "
print(resLabel + String(sumFromStartToEnd) + ".")

/*
 * eg.2 : data types in array and dictionary, the loop and the branch control
 * note :
 * |- 1...100 : a loop starting from 1 to 100 (1 <= ... <= 100)
 * |- loop control : continue / break
 * |- append a element to a array
 * |- how to import libraries : import Foundation for Mathematics
 * |- how to use function : sqrt()
 * |- data type transformation : Int(), Double()
 */
var oddNumberUnder100 = [Int]()
oddNumberUnder100.append(2)

import Foundation
var stopNum : Int = 1
var ttlNumerator : Int = 1
for num in 3...100 {
    if num % 2 == 0 {
        continue
    }
    ttlNumerator = 1
    stopNum = Int(floor(sqrt(Double(num))))
    for oddItem in oddNumberUnder100 {
        if oddItem > stopNum {
            break
        }
        if num % oddItem == 0 {
            ttlNumerator += 1
            break
        }
    }
    if ttlNumerator == 1 {
        oddNumberUnder100.append(num)
    }
}
print("eg.2 : All odd numbers between 2 and 100 are ")
print(oddNumberUnder100)

/*
 * eg.3 : function call for the fibonacci series
 * note :
 * |- passed parameters with defined data type, e.g. fn1 : Int
 * |- passed parameters in caller are still with data type, e.g. fn2 : 1
 * |- \() used in the print message
 */
func fibonacci(fn1 : Int, fn2 : Int, n : Int) -> Int {
    if n == 0 {
        return fn1
    } else {
        return fibonacci(fn1 : fn2, fn2 : fn1 + fn2, n : n-1)
    }
}
print("eg.3 : Fibonacci series beginning from 0, 1 by step 20 is \(fibonacci(fn1 : 0, fn2 : 1, n : 20)).")


