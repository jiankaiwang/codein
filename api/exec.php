<?php
class REQUESTMETHOD {

    # ----------------------------------
    # private
    # ----------------------------------
    private $serverInfo; 
    private $method;
    private $response;

    #
    # desc : return pid and sid as the response
    #
    private function retExecInfo($pid, $sid, $getBtime) {
        return array("pid" => $pid, "sid" => $sid, "btime" => $getBtime);
    }

    # 
    # desc : return execution result status
    #
    private function execRes($status, $res) {
        global $_GET;
        return array("status" => $status, 
            "result" => $res, 
            "btime" => $_GET["btime"],
            "runtime" => $_GET["runtime"]
        );
    }

    #
    # desc : check pid execution
    # retn :
    # |- {1 : true, 0 : false, -1 : exception}
    #
    private function isRunning($pid) {
        try {   
            # ps is to get the current process
            $result = shell_exec(sprintf("ps %d",$pid));
            if(count(preg_split("/\n/",$result)) > 2) {
                return 1;
            }
        } catch (Exception $e) {
            return -1;
        }
        return 0;
    }

    #
    # desc : get method
    #
    private function GET() {
        global $_GET;
        if (
            array_key_exists("pid", $_GET) and 
            array_key_exists("sid", $_GET) and
            array_key_exists("btime", $_GET) and
            array_key_exists("runtime", $_GET)
        ) {
            $execFile = "/tmp/".$_GET["sid"].".swift";
            $execResFile = "/tmp/".$_GET["sid"].".txt";

            switch($this -> isRunning($_GET["pid"])) {
                case 0:
                    # execution complete or no such a pid
                    if((strlen($_GET["sid"]) > 0) and 
                        file_exists($execResFile)
                    ) {
                        if(is_readable($execResFile)) {
                            # read the result
                            $freader = fopen($execResFile,"r");
                            while(!feof($freader)) {
                                $execRes .= fgets($freader)."\n";
                            }
                            fclose($freader);

                            # remove the tmp file
                            $rmRes = shell_exec("rm $execFile $execResFile");
                            $this -> response["response"] = 
                                $this -> execRes(1, $execRes);
                        } else {
                            $this -> response["response"] = 
                                $this -> execRes(0, "Still in execution.");
                        }
                    } else {
                        $this -> response["response"] = 
                            $this -> execRes(-1, "Sid is not available.");
                    }
                    break;
                case 1:
                    # execution undergoing
                    if(
                        intval(time()) <= 
                        intval($_GET["btime"]) + intval($_GET["runtime"])
                    ) {
                        $this -> response["response"] = 
                            $this -> execRes(0, "Still in execution.");
                    } else {
                        # delete the process
                        $rmRes = shell_exec("kill -9 ".$_GET["pid"]);
                        # remove the tmp data
                        $rmRes = shell_exec("rm $execFile $execResFile"); 
                        $this -> response["response"] =
                            $this -> execRes(-1, "Reach runtime limit.");
                    }
                    break;
                case -1:
                    # execution failure
                    $this -> response["response"] = 
                        $this -> execRes(
                            -1, 
                            "Exception occurs on the PID validation"
                        );
                    break;
            }
        } else if (
            array_key_exists("egcodeid", $_GET) and 
            strlen($_GET["egcodeid"]) > 0
        ) {
            # fetch example code
            $filePath = "/var/www/html/examples/".$_GET["egcodeid"].".swift";
            if(file_exists($filePath) and is_readable($filePath)) {
                $content = "";
                $freader = fopen($filePath,"r");
                while(!feof($freader)) {
                    $content .= fgets($freader)."\n";
                }
                fclose($freader);
                $this -> response["response"] = $content;
            } else {
                $this -> response["response"] = "Example file is not existing.";
            } 
        } else {
            $getData = shell_exec("swift --version");
            $this -> response["response"] = $getData;
        }
        return;
    }

    #
    # desc : post method
    #
    private function POST() {
        global $_POST;
        
        $sid = substr(hash("sha256", time()), 0, 20);
        $execFile = "/tmp/".$sid.".swift";
        $execResFile = "/tmp/".$sid.".txt";
        
        # no code body found
        if(! array_key_exists("code", $_POST) or 
           ! array_key_exists("version",$_POST)) {
            $this -> response["response"] = 
                array("Error" => "Can not find code body or version.");
            return;
        } 

        # create a temp file in /tmp/ and execute it in the shell
        # return pid (execution id) and sid (file name)
        try {

            $execPid = -1;
            $execBeginTime = 0;

            # write code body into a tmp file
            $fwriter = fopen($execFile,"w");
            fwrite($fwriter,$_POST["code"]);
	    fclose($fwriter);

            # run the swift code
            switch($_POST["lang"]) {
                default:
                case "swift":
                    switch($_POST["version"]) {
                        default:
                        case "3.0.2-Released":
                            $execPid = Shell_exec(sprintf("%s > %s 2>&1 & echo $!","/usr/bin/swift ".$execFile, $execResFile));
                            $execBeginTime = time();
                            break; 
                    }
                    break;
            }

            $this -> response["response"] = 
                $this -> retExecInfo($execPid, $sid, $execBeginTime);
            return;
        } catch (Exception $e) {
            $this -> response["response"] = $e -> getMessage();
            return;
        }
      
    }
  

    # ----------------------------------
    # public
    # ----------------------------------

    #
    # desc : constructor
    #
    public function __construct($getServer)
    {
        $this -> serverInfo = $getServer;
        $this -> method = strtoupper($getServer['REQUEST_METHOD']);
        $this -> response = array("host" => $getServer['SERVER_NAME'], "uri" => $getServer['REQUEST_URI'], "method" => $getServer['REQUEST_METHOD']);

        # get all headers
        $this -> response['header'] = array();
        foreach (getallheaders() as $name => $value) {
            $this -> response['header'][$name] = $value;
        }
        
        # beginning passing request
        switch($this -> method) {
            default:
            case "GET":
                $this -> GET();
                break;
            case "POST":
	        $this -> POST();
                break;
        }
    }

    #
    # desc : destruct
    #
    public function __destruct() {
        $this -> serverInfo = "";
        $this -> method = "";
        $this -> response = "";
    }

    #
    # desc : get response in json
    #
    public function response($format) {
        switch(strtolower($format)) {
            case "json":
            case "js":
            default:
                return json_encode($this -> response);
        }
    }

} // end of class Vegetable

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');  
$obj = new REQUESTMETHOD($_SERVER);
echo $obj->response("json");
?>
