<?php
class CRUD {
    # ----------------------------------
    # private
    # ----------------------------------
    private $serviceUrl; 
    private $method;
    private $header;
    private $data;
    private $response;    

    #
    # desc : return status
    # 
    private function retStatus($getStatus, $getInfo, $getData) {
        return array("state" => $getStatus, "info" => $getInfo, "data" => $getData);
    }

    #
    # desc : prepare url
    #
    private function preUsrQuery() {
        $queryStr = "";
        foreach(array_keys($this -> data) as $key) {
            if(strlen($queryStr) < 1) {
                $queryStr = "$key=".$this -> data[$key];
            } else {
                $queryStr = $queryStr."&$key=".$this -> data[$key];
            }
        }
        return $queryStr;
    }

    #
    # desc : prepare header
    #
    public function preHeader() {
        $retStr = array();
        foreach(array_keys($this -> header) as $key) {
            $headerStr = "$key:".$this -> header[$key];
            array_push($retStr, $headerStr);
        }
        return $retStr;
    }

    #
    # desc : format post field
    #
    private function formatPostField() {
        if(array_key_exists("--data-binary", $this -> data)) {
            # used in the upload process of Dropbox service
            return $this -> data["--data-binary"];
        } else if (count($this -> data) < 1) {
            return ""; 
        } else {
            return json_encode($this -> data);
        }
    }
     
    #
    # desc : get() operation
    #
    private function GET() {
        $execRes = "";

        try {

            # start the connection session
            $ch = curl_init();

            # set the connection option
            $options = array(
                CURLOPT_URL => $this -> serviceUrl."?".($this -> preUsrQuery()),
                CURLOPT_HTTPHEADER => $this -> preHeader(),
                CURLOPT_HEADER => 0,
                CURLOPT_VERBOSE => 0,
                CURLOPT_RETURNTRANSFER => 1,
                CURLOPT_HTTPGET => true,
                CURLOPT_POST => false
            );

            # the curl option
            curl_setopt_array($ch, $options);

            # execute to fetch the web content
            $execRes = curl_exec($ch);

            # close the connection session
            curl_close($ch);        

            $this -> response = $this -> retStatus("success", "GET complete.", $execRes);

        } catch (Exception $e) {

            $execRes = $e -> getMessage();
            $this -> response = $this -> retStatus("failure", "GET is error.", $execRes);

        }
    }

    #
    # desc : POST() operation
    #
    private function POST() {

        $execRes = "";
    
        try {

            # start the curl functino
            $ch = curl_init();

            # the context body
            $options = array(
                CURLOPT_URL => $this -> serviceUrl,
                CURLOPT_HTTPHEADER => $this -> preHeader(),
                CURLOPT_HEADER => 0,
                CURLOPT_VERBOSE => 0,
                CURLOPT_RETURNTRANSFER => 1,
                CURLOPT_HTTPGET => false,
                CURLOPT_POST => true,
                # modify as json_encode due to content-type change
                CURLOPT_POSTFIELDS => $this -> formatPostField()
            );

            # the curl option
            curl_setopt_array($ch, $options);

            # get curl result
            $execRes = curl_exec($ch);

            # end and close session
            curl_close($ch);

            $this -> response = $this -> retStatus("success", "POST complete.", $execRes);

        } catch (Exception $e) {
            
            $execRes = $e -> getMessage();
            $this -> response = $this -> retStatus("failure", "POST is error.", $execRes);

        }

    }

    # 
    # desc : PUT() or DELETE() function
    # inpt :
    # |- $option : { PUT | DELETE | PATCH }
    # 
    private function PUTorDELorPATCH($option) {
        
        $execRes = "";

        try {

            # start the curl functino
            $ch = curl_init();

            # the context body
            $options = array(
                CURLOPT_URL => $this -> serviceUrl,
                CURLOPT_HTTPHEADER => $this -> preHeader(),
                CURLOPT_CUSTOMREQUEST => $option,
                CURLOPT_HEADER => 0,
                CURLOPT_VERBOSE => 0,
                CURLOPT_RETURNTRANSFER => 1,
                CURLOPT_HTTPGET => false,
                CURLOPT_POST => false,
                CURLOPT_POSTFIELDS => $this -> formatPostField()
            );

            # the curl option
            curl_setopt_array($ch, $options);

            # get curl result
            $execRes = curl_exec($ch);

            # end and close session
            curl_close($ch);

            $this -> response = $this -> retStatus("success", "$option complete.", $execRes);

        } catch (Exception $e) {

            $execRes = $e -> getMessage();
            $this -> response = $this -> retStatus("failure", "$option is error.", $execRes);

        }

    }

    #
    # desc : constructor
    # inpt : 
    # |- sendUrl : server url, e.g. http://test.php
    # |- getMethod : { GET|POST|PUT|DELETE }
    # |- getHeader : array("auth" => "authVal")
    # |- getData : array("opt" => "val")
    #
    public function __construct($sendUrl, $getMethod, $getHeader, $getData)
    {
        if(!
            (is_string($sendUrl) 
            and is_string($getMethod) 
            and is_array($getHeader) 
            and is_array($getData))
        ) {
            $this -> response("failure", "Input parameters are not correct.", "");    
            
        } else {

            $this -> serviceUrl = $sendUrl;
            $this -> method = strtoupper($getMethod);
            $this -> header = $getHeader;
            $this -> data = $getData;      
  
            # beginning passing request
            switch($this -> method) {
                default:
                case "GET":
                    $this -> GET();
                    break;
                case "POST":
	            $this -> POST();
                    break;
                case "PUT":
                case "DELETE":
                case "PATCH":
                    $this -> PUTorDELorPATCH($this -> method);
                    break;
            }
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

}
?>
