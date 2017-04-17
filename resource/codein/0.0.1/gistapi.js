/*
 * api setting
 */
var github_app_clientId = "fd7fa72320d54551b26c";
var github_app_scope = "gist,user";
var github_app_redirect = "http://localhost:12280/index.html";
var github_auth_code = "";
var github_auth_token = "";
var gistConnector = "/api/GistAPI.php";
var github_app_username = "";
var github_app_userid = "";
var allowGistCreate = 0;
var fetchContentObj = "";
var allowGistFetchContent = 0;
var gist_edit_id = "";
var gist_edit_filename = "";
var gist_edit_desc = "";
var allowGistEdit = 0;
var allowGistFork = 0;
var gist_delete_obj = "";
var allowGistDelete = 0;
 
/*
 * desc : github OAuth /authorize
 * retn : a code used in further /oauth2/token
 */
function githubAuthorizeOnToken() {
        if(cloudAPIFlag == 0) {
            return ;
        }

	window.location.href = 
		"https://github.com/login/oauth/authorize?scope=" + github_app_scope 
		+ "&client_id=" + github_app_clientId 
		+ "&redirect_uri=" + github_app_redirect;
}

/*
 * desc : auto complete github authorization 
 * retn : 
 * |- github_auth_code (global)
 * |- github_auth_token (global)
 */
