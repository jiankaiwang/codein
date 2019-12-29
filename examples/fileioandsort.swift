/* 
 * desc : File operations and Algorithms
 * docv : 0.0.1
 * plat : CodeIn
 * swif : 3.0.2
 */

// import necessary library
#if os(OSX) || os(iOS)
    import Darwin
#else
    import Glibc
#endif

/*
 * eg.1 : Write out the test data as the input for next example
 * |- touch a file in command
 * |- fopen(name, mode) /w fclose
 * |- fwrite(data, unit, size, stream)
 */
let filename = "test.txt"
system("touch \(filename)")
let fout = fopen(filename, "w")
let data = "1,3,4,7,-1,5,-10,2,-6,8"

// write out the data
fwrite(data, 1, String(data).count, fout)
fclose(fout)

// output the data
system("echo 'Data content is :'")
system("cat \(filename)")
print("\n")

/*
 * eg.2 : Read the file and Sort the test data
 * note :
 * |- fgetc() : char-based input
 * |- numberStr.components(separatedBy: char) : split a string
 * |- sorted(by: anonymous function)
 */
// Create a FileHandle instance
import Foundation

let stream = fopen(filename, "r")
var input = ""
var numberStr = ""

while true {
    let ch = fgetc(stream)
    if ch == -1 {
        break
    }
    input = String(Character(UnicodeScalar(UInt32(ch))!))
    numberStr = numberStr + input
} 

// parse into each numbers in String type
let rawNumber : [String] = numberStr.components(separatedBy: ",")
var numbers = [Int]()

// data type transform and append numbers into one array
for num in rawNumber {
    numbers.append(Int(num)!)
}

// default sorting
print("Original number array : ")
print(numbers)

var sortArr = 
    numbers.sorted(by: { (n1: Int, n2: Int) -> Bool in return n1 > n2 })
print("Sorted number array : ")
print(sortArr)

