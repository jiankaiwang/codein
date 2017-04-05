<?php

# import necessary library
require("CRUD.php");

class REQUESTMETHOD {

    # ----------------------------------
    # private
    # ----------------------------------
    private $github_app_secretkey;
    private $github_user_agent;
    private $serverInfo; 
    private $method;
    private $response;

    #
    # desc : returned information
    #
    private function stdRet($getState, $getInfo, $getData) {
        $this -> response = array("state" => $getState, "info" => $getInfo, "data" => $getData);
        echo $this -> responseBack("json");
        return ;
    }

    #
    # desc : get github access token
    #
    private function github_auth_token() {
        global $_POST;

        $accessToken = new CRUD(
            "https://github.com/login/oauth/access_token",
            "POST",
            array(
                "Content-type" => "application/json"
            ),
            array(
                "client_id" => $_POST['clientid'],
                "client_secret" => $this -> github_app_secretkey,
                "code" => $_POST['code'],
                "redirect_uri" => $_POST['redirect_uri']
            )
        );

        $execRes = json_decode($accessToken -> response("json"));

        # process reporting is correct
        if($execRes -> {'state'} == "success") {
            $this -> stdRet(
                "success",
                "Get the response from github.",
                $execRes -> {'data'}
            );
        } else {
            $this -> stdRet("failure", "Geting access token fails.", "");
        }
 
    }

    #
    # desc : current authorized username
    #
    private function githubAuthUsername() {
        global $_POST;

        $access = new CRUD(
            "https://api.github.com/user",
            "GET",
            array(
                "Content-type" => "application/json",
                "Authorization" => $_POST['Authorization'],
                "User-Agent" => $this -> github_user_agent
            ),
            array()
        );

        $execRes = json_decode($access -> response("json"));

        # process reporting is correct
        if($execRes -> {'state'} == "success") {
            $this -> stdRet(
                "success",
                "Get authenticated user response from github.",
                $execRes -> {'data'}
            );
        } else {
            $this -> stdRet("failure", "Geting access token fails.", "");
        }

    }

    #
    # desc : list user gists on github
    # inpt :
    # |- options : {head | hierarchy}
    #
    private function github_list_user_gist($options) {
        global $_POST;

        switch($options) {
            default:
            case "head":
                $listFiles = new CRUD(
                    "https://api.github.com/gists",
                    "GET",
                    array(
                        "Authorization" => $_POST["Authorization"],
                        "Content-type" => "application/json",
                        "User-Agent" => $this -> github_user_agent
                    ),
                    array(
                        "since" => "1970-01-01T00:00:00Z"
                    )
                );
                break;
            case "hierarchy":
                $listFiles = new CRUD(
                    "https://api.github.com/gists/".$_POST["id"],
                    "GET",
                    array(
                        "Authorization" => $_POST["Authorization"],
                        "Content-type" => "application/json",
                        "User-Agent" => $this -> github_user_agent
                    ),
                    array()
                );
                break;
            case "singleversion":
                $listFiles = new CRUD(
                    "https://api.github.com/gists/".$_POST["id"]."/".$_POST["vid"],
                    "GET",
                    array(
                        "Authorization" => $_POST["Authorization"],
                        "Content-type" => "application/json",
                        "User-Agent" => $this -> github_user_agent
                    ),
                    array()
                );
                break;
        }

        $execRes = json_decode($listFiles -> response("json"));

        # process reporting is complete
        if($execRes -> {'state'} == "success") {

            $allGists = json_decode($execRes -> {'data'});

            switch($options) {
                case "head":
                    $infoMsg = "Receiving all gists infomarion ";
                    break;

                case "hierarchy":
                    $infoMsg = "Receiving hierarchy gists information ";
                    break;

                case "singleversion":
                    $infoMsg = "Receiving a gist version information ";
                    break;
            }
        
            try {

                $this -> stdRet(
                    "success",
                    $infoMsg."succeeded.",
                    $allGists
                );
            
            } catch (Exception $e) {

                $this -> stdRet(
                    "failure",
                    $infoMsg."failed.",
                    $e -> getMessage()
                );

            }

 
        } else {
            $this -> stdRet("failure", "Can not list a user's gist.", "");
        }   

        return ; 
    }