function completeGithubAuthorization() {

	// get github code
	var getCode = $.getUrlVar("code");
	if(github_auth_code.length < 1 && getCode.length > 0)  {
		github_auth_code = getCode;
	}
	
	// send a post request
	var sendData = {
		"service" : "github", 
		"Authorization" : "none", 
		"operation" : "auth_token",
		"clientid" : github_app_clientId,
		"code" : github_auth_code,
		"redirect_uri" : github_app_redirect
	};
	
	$.ajax({
		type: "POST",
		url: gistConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		success: function (msg) {
			formatGithubResponse(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
		}
	});
}

/*
 * desc : format the response from github authorization
 */
function formatGithubResponse(data) {
	var msg = data.data.split('=');
	if(msg.indexOf("error") > -1) {
		// error occurs
		alert(data.data);
	} else {
		// correct token key
		var tokenMsg = data.data.split("&");
		var eachPart = [];
		
		// notice github_auth_token nust be initial as "(space)"
		github_auth_token = " ";
		for(var i = 0 ; i < tokenMsg.length ; i++) {
			eachPart = tokenMsg[i].split("=");
			switch(eachPart[0]) {
				case "access_token":
					github_auth_token = github_auth_token + eachPart[1];
					break;
				case "token_type":
					github_auth_token = eachPart[1] + github_auth_token;
					break;
			}
		}
		
		// get user info after receiving authorization token from github
		getGithubAuthName();
	}
}

/*
 * desc : get current authorized username
 * retn : 
 * |- github_app_username (global)
 */
function getGithubAuthName() {
	// send a post request
	var sendData = {
		"service" : "github", 
		"Authorization" : github_auth_token, 
		"operation" : "get_username"
	};
	
	$.ajax({
		type: "POST",
		url: gistConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		success: function (msg) {
		  var userInfo = JSON.parse(msg.data);
			github_app_username = userInfo.login;
      github_app_userid = userInfo.id;
			
			// initial other settings after receiving the auth from github
		  initialGithubService();
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
		}
	});
}

/*
 * desc : list a user's gist
 */
function github_list_user_gist() {

	// send a post request
	var sendData = {
		"service" : "github", 
		"Authorization" : github_auth_token, 
		"operation" : "list_user_gist"
	};
	
	$.ajax({
		type: "POST",
		url: gistConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		success: function (msg) {
			formatListGistResponse(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
		}
	});
}

/*
 * desc : format response from list user's gist api on github
 */
function formatListGistResponse(data) {

	if(data["state"] == "success") {
				
		var msg = data["data"];
		// fetch previous lists
		var gistGetList = '';
		var gistDeleteList = '';
		var gistFileName;
		
		// prepare get service
		for(var i = msg.length - 1 ; i >= 0  ; i--) {				
			gistFileName = getDictionaryKeyList(msg[i].files)[0];
			gistGetList += 
					'<ul class="nav nav-justified">' +
					'<li><a href="#gist-get-item-' + i + '" data-toggle="collapse" onclick="glyphiconChange(this);"><i class="glyphicon glyphicon-chevron-right"></i></a></li>' +
					'<li class="text-left" gistid="' + msg[i].id + '" gistfilename="' + getDictionaryKeyList(msg[i].files)[0] + '" gistdesc="' + msg[i].description + '" rawurl="' + (msg[i].files)[gistFileName].raw_url + '" onclick="gistFetchContent(this);"><a href="#" class="list-group-item">' + formatGistShownMsg("name", gistFileName) + "</a>" +
					(msg[i]["public"] ? "" : "&nbsp;*") + '</li>' +
					'<li class="text-left">' + formatGistShownMsg("filecount", msg[i].files) +
					'<li class="text-left">' + formatGistShownMsg("desc", msg[i]["description"]) + '</li>' +
					'<li class="text-left text-muted">' + formatGistShownMsg("get_time", msg[i].updated_at) + '</li>' +
					'</ul>' +
					'<div class="list-group collapse" id="gist-get-item-' + i + '"></div>';
			
			gistDeleteList +=
					'<a href="#" class="list-group-item"><ul class="nav nav-justified" gistid="' + msg[i].id + '" gistfilename="' + getDictionaryKeyList(msg[i].files)[0] + '" onclick="gistDeleteObject(this);">' +
					'<li class="text-left">' + formatGistShownMsg("name", gistFileName) + '</li>' +
					'<li class="text-left">' + (msg[i]["public"] ? "&nbsp;Public&nbsp;" : "&nbsp;Secret&nbsp;") +
					'<li class="text-left">' + formatGistShownMsg("filecount", msg[i].files) +
					'<li class="text-left">' + formatGistShownMsg("desc", msg[i]["description"]) + '</li>' +
					'<li class="text-left text-muted">' + formatGistShownMsg("get_time", msg[i].updated_at) + '</li>' +
					'</ul></a>';
					
			// get hierarchy gist one by one in "Get" service
			gist_single_gist(msg[i].id, "gist-get-item-" + i);
		}
		
		$('#gistget .list-group.file-list').html(gistGetList);
		$('#gistdelete .list-group.file-list').html(gistDeleteList);

	} else {
		alert("error : " + data["info"]);
	}
}

/*
 * desc : get a single gist
 * inpt : 
 * |- getGistID : gist id
 * |- objItem : jquery object for listing hierarchy gists
 */
function gist_single_gist(getGistID, objItem) {
	
	// send a post request
	var sendData = {
		"service" : "github", 
		"Authorization" : github_auth_token, 
		"operation" : "get_single_gist",
		"id" : getGistID
	};
	
	$.ajax({
		type: "POST",
		url: gistConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		success: function (msg) {
			formatHierarchyGistListResponse(msg, objItem);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
		}
	});	
}

/*
 * format hierarchy gist list from github response 
 */
function formatHierarchyGistListResponse(data, objItem) {
	//console.log(data);
	if(data["state"] == "success") {
		
		var msg = data["data"];
		var gistGetItemList = "";
		var showListLength = (msg.history.length >= 5 ? 5 : msg.history.length);
		var gistFileName = getDictionaryKeyList(msg.files)[0];
    
		for(i = 0 ; i < showListLength ; i++) {
			gistGetItemList += '<a href="#' + objItem + '-' + i + '" class="list-group-item" data-toggle="collapse">' +
					'<ul class="nav nav-justified hierarchy-level" onclick="changeGistGetIcon(this);">' +
					'<li class="glyphicon-color"><i class="glyphicon glyphicon-chevron-right"></i></li>' +
					'<li class="text-muted">history</li>' +
					'<li class="text-muted">' + formatGistShownMsg("login", msg.history[i].user.login) + '</li>' +
					'<li class="text-muted" id="' + msg.id + '-fc-index-' + i + '"><i class="fa fa-spinner fa-spin fa-1x fa-fw"></i></li>' +
					'<li>' + formatGistShownMsg("version_id", msg.history[i].version) + '</li>' +
					'<li class="text-muted">' + formatGistShownMsg("get_time", msg.history[i].committed_at) + '</li>' +
					'</ul></a>' +
					'<div class="list-group collapse" id="' + objItem + '-' + i + '"></div>';
			
			// get hierarchy gist version by version in "Get" service
			gist_single_gist_version(msg.id, msg.history[i].version , objItem + '-' + i);
		}
		
		$('#' + objItem).html(gistGetItemList);

	} else {
		alert("error : " + data["info"]);
	}
}

/*
 * desc : get a single version
 * inpt : 
 * |- getGistID : gist id
 * |- getVersionID : gist version id
 * |- objItem : jquery object for listing hierarchy gists
 */
function gist_single_gist_version(getGistID, getVersionID, objItem) {
	
	// send a post request
	var sendData = {
		"service" : "github", 
		"Authorization" : github_auth_token, 
		"operation" : "single_version",
		"id" : getGistID,
		"vid" : getVersionID
	};
	
	$.ajax({
		type: "POST",
		url: gistConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		success: function (msg) {
			formatGistVersionContent(msg, objItem, getGistID);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
		}
	});	
}

/*
 * desc : format each version
 */
function formatGistVersionContent(data, objItem, getGistID) {
  
	if(data["state"] == "success") {
		var index = objItem.split('-')[4];
		$('#' + data.data.id + '-fc-index-' + index).html(
			formatGistShownMsg("filecount", data["data"]["files"])
		);
		
		var fileCount = getDictionaryLength(data["data"]["files"]);
		var listFile = "";
		var gistFileName = "";

		for(var i = 0 ; i < fileCount ; i++) {
			gistFileName = getDictionaryKeyList(data["data"]["files"])[i];
			listFile += '<a href="#" class="list-group-item"><ul class="nav nav-justified hierarchy-level-version" gistid="' + getGistID + '" rawurl="' + data["data"]["files"][gistFileName]["raw_url"] + '" gistdesc="' + data.data.description + '" gistfilename="' + gistFileName + '" onclick="gistFetchContent(this);">' +
					'<li>' + formatGistShownMsg("long_file_name", gistFileName) + '</li>' +
					'<li class="text-muted text-left">' + data["data"]["files"][gistFileName]["language"] + '</li>' +
					'</ul></a>';
		}
		$('#' + objItem).html(listFile);
	} 
	
}

/*
 * desc : format shown messages
 */
function formatGistShownMsg(options, data) {
	switch(options) {
		case "filecount":
			var count = getDictionaryLength(data);
			var showMsg = "";
			switch(count) {
				case 1:
					showMsg = "1 file";
					break;
				default:
					showMsg = count + " files";
					break;
			}
			var fileCountLen = 8;
			if(showMsg.length > fileCountLen) {
				showMsg = showMsg.substring(0,8);				
			} else {
				var formatName = showMsg;
				for(var i = showMsg.length ; i <= fileCountLen ; i++) {
					formatName = formatName + "&nbsp;"
				}
				showMsg = formatName;
			}
			return showMsg.replace(/\s/g, '&nbsp;');
		case "id":
			return "sha:" + data.substring(0,5);
		case "version_id":
			return "sha:" + data.substring(0,8);
		case "login":
		case "name":
			var filenameLen = 17;
			if(data.length > filenameLen) {
				return data.substring(0,7) + "..." + data.substr(data.length-7,7);				
			} else {
				var formatName = data;
				for(var i = data.length ; i <= filenameLen ; i++) {
					formatName = formatName + "&nbsp;"
				}
				return formatName;
			}
		case "long_file_name":
		  var filenameLen = 31;
			if(data.length > filenameLen) {
				return data.substring(0,14) + "..." + data.substr(17,14);				
			} else {
				var formatName = data;
				for(var i = data.length ; i <= filenameLen ; i++) {
					formatName = formatName + "&nbsp;"
				}
				return formatName;
			}
		case "create_time":
			// format the time zone from Github response
			return data.substring(0,10) + " " + data.substring(11,19);
		case "get_time":
			// format the time zone from Github response
			return data.substring(0,4) + data.substring(5,7) + data.substring(8,10);
		case "desc":
		  var descLen = 13;
			if(data.length < 1) {
				data = "(none)";
			}
			var formatDesc = "";
			if(data.length > descLen) {
				formatDesc = data.substr(0,descLen-3) + "...";			
			} else {
				formatDesc = data;
				for(var i = data.length ; i <= descLen ; i++) {
					formatDesc = formatDesc + "&nbsp;"
				}
			}
			return formatDesc.replace(/\s/g, '&nbsp;');
	}
}

/*
 * desc : set the gist for fetching content
 */
function gistFetchContent(obj) {
	fetchContentObj = obj;
}

/*
 * desc : get content from hist
 */
function getContentFromGist() {
	if(fetchContentObj == "" || allowGistFetchContent == 0) {
		return ;
	}
		
	var sendData;
	
	if($(fetchContentObj).attr('rawurl') !== undefined) {
		// send a post request
		sendData = {
			"service" : "github", 
			"Authorization" : github_auth_token, 
			"operation" : "fetch_content",
			"option" : "url",
			"rawurl" : $(fetchContentObj).attr('rawurl')
		};
	} else {
		// send a post request
		sendData = {
			"service" : "github", 
			"Authorization" : github_auth_token, 
			"operation" : "fetch_content",
			"option" : "component",
			"gistid" : $(fetchContentObj).attr('gistid'),
			"gistversion" : $(fetchContentObj).attr('gistversion'),
			"login" : github_app_username,
			"filename" : $(fetchContentObj).attr('gistfilename')
		};
	}
	
	$.ajax({
		type: "POST",
		url: gistConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		beforeSend: function () {
			// temp deny new saving to the dropbox
			allowGistFetchContent = 0;
			$('#gistget button.btn.btn-primary').html(
				'<i class="fa fa-refresh fa-spin fa-fw" aria-hidden="true"></i>'
			);
		},
		success: function (msg) {
			setGistContentToEditor(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
			allowGistFetchContent = 1;
		}
	});
	
}

/*
 * desc : set a gist content to editor
 */
function setGistContentToEditor(data) {
	if(data["state"] == "success") {
		
		// clear the editor
		newFile();
			
		// write data into the editor
		editor.setValue(data['data']);
		
		// set the edit id and name for "edit" service
		gist_edit_id = $(fetchContentObj).attr('gistid');
		gist_edit_filename = $(fetchContentObj).attr('gistfilename');
		gist_edit_desc = $(fetchContentObj).attr('gistdesc');
		gistEditLoadInfo();
		
		$('#gistget button.btn.btn-primary').html('Complete');
		
		// close the tab after recovering back to the "Get" mode
		setTimeout(function() {
			$('#gistget button.btn.btn-default').click();
		}, 3000);

	} else {
		alert("error : " + data["info"]);
	}
	
	// set the time out to convert back to "Load" mode and reset for the next operation
	setTimeout(function() {
		allowGistFetchContent = 1;
		$('#gistget button.btn.btn-primary').html('Get');
		fetchContentObj = "";
	}, 2000);	
}

/*
 * desc : change icon style while clicking the history
 */
function changeGistGetIcon(obj) {
	$(obj).children('.glyphicon-color').children('i')
		.toggleClass('glyphicon-chevron-right')
		.toggleClass('glyphicon-chevron-down');
}

/*
 * desc : create a gist
 */
function startGistCreate() {
	if(allowGistCreate == 0) {
		// not allowed to send another create request
		return;
	}
	
	var publicOrNot = $('input[name=gistCreateOptions]:checked').val();
	
	// send a post request
	var sendData = {
		"service" : "github", 
		"Authorization" : github_auth_token, 
		"operation" : "create_gist",
		"filename" : $('#gistCreateFile').val(),
		"content" : editor.getValue(),
		"description" : $('#gistCreateDesc').val(),
		"public" : (publicOrNot === undefined ? true : publicOrNot)
	};
	
	$.ajax({
		type: "POST",
		url: gistConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		beforeSend: function () {
			// temp deny new create request to the gist
			allowGistCreate = 0;
			$('#gistCreateBtn').html(
				'<i class="fa fa-refresh fa-spin fa-fw" aria-hidden="true"></i>'
			);
		},
		success: function (msg) {
			formatGistCreateResponse(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
		}
	});	
}

/*
 * desc : format create gist response
 */
function formatGistCreateResponse(msg) {
	if(msg.state == "success") {
		var response = JSON.parse(msg.data);
		if("url" in response && response["url"].length > 0 && "files" in response) {
			$('#gistCreateBtn').html('Complete');
			
			// set the edit id and name for "edit" service
			gist_edit_id = response["id"];
			gist_edit_filename = getDictionaryKeyList(response["files"])[0];
			gist_edit_desc = response["description"];
			gistEditLoadInfo();
			
			setTimeout(function() {
				$('#gistcreate .btn.btn-default').click();
			}, 3000);
		} else {
			$('#gistCreateBtn').html(msg.data);
		}
	} else {
		$('#gistCreateBtn').html(msg.info);
	}
	
	// set the time out to convert back to "Create" mode
	setTimeout(function() {
		allowGistCreate = 1;
		$('#gistCreateBtn').html('Create');
	}, 2000);
}

/*
 * desc : load the necessary info for further edit service
 */
function gistEditLoadInfo() {
	$('#gistEditID').val(gist_edit_id);
	$('#gistEditFile').val(gist_edit_filename);
	$('#gistEditDesc').val(gist_edit_desc);
}

/*
 * desc : edit a gist
 */
function startGistEdit() {
	var errorCheck = 0;
	
	if($('#gistEditID').val() == "") {
		errorCheck = 1;
	} else if($('#gistEditFile').val().length < 1) {
		errorCheck = 1;	
	}
	
	if(errorCheck == 1) {
		$('#gistEditBtn').html('Please select a gist from Get service.');
		
		setTimeout(function() {
			$('#gistEditBtn').html('Edit');
		}, 3000);
		return ;
	}
	
	// undergo
	if(allowGistEdit == 0) {
		return ;
	}
	
	// send a PATCH request
	var deleteOldFile = $('input[name=gistEditOptions]:checked').val();
	
	var sendData = {
		"service" : "github", 
		"Authorization" : github_auth_token, 
		"operation" : "edit_gist",
		"filename" : $('#gistEditFile').val(),
		"old_filename" : gist_edit_filename,
		"content" : editor.getValue(),
		"description" : $('#gistEditDesc').val(),
		"id" : $('#gistEditID').val(),
		"deleteold" : deleteOldFile
	};
	
	$.ajax({
		type: "POST",
		url: gistConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		beforeSend: function () {
			// temp deny new create request to the gist
			allowGistEdit = 0;
			$('#gistEditBtn').html(
				'<i class="fa fa-refresh fa-spin fa-fw" aria-hidden="true"></i>'
			);
		},
		success: function (msg) {
			formatGistEditResponse(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
			allowGistEdit = 1;
		}
	});	
}

/*
 * desc : format a gist edit response
 */
function formatGistEditResponse(msg) {
	if(msg.state == "success") {
		var response = JSON.parse(msg.data);
		if("url" in response && response["url"].length > 0 && "files" in response) {
			$('#gistEditBtn').html('Complete');
			
			// set the edit id and name for "edit" service
			gist_edit_id = $('#gistEditID').val();
			gist_edit_filename = $('#gistEditFile').val();
			gist_edit_desc = $('#gistEditDesc').val();
			
			setTimeout(function() {
				$('#gistedit .btn.btn-default').click();
			}, 3000);
		} else {
			$('#gistEditBtn').html(msg.data);
		}
	} else {
		$('#gistEditBtn').html(msg.info);
	}
	
	// set the time out to convert back to "Edit" mode
	setTimeout(function() {
		allowGistEdit = 1;
		$('#gistEditBtn').html('Edit');
	}, 2000);
}

/*
 * desc : fork a gist from another one
 */
function startGistFork() {
	var forkid = $('#gistForkID').val();
	var forkurl = $('#gistForkUrl').val();
	var usedID = "";
	var errorFlag = 0;
	
	// wrong parameters, assume forkid length is more than 10 words
	if(! ( 
		(forkid.length >= 10) || 
		(forkurl.length >= 33 && forkurl.substr(0,23) == "https://gist.github.com")
	)) {
		errorFlag = 1;
	} else if (forkid.length >= 10) {
		// used gist id
		usedID = forkid;
	}	else if (forkurl.length >= 33) {
		// try get gist id
		var rawid = forkurl.substring(24, forkurl.length).split('/');
		if(rawid.length >= 2) {
			if(rawid[1].length < 10) {
				errorFlag = 1;
			} else {
				usedID = rawid[1];
			}
		} else {
			errorFlag = 1;
		}
	}
	
	// show error messages
	if(errorFlag == 1) {
		$('#gistForkBtn').html('Wrong Parameters!');
		
		setTimeout(function() {
			$('#gistForkBtn').html('Fork');
		}, 3000);
		return ;
	}
	
	var sendData = {
		"service" : "github", 
		"Authorization" : github_auth_token, 
		"operation" : "fork_gist",
    "forkid" : usedID
	};	
	
	$.ajax({
		type: "POST",
		url: gistConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		beforeSend: function () {
			// temp deny new create request to the gist
			allowGistFork = 0;
			$('#gistForkBtn').html(
				'<i class="fa fa-refresh fa-spin fa-fw" aria-hidden="true"></i>'
			);
		},
		success: function (msg) {
			formatGistForkResponse(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
			allowGistFork = 1;
		}
	});	
	
}

/*
 * desc : format a fork gist response from github
 */
function formatGistForkResponse(msg) {
	if(msg.state == "success") {
		var response = JSON.parse(msg.data);
		if("url" in response && response["url"].length > 0 && "files" in response) {
			$('#gistForkBtn').html('Complete');
			
			setTimeout(function() {
				$('#gistfork .btn.btn-default').click();
			}, 3000);
		} else {
			$('#gistForkBtn').html(msg.data);
		}
	} else {
		$('#gistForkBtn').html(msg.info);
	}
	
	// set the time out to convert back to "Edit" mode
	setTimeout(function() {
		allowGistFork = 1;
		$('#gistForkBtn').html('Fork');
	}, 2000);
}

/*
 * desc : get a item for deletion
 */
function gistDeleteObject(obj) {
	gist_delete_obj = obj;
	$('#gistDeleteBtn').html('Delete ' + $(gist_delete_obj).attr('gistfilename'));
}

/*
 * desc : start delet a gist from github
 */
function startGistDelete() {
	// pre-test
	if($('#gistdelete input:checked').val() === undefined) {
		if(! $('#gistdelete .row.modal-sep-line').hasClass("githubWarningBox")) {
			$('#gistdelete .row.modal-sep-line').addClass("githubWarningBox");
		}	
		return ;
	} else if ($('#gistdelete input:checked').val() == "true") {
		if($('#gistdelete .row.modal-sep-line').hasClass("githubWarningBox")) {
			$('#gistdelete .row.modal-sep-line').removeClass("githubWarningBox");
		}			
	}
	
	if(allowGistDelete == 0 || gist_delete_obj == "") {
		if (gist_delete_obj == "") {
			$('#gistDeleteBtn').html('Please select a gist.');
		}
		return ;
	}
	
	var sendData = {
		"service" : "github", 
		"Authorization" : github_auth_token, 
		"operation" : "delete_gist",
    "deleteid" : $(gist_delete_obj).attr('gistid')
	};	
	
	$.ajax({
		type: "POST",
		url: gistConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		beforeSend: function () {
			// temp deny new create request to the gist
			allowGistDelete = 0;
			$('#gistDeleteBtn').html(
				'<i class="fa fa-refresh fa-spin fa-fw" aria-hidden="true"></i>'
			);
		},
		success: function (msg) {
			formatGistDeleteResponse(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
			allowGistDelete = 1;
		}
	});	
}

/*
 * desc : format a gist delete response
 */
function formatGistDeleteResponse(msg) {
	if(msg.state == "success") {
		if(msg.data.length < 1) {
			$('#gistDeleteBtn').html('Complete');
			
			setTimeout(function() {
				$('#gistdelete .btn.btn-default').click();
			}, 3000);
		} else {
			$('#gistDeleteBtn').html(msg.data);
		}
	} else {
		$('#gistDeleteBtn').html(msg.info);
	}
	
	// set the time out to convert back to "Edit" mode
	setTimeout(function() {
		allowGistDelete = 1;
		$('#gistDeleteBtn').html('Delete');
	}, 2000);	
}

/*
 * desc : set up user buttons for the gist get service
 */
function glyphiconChange(obj) {
	$(obj).children('i')
		.toggleClass('glyphicon-chevron-right')
		.toggleClass('glyphicon-chevron-down');
}

/*
 * desc : control github services
 */
function controlGithubService(options) {
	switch(options) {
		case "lock":
			// only authorization 
			for(var i = 0 ; i < $('#service-github li .gistOperation').length ; i++) {
				$($('#service-github li .gistOperation')[i]).attr('data-toggle', 'none');
				$($('#service-github li .gistOperation')[i]).addClass("githubNoService");
			}
			break;
		case "unlock":
		  // set the authorization tab to locked condition and also does its content
			$('#service-github li .gistOperationToggle').attr('data-toggle', 'none');
			$('#service-github li .gistOperationToggle').addClass("githubNoService");
			$('#service-github li .gistOperationToggle').parent().removeClass('active');
			$('#gistauth').removeClass("active");
			$('#gistauth').removeClass('in');
		
		  // set the other tabs into active ones
		  var checkActiveStatus = 0;
			for(var i = 0 ; i <= $('#service-github li .gistOperation').length ; i++) {
				$($('#service-github li .gistOperation')[i]).attr('data-toggle', 'tab');
				$($('#service-github li .gistOperation')[i]).removeClass("githubNoService");			
				
				// check whether active tab is exisitng or not
				if($($('#service-github li')[i]).hasClass("active")) {
					checkActiveStatus = 1;
				}
			}
			if(checkActiveStatus == 0) {
				// set the github save button activated
				$($('#service-github li')[1]).addClass("active");
				$("#gistcreate").addClass("active");
				$("#gistcreate").addClass('in');
			}
			break;			
	}
}

/*
 * desc : initial github service
 */
function initialGithubService() {
	// fetch authorization token and get username
	if(github_auth_code.length < 1 || github_auth_token.length < 1) {
		
		// only activate when code exists
		if($.getUrlVar("code") !== undefined) {
			completeGithubAuthorization();
		}
	}
	
	// allow to start the github service
	if(github_auth_code.length > 0 && github_auth_token.length > 0) {
		// list a user's gist and its hierarchy gists
		github_list_user_gist();
	} 
	
	// initial service 
	if(
	  github_auth_code.length > 0 && 
	  github_auth_token.length > 0 &&
		github_app_username.length > 0 &&
		String(github_app_userid).length > 0
	) {
		// allow gist create
		allowGistCreate = 1;
		
		// initial 
		fetchContentObj = "";
		allowGistFetchContent = 1;
		allowGistEdit = 1;
		allowGistFork = 1;
		gist_delete_obj = "";
		allowGistDelete = 1;
		
		// user experience or notice
		controlGithubService("unlock");
		if($('#gistdelete .row.modal-sep-line').hasClass("githubWarningBox")) {
			$('#gistdelete .row.modal-sep-line').removeClass("githubWarningBox");
		}
	} else {
		controlGithubService("lock");
	}
	
}
















