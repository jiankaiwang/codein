/* 
 * desc : File operations and System commands
 * docv : 0.1.0
 * plat : CodeIn
 * swif : 5.1.3
 */

// import necessary library
#if os(OSX) || os(iOS)
    import Darwin
#else
    import Glibc
#endif

/*
 * desc : System commands on Ubuntu
 * note :
 * |- system()
 */
system("echo 'Current directory path is : '")
system("pwd")