    #
    # desc : create a gist to the github
    #
    private function github_create_gist() {
        global $_POST;

        $createGist = new CRUD(
            "https://api.github.com/gists",
            "POST",
            array(
                "Authorization" => $_POST["Authorization"],
                "Content-type" => "application/json",
                "User-Agent" => $this -> github_user_agent
            ),
            array(
                "description" => $_POST["description"],
                "public" => $_POST["public"],
                "files" => array(
                    $_POST["filename"] => array(
                        "content" => $_POST["content"]
                    )
                )
            )
        );

        $execRes = json_decode($createGist -> response("json"));

        # process reporting is correct
        if($execRes -> {'state'} == "success") {
            $this -> stdRet(
                "success",
                "Receiving response from github succeeded.",
                $execRes -> {'data'}
            );
        } else {
            $this -> stdRet(
                "failure", 
                "Receving the github response fails.", 
                ""
            );
        }
        
    }

    #
    # desc : fetch gist content
    #
    private function github_fetch_content() {
        global $_POST;
        $fetchUrl = "";

        switch($_POST['option']) {
            case "url":
                $fetchUrl = $_POST["rawurl"];
                break;
            case "component":
                $fetchUrl = "https://gist.githubusercontent.com/".$_POST['login']."/".$_POST['gistid']."/raw/".$_POST['gistversion']."/".$_POST['filename'];
                break;
        }

        $fetchGist = new CRUD(
            $fetchUrl,
            "GET",
            array(
                "Authorization" => $_POST["Authorization"],
                "Content-type" => "application/json",
                "User-Agent" => $this -> github_user_agent
            ),
            array()
        );

        $execRes = json_decode($fetchGist -> response("json"));

        # process reporting is correct
        if($execRes -> {'state'} == "success") {
            $this -> stdRet(
                "success",
                "Receiving content from gist succeeded.",
                $execRes -> {'data'}
            );
        } else {
            $this -> stdRet(
                "failure",
                "Receving the gist content fails.",
                ""
            );
        }    
    }

    #
    # desc : edit a gist
    #
    private function github_edit_gist() {
        global $_POST;

        $sendFiles = array();

        $sendFiles = array(
            $_POST["filename"] => array(
                "content" => $_POST["content"]
            )
        );

        if($_POST["filename"] != $_POST["old_filename"]) {
           if($_POST['deleteold'] == "delete") {
               $sendFiles[$_POST["old_filename"]] = null;
           }
        }

        $editGist = new CRUD(
            "https://api.github.com/gists/".$_POST["id"],
            "PATCH",
            array(
                "Authorization" => $_POST["Authorization"],
                "Content-type" => "application/json",
                "User-Agent" => $this -> github_user_agent
            ),
            array(
                "description" => $_POST["description"],
                "files" => $sendFiles
            )
        );

        $execRes = json_decode($editGist -> response("json"));

        # process reporting is correct
        if($execRes -> {'state'} == "success") {
            $this -> stdRet(
                "success",
                "Editing a gist succeeded.",
                $execRes -> {'data'}
            );
        } else {
            $this -> stdRet(
                "failure",
                "Editing a gist failed.",
                ""
            );
        }
    }

    #
    # desc : fork a gist
    #
    private function github_fork_gist() {
        global $_POST;

        $forkGist = new CRUD(
            "https://api.github.com/gists/".$_POST["forkid"]."/forks",
            "POST",
            array(
                "Authorization" => $_POST["Authorization"],
                "Content-type" => "application/json",
                "User-Agent" => $this -> github_user_agent
            ),
            array()
        );

        $execRes = json_decode($forkGist -> response("json"));

        # process reporting is correct
        if($execRes -> {'state'} == "success") {
            $this -> stdRet(
                "success",
                "Forking a gist succeeded.",
                $execRes -> {'data'}
            );
        } else {
            $this -> stdRet(
                "failure",
                "Forking a gist failed.",
                ""
            );
        }

    }

