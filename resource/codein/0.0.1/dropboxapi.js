/*
 * desc : app settings
 * type : Dropbox Folder Only
 */
var app_clientID = "1zq5d396qplohif";
var redirect_uri = "http://localhost/index.html";
var dropboxCode = "";
var DropboxConnector = "/api/DropboxAPI.php";
var dropboxAllowSaveFlag = 0;
var dropboxAllowDownloadFlag = 0;
var dropboxAllowDeleteFlag = 0;
var dropboxDownloadFilename = "";
var dropboxDeleteFilename = "";

/*
 * desc : dropbox OAuth 2.0 /authorize
 * retn : a code used in further /oauth2/token
 */
function dropboxAuthorizeOnToken() {
        if(cloudAPIFlag == 0) {
            // no cloud API allowed
            return ;
        }

	window.location.href = 
		"https://www.dropbox.com/1/oauth2/authorize?response_type=token&client_id=" + 
		app_clientID + "&redirect_uri=" + redirect_uri;
}

/*
 * desc : ajax to list all file in the client folder
 */ 
function dropbox_list_folder() {
	var sendData = {"service" : "dropbox", "Authorization" : dropboxCode, "operation" : "list_folder"};
	
	$.ajax({
		type: "POST",
		url: DropboxConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		success: function (msg) {
			dropbox_listing_show(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
		}
	});
}

/*
 * desc : ajax to save the file
 * POST :
 * |- basic : service, Authorization and operation
 * |- furth : filename, code
 */
function dropbox_save() {
	var sendData = {
		"service" : "dropbox", 
		"Authorization" : dropboxCode, 
		"operation" : "save",
		"filename" : $('#dropboxFileName').val(),
		"code" : editor.getValue()
	};
	
	$.ajax({
		type: "POST",
		url: DropboxConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		beforeSend: function () {
			// temp deny new saving to the dropbox
			dropboxAllowSaveFlag = 0;
			$('#dsave button.btn.btn-primary').html(
				'<i class="fa fa-refresh fa-spin fa-fw" aria-hidden="true"></i>'
			);
		},
		success: function (msg) {
			formatDropboxUploadResponse(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			$('#dsave button.btn.btn-primary').html('error(' + xhr.status + ': ' + thrownError + ')');
		}
	});
}

/*
 * desc : format the dropbox response of upload
 * call : dropbox_save()
 */
function formatDropboxUploadResponse(data) {

	if(data["state"] == "success") {
		if(data["data"]["state"] == "success") {
			var msg = JSON.parse(data.data.data);
			if("error" in msg) {
				// upload does not sccuess
				$('#dsave button.btn.btn-primary').html(msg["error_summary"]);
			} else {
				// upload is complete
				$('#dsave button.btn.btn-primary').html('Complete');
				// close the tab after recovering back to the "Save" mode
				setTimeout(function() {
					$('#dsave .btn.btn-default').click();
				}, 3000);
			}
		} else {
			$('#dsave button.btn.btn-primary').html(data["data"]["info"]);
		}
	} else {
		$('#dsave button.btn.btn-primary').html(data["info"]);
	}
	
	// set the time out to convert back to "Save" mode
	setTimeout(function() {
		dropboxAllowSaveFlag = 1;
		$('#dsave button.btn.btn-primary').html('Save');
	}, 2000);
}

/*
 * desc : load from a file on dropbox
 * |- basic : service, Authorization and operation
 * |- furth : filename 
 */
function dropbox_download() {
	if(dropboxAllowDownloadFlag == 0) {
		// download is not allowed
		return ;
	} else if (dropboxDownloadFilename.length < 1) {
		$('#dload button.btn.btn-warning').html('Select a file.');
		return ;
	}
	
	var sendData = {
		"service" : "dropbox", 
		"Authorization" : dropboxCode, 
		"operation" : "download",
		"filename" : dropboxDownloadFilename
	};
	
	$.ajax({
		type: "POST",
		url: DropboxConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		beforeSend: function () {
			// temp deny new saving to the dropbox
			dropboxAllowDownloadFlag = 0;
			$('#dload button.btn.btn-warning').html(
				'<i class="fa fa-refresh fa-spin fa-fw" aria-hidden="true"></i>'
			);
		},
		success: function (msg) {
			formatDropboxDownloadResponse(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			$('#dload button.btn.btn-warning').html('error(' + xhr.status + ': ' + thrownError + ')');
			dropboxDownloadFilename = "";
		}
	});	
}

/*
 * desc : download a file on the dropbox service 
 */
function formatDropboxDownloadResponse(data) {
	if(data["state"] == "success") {
		try {
			// try to parse downloading error
			var msg = JSON.parse(data['data']);
			if("error" in msg) {
				// download does not sccuess
				$('#dload button.btn.btn-warning').html(msg["error_summary"]);
			} else {
				editor.setValue(msg);
			}
		} catch (err) {
			// download is complete
			$('#dload button.btn.btn-warning').html('Complete');
			
			// clear the editor
			newFile();
			
			// write data into the editor
			editor.setValue(data['data']);
				
			// close the tab after recovering back to the "Save" mode
			setTimeout(function() {
				$('#dload button.btn.btn-default').click();
			}, 3000);
		}
	} else {
		$('#dload button.btn.btn-warning').html(data["info"]);
	}
	
	// set the time out to convert back to "Load" mode and reset for the next operation
	setTimeout(function() {
		dropboxAllowDownloadFlag = 1;
		$('#dload button.btn.btn-warning').html('Load');
		dropboxDownloadFilename = "";
	}, 2000);
}

/*
 * desc : the tip shown while selecting the a file name on the list
 */
function nameToSaveDropbox(obj) {
	$("#dropboxFileName").val(
		$($(obj).children('ul').children('li')[0]).text()
	);
}

/*
 * desc : notify delete operation
 */
function notifyDropboxDeleteOperation(options) {
	switch(options) {
		case "on":
			if(! $('#dropboxDeleteConfirmText').hasClass("dropboxWarningBox")) {
				$('#dropboxDeleteConfirmText').addClass("dropboxWarningBox");
			}
			break;
		case "off":
			if($('#dropboxDeleteConfirmText').hasClass("dropboxWarningBox")) {
				$('#dropboxDeleteConfirmText').removeClass("dropboxWarningBox");
			}
			break;
	}
}


/*
 * desc : delete a file on the droopbox
 */
function dropbox_delete() {
	// condition check
	if(dropboxDeleteFilename.length < 1) {
		$('#deleteFromDropboxBtn').text("Select a file for deleting.");
		return;
	} else if ($('#deletedDropboxFileName').val() != dropboxDeleteFilename) {
		notifyDropboxDeleteOperation("on");
		return;
	} else if (dropboxAllowDeleteFlag == 0) {
		$('#deleteFromDropboxBtn').text("The delete process is undergoing.");
		return;
	}
	
	// allow to delete a file
	notifyDropboxDeleteOperation("off");
	
	var sendData = {
		"service" : "dropbox", 
		"Authorization" : dropboxCode, 
		"operation" : "delete",
		"filename" : dropboxDeleteFilename
	};
	
	$.ajax({
		type: "POST",
		url: DropboxConnector,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		beforeSend: function () {
			// temp deny new delete request to the dropbox
			dropboxAllowDeleteFlag = 0;
			$('#deleteFromDropboxBtn').html(
				'<i class="fa fa-refresh fa-spin fa-fw" aria-hidden="true"></i>'
			);
		},
		success: function (msg) {
			formatDropboxDeleteResponse(msg);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			$('#deleteFromDropboxBtn').html('error(' + xhr.status + ': ' + thrownError + ')');
			dropboxDeleteFilename = "";
		}
	});	
}

/*
 * desc : format dropbox delete reposne
 */
function formatDropboxDeleteResponse(data) {
	
	if(data["state"] == "success") {
		
		var msg = JSON.parse(data["data"]);
		
    if("error" in msg) {
			// delete does not sccuess
			$('#deleteFromDropboxBtn').html(msg["error_summary"]);
		} else {
			// upload is complete
			$('#deleteFromDropboxBtn').html('Complete');
			// close the tab after recovering back to the "Save" mode
			setTimeout(function() {
				$('#ddelete .btn.btn-default').click();
			}, 3000);
		}
		
	} else {
		$('#deleteFromDropboxBtn').html(data["info"]);
	}
	
	// set the time out to convert back to "Delete" mode
	setTimeout(function() {
		dropboxAllowDeleteFlag = 1;
		$('#deleteFromDropboxBtn').html('Delete');
		dropboxDeleteFilename = "";
	}, 2000);
	
}

/*
 * desc : the tip shown while loading from dropbox
 */
function loadFromDropbox(obj) {
	dropboxDownloadFilename = $($(obj).children('ul').children('li')[0]).text();
	$('#loadFromDropboxBtn').text("Load " + dropboxDownloadFilename);
}

/*
 * desc : the tip shown while deleting from dropbox
 */
function deleteFromDropbox(obj) {
	dropboxDeleteFilename = $($(obj).children('ul').children('li')[0]).text();
	$('#deleteFromDropboxBtn').text("Delete " + dropboxDeleteFilename);
}

/*
 * desc : lock the dropbox operation while there is no token available
 * call : initialDropboxService(), initialize the dropbox service tab
 */
function controlDropboxService(options) {
	
	switch(options) {
		case "lock":
			for(var i = 0 ; i < $('#service-dropbox li .dropboxOperation').length ; i++) {
				$($('#service-dropbox li .dropboxOperation')[i]).attr('data-toggle', 'none');
				$($('#service-dropbox li .dropboxOperation')[i]).addClass("dropboxNoService");
			}
			break;
		case "unlock":
			// set the authorization tab to locked condition and also does its content
			$('#service-dropbox li .dropboxOperationToggle').attr('data-toggle', 'none');
			$('#service-dropbox li .dropboxOperationToggle').addClass("dropboxNoService");
			$('#service-dropbox li .dropboxOperationToggle').parent().removeClass('active');
			$('#dauth').removeClass("active");
			$('#dauth').removeClass('in');
		
		  // set the other tabs (save, load and delete)
		  var checkActiveStatus = 0;
			for(var i = 1 ; i <= $('#service-dropbox li .dropboxOperation').length ; i++) {
				$($('#service-dropbox li .dropboxOperation')[i]).attr('data-toggle', 'tab');
				$($('#service-dropbox li .dropboxOperation')[i]).removeClass("dropboxNoService");			
				
				// check whether active tab is exisitng or not
				if($($('#service-dropbox li')[i]).hasClass("active")) {
					checkActiveStatus = 1;
				}
			}
			if(checkActiveStatus == 0) {
				// set the dropbox save button activated
				$($('#service-dropbox li')[1]).addClass("active");
				$("#dsave").addClass("active");
				$("#dsave").addClass('in');
			}
		
			break;
	}
	
}

/*
 * desc : parse timezone infomation
 * call : dropbox_listing_show()
 */
function formatTimeZone(datetime) {
	return datetime.substring(0,10) + " " + datetime.substring(11,19);
}

/*
 * desc : dropbox listing function
 * call : dropbox_list_folder()
 */
function dropbox_listing_show(data) {
	var saveList = "";
	var loadList = "";
	var deleteList = "";
	
	for(var i = data.data.length - 1 ; i >= 0  ; i--) {
		saveList += 
		    '<a href="#" class="list-group-item" onclick="nameToSaveDropbox(this);">'+ 
				'<ul class="nav nav-justified">' +
				'<li>' + data.data[i].name + '</li>' +
				'<li class="text-right text-muted">' + formatTimeZone(data.data[i].client_modified) + '</li>' +
				'</ul>' +
				'</a>';
		loadList += 
		    '<a href="#" class="list-group-item" onclick="loadFromDropbox(this);">'+ 
				'<ul class="nav nav-justified">' +
				'<li>' + data.data[i].name + '</li>' +
				'<li class="text-right text-muted">' + formatTimeZone(data.data[i].client_modified) + '</li>' +
				'</ul>' +
				'</a>';		
		deleteList += 
		    '<a href="#" class="list-group-item" onclick="deleteFromDropbox(this);">'+ 
				'<ul class="nav nav-justified">' +
				'<li>' + data.data[i].name + '</li>' +
				'<li class="text-right text-muted">' + formatTimeZone(data.data[i].client_modified) + '</li>' +
				'</ul>' +
				'</a>';					
	}
	
	$('#dsave .list-group.file-list').html(saveList);
	$('#dload .list-group.file-list').html(loadList);
	$('#ddelete .list-group.file-list').html(deleteList);
}

/*
 * desc : initial Dropbox Service
 */
function initialDropboxService() {
	// parse URL to check whether Dropbox authorization is set
	var params = window.location.href.slice(window.location.href.indexOf('#') + 1).split('&');
	if(params.length > 0)
	{
		var access_token = $.getUrlVarsByChar('#',"access_token");
		var token_type = $.getUrlVarsByChar('#',"token_type");
		if(access_token !== undefined 
		  && token_type !== undefined 
		  && access_token.length > 0 
		  && token_type.length > 0
		) {
			// in order to meet the rule of Dropbox
			dropboxCode = 
				token_type[0].toUpperCase() + token_type.substring(1, token_type.length) + " " + access_token;
		}
	}
	
	// control tabs
	if(dropboxCode.length < 1) {
		controlDropboxService("lock");
	} else {
		controlDropboxService("unlock");
		// list file
		dropbox_list_folder();
		// allow to save to the dropbox
		dropboxAllowSaveFlag = 1;
		// allow to download a file on dropbox
		dropboxAllowDownloadFlag = 1;
		// allow to delete a file on dropbox
		dropboxAllowDeleteFlag = 1;
	}
}

/*
 * desc : control the tip shown or not while saving into the dropbox
 * call : saveToDropbox(), closeSaveToDropbox()
 */
function showDropboxTip(options) {
	
	var allClass = $('#dropboxFileName').parent().attr("class").split(' ');
	
	switch(options) {
		case "off":
			// de-label the border
			if(allClass.indexOf("dropboxWarningBox") > -1) {
				$('#dropboxFileName').parent().removeClass("dropboxWarningBox");
			}					
			break;
		case "on":
			// label the border while no name input
			if(allClass.indexOf("dropboxWarningBox") < 0) {
				$('#dropboxFileName').parent().addClass("dropboxWarningBox");
			}			
			break;
	}
}

/*
 * desc : save the the dropbox while clicking the button
 */
function saveToDropbox() {
	var dFile = $('#dropboxFileName').val();
	if(dFile.length > 0) {
		// de-label the border
		showDropboxTip("off");
		
		// ajax saving to the dropbox
		dropbox_save();
	} else {
		// label the border while no name input
		showDropboxTip("on");
	}
	
}

/*
 * desc : close the dropbox modal while clicking the close
 */
function closeSaveToDropbox() {
	// de-label the border
	showDropboxTip("off");	
}







