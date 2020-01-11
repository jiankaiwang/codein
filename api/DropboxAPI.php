<?php

# import necessary library
require("CRUD.php");

class REQUESTMETHOD {

  # ----------------------------------
  # private
  # ----------------------------------
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
  # desc : dropbox list_folder
  #
  private function dropbox_list_folder() {
    global $_POST;
    $listFiles = new CRUD(
      "https://api.dropboxapi.com/2/files/list_folder",
      "POST",
      array(
        "Authorization" => $_POST["Authorization"],
        "Content-type" => "application/json"
      ),
      array(
        "path" => "",
        "recursive" => false,
        "include_media_info" => false,
        "include_deleted" => false,
        "include_has_explicit_shared_members" => false
      )
    );

    $execRes = json_decode($listFiles -> response("json"));
    $listArray = array();

    # process reporting is complete
    if($execRes -> {'state'} == "success") {

      try {
        # dropbox response is also correct
        $resList = json_decode($execRes -> {'data'}) -> {'entries'};

        for($i = 0 ; $i < count($resList) ; $i++) {
          $tmp = array(
            "name" => $resList[$i] -> {'name'}, 
            "path_display" => $resList[$i] -> {'path_display'},
            "client_modified" => $resList[$i] -> {'client_modified'},
            "id" => $resList[$i] -> {'id'}
          );
          array_push($listArray, $tmp);
        }
        
        $this -> stdRet(
          "success", 
          "Listing dropbox folder is complete.", 
          $listArray
        );
      } catch (Exception $e) {
        # dropbox response is error occuring
        $this -> stdRet(
          "failure",
          "Listing dropbox folder is failure.",
          $e -> getMessage()
        );
      }

 
    } else {
      $this -> stdRet("failure", "Can not decode Dropbox result.", "");
    }   

    return ; 
  }

  #
  # desc : dropbox search function
  # retn : 
  # |- 0 : not found
  # |- 1 : existing
  # |- -1 : error
  # 
  private function dropbox_search() {
    global $_POST;

    $searchFiles = new CRUD(
      "https://api.dropboxapi.com/2/files/search",
      "POST",
      array(
        "Authorization" => $_POST["Authorization"],
        "Content-type" => "application/json"
      ),
      array(
        "path" => "",
        "query" => $_POST["filename"],
        "start" => 0,
        "max_results" => 100,
        "mode" => "filename"
      )
    );

    $execRes = json_decode($searchFiles -> response("json"));
    $listArray = array();

    # process reporting is correct
    if($execRes -> {'state'} == "success") {
      
      try {
        # dropbox response is also correct
        $resList = json_decode($execRes -> {'data'}) -> {'matches'};

        if(count($resList[0]) > 0) {
          return 1;
        } else {
          return 0;
        }
      } catch (Exception $e) {
        # dropbox response reports error occuring
        return -1;
      }
    } else {
      return -1;
    }
  }

  #
  # desc : upload the file
  # inpt :
  # |- $uploadMode : {add | overwrite}
  #
  private function dropbox_upload($uploadMode) {
    global $_POST;

    $uploadPath = "/tmp/".$_POST["filename"];

    # write into file first
    $fwriter = fopen($uploadPath, "w");
    fwrite($fwriter, $_POST["code"]);
    fclose($fwriter);

    $uploadFiles = new CRUD(
      "https://content.dropboxapi.com/2/files/upload",
      "POST",
      array(
        "Authorization" => $_POST["Authorization"],
        "Content-Type" => "application/octet-stream",
        "Dropbox-API-Arg" => json_encode(array(
          "path" => '/'.$_POST["filename"],
          "mode" => $uploadMode,
          # overwriting file would be the same name
          "autorename" => true,
          # user does not receive any notification while uploading
          "mute" => true
        ))
      ),
      array("--data-binary" => $_POST['code'])
    );

    $execRes = json_decode($uploadFiles -> response("json"));
    $listArray = array();

    # delete the file after uploading to the dropbox
    $rmRes = shell_exec("rm $uploadPath");

    if($execRes -> {'state'} == "success") {
      # send back to the front browser to parsing the dropbox response
      $this -> stdRet("success", "Uploading file is complete.", $execRes);
    } else {
      $this -> stdRet("failure", "Uploading file is not complete.", "");
    }
  }

  #
  # desc : save to the dropbox function
  #
  private function dropbox_save() {
    switch($this -> dropbox_search()) {
      case 1:
        # overwrite the file while it is existing
        $this -> dropbox_upload("overwrite");
        break;
      case 0:
        # create a new file
        $this -> dropbox_upload("add");
        break;
      case -1:
        $this -> stdRet("failure", "Searching file is not complete.", "");
        break;
    }
  }

  #
  # desc : download a file on dropbox service
  #
  private function dropbox_download_exec() {
    global $_POST;

    $uploadFiles = new CRUD(
      "https://content.dropboxapi.com/2/files/download",
      "POST",
      array(
        "Authorization" => $_POST["Authorization"],
        "Content-type" => "",
        "Dropbox-API-Arg" => json_encode(array(
          "path" => '/'.$_POST["filename"]
        ))
      ),
      array()
    );

    $execRes = json_decode($uploadFiles -> response("json"));
    $listArray = array();

    if($execRes -> {'state'} == "success") {
      # send back to the front browser to parsing the dropbox response
      $this -> 
        stdRet(
          "success", 
          "Downloading file is complete.", 
          $execRes -> {'data'}
        );
    } else {
      $this -> 
        stdRet("failure", "Downloading file is not complete.", "");
    }
  }

  #
  # d : download a file on the dropbox service
  #
  private function dropbox_download() {
    switch($this -> dropbox_search()) {
      case 1:
        $this -> dropbox_download_exec();
        break;
      case 0:
        $this -> stdRet("failure", "File does not exist.", "");
        break;
      case -1:
        $this -> stdRet("failure", "Searching file fails.", "");
        break;
    }
  }

  #
  # desc : delete a file on dropbox service
  #
  private function dropbox_delete_exec() {
    global $_POST;

    $uploadFiles = new CRUD(
      "https://api.dropboxapi.com/2/files/delete",
      "POST",
      array(
        "Authorization" => $_POST["Authorization"],
        "Content-type" => "application/json"
      ),
      array("path" => '/'.$_POST["filename"])
    );

    $execRes = json_decode($uploadFiles -> response("json"));
    $listArray = array();

    if($execRes -> {'state'} == "success") {
      # send back to the front browser to parsing the dropbox response
      $this ->
        stdRet(
          "success",
          "Deleting a file is complete.",
          $execRes -> {'data'}
        );
    } else {
      $this ->
        stdRet("failure", "Deleting a file is not complete.", "");
    }
  } 

  #
  # desc : delete a file on the dropbox service
  #
  private function dropbox_delete() {
    switch($this -> dropbox_search()) {
      case 1:
        $this -> dropbox_delete_exec();
        break;
      case 0:
        $this -> stdRet("failure", "File does not exist.", "");
        break;
      case -1:
        $this -> stdRet("failure", "Searching file fails.", "");
        break;
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
  # |- service : {dropbox}
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
        case "dropbox":
          switch($_POST["operation"]) {
            case "list_folder":
              $this -> dropbox_list_folder();
              break;
            case "save":
              $this -> dropbox_save();
              break;
            case "download":
              $this -> dropbox_download();
              break;
            case "delete":
              $this -> dropbox_delete();
              break;
            default:
              $this -> stdRet("failure","Post parameters are error. (Dropbox has no such operation.)", "");
              break;
          }
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
    $this -> method = $getServer['REQUEST_METHOD'];
    $this -> response = array();

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