    #
    # desc : delete a gist
    #
    private function github_delete_gist() {
        global $_POST;

        $deleteGist = new CRUD(
            "https://api.github.com/gists/".$_POST["deleteid"],
            "DELETE",
            array(
                "Authorization" => $_POST["Authorization"],
                "Content-type" => "application/json",
                "User-Agent" => $this -> github_user_agent
            ),
            array()
        );

        $execRes = json_decode($deleteGist -> response("json"));

        # process reporting is correct
        if($execRes -> {'state'} == "success") {
            $this -> stdRet(
                "success",
                "Deleting a gist succeeded.",
                $execRes -> {'data'}
            );
        } else {
            $this -> stdRet(
                "failure",
                "Deleting a gist failed.",
                ""
            );
        }
    }

    #
    # desc : get method
    #
    private function GET() {
        global $_GET;
        $getData = array();
        foreach($_GET as $key => $value) {
            $getData[$key] = $value;
        }
        $this -> stdRet(
            "success", 
            "GET operation on CodeIn is complete.", 
            $getData
        );
        return;
    }

    #
    # desc : post method
    # inpt : (necessary)
    # |- service : {dropbox | github}
    # |- Authorization : "Basic xxxxoooo"
    # |- operation :
    #   |- dropbox : {list_folder | download | save}
    #
    private function POST() {
        global $_POST;
        if(
            array_key_exists("service", $_POST) &&
            strlen($_POST["service"]) > 0 && 
            array_key_exists("Authorization", $_POST) && 
            strlen($_POST["Authorization"]) > 0 &&
            array_key_exists("operation", $_POST) &&
            strlen($_POST["operation"]) > 0
        ) {
            switch($_POST["service"]) {
                case "github":
                    switch($_POST["operation"]) {
                        case "auth_token":
                            # generate authorization token
                            $this -> github_auth_token();
                            break;
                        case "get_username":
                            $this -> githubAuthUsername();
                            break;
                        case "list_user_gist":
                            $this -> github_list_user_gist("head");
                            break;
                        case "create_gist":
                            $this -> github_create_gist();
                            break;
                        case "get_single_gist":
                            $this -> github_list_user_gist("hierarchy");
                            break;
                        case "fetch_content":
                            $this -> github_fetch_content();
                            break;
                        case "edit_gist":
                            $this -> github_edit_gist();
                            break;
                        case "single_version":
                            $this -> github_list_user_gist("singleversion");
                            break;
                        case "fork_gist":
                            $this -> github_fork_gist();
                            break;
                        case "delete_gist":
                            $this -> github_delete_gist();
                            break;
                        default:
                            $this -> stdRet("failure","Post parameters are error. (Dropbox has no such operation.)", "");
                            break;
                    }
                    break;
                case "github":
                    break;
                default:
                    $this -> stdRet("failure", "Post parameters are error. (no such service)", "");
                    break;
            } 
        } else {
            $this -> stdRet("failure", "Post parameters are error. (Either service, Authorization or operation is error.)", "");
        }
        return;
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
        $this -> response = array();

        # set up the github config
        $this -> github_app_secretkey = '1ec39632a7f01478662fe161edfd8efc1cb84aac';
        $this -> github_user_agent = "CodeIn";      

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
    # desc : return response
    #
    public function responseBack($format) {
        switch(strtolower($format)) {
            case "json":
                echo json_encode($this -> response);
                break;
            default:
                echo $this -> response;
                break;
        }
    }

} // end of class

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
$obj = new REQUESTMETHOD($_SERVER);
?>
