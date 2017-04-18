/* 
 * desc : File operations and System commands
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
 * desc : System commands on Ubuntu
 * note :
 * |- system()
 */
system("echo 'Current directory path is : '")
system("pwd")
