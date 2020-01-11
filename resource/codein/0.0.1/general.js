/*
 * desc : settings
 */
var execEnv = "/api/exec.php";
var execEnvAvailableFlag = false;
var egCodeId = "helloworld";

/*
 * desc : global setting
 */
var error_line_array = [];
var error_line_markerId = {};

/*
 * desc : editor environment
 */ 
var editor = ace.edit("editor");

/*
 * desc : set editor environment
 */
function setEditorEnv() {
	document.getElementById('editor').style.fontSize='14px';	
	editor.setTheme("ace/theme/xcode");
	editor.getSession().setMode("ace/mode/swift");
	editor.getSession().setUseWrapMode(true);
	editor.getSession().setTabSize(4);
	// not to scroll to the end while loading a turtorial
	editor.$blockScrolling = Infinity;
}

/*
 * desc : check execution environment
 */
function execEnvironmentReady() {
	if(! execEnvAvailableFlag) { 
		alert('Execution environment is not ready.'); 
		return false; 
	} else {
		return true;
	}
}

/*
 * desc : set the line marker into the editor
 */
function setTheLineMarker(options, lineNumberIndexFrom0) {
	var Range = ace.require('ace/range').Range;
	switch(options) {
		case "error":
			var markerID = editor.session.addMarker(
				new Range(lineNumberIndexFrom0, 0, lineNumberIndexFrom0, 300), 
				"lineMarker", 
				"fullLine"
			);
			// add marker id for removing
			error_line_markerId[lineNumberIndexFrom0] = markerID;
			break;
		case "blank":
			if(lineNumberIndexFrom0 in error_line_markerId) {
				editor.session.removeMarker(error_line_markerId[lineNumberIndexFrom0]);
			}
			break;			
	}
}
 
 
/*
 * desc : remove the line marker while editing the error line
 * inpt : 
 * |- options : {partial|all}
 */
function removeLineMarker(options) {
	switch(options) {
		case "partial":
			var selectionRange = editor.getSelectionRange();
			if(error_line_array.indexOf(selectionRange.start.row) > -1) {
				// remove the line marker
				setTheLineMarker("blank", selectionRange.start.row);
				// remove from error_line_array
				error_line_array.splice(error_line_array.indexOf(selectionRange.start.row), 1);
				// remove from error_line_markerId
				delete error_line_markerId[selectionRange.start.row];
			}
			break;
		case "all":
			var copyForClear = error_line_markerId;
			for(var name in copyForClear) { 
				setTheLineMarker("blank", name);
				error_line_array.splice(error_line_array.indexOf(name), 1);
				delete error_line_markerId[name];
			}
			break;
	}
}

/*
 * desc : format the exec result
 */
function formatRes(getRes) {
	var retRes = getRes.replace('/\s/g','&nbsp;').split('\n');
	var showResStr = "";
	for(var i = 0 ; i < retRes.length; i++) {
		if(retRes[i].length < 1) {
			continue;
		}
		showResStr += retRes[i] + "<br>";
	}
	return showResStr
		.replace(/:\serror:\s/g, ': <mark class="error">error:</mark> ')
		.replace(/\^/g, '<mark class="tip">^</mark>')
		;
}

/*
 * desc : notify the error line
 */
function setLineMarker(getExecRes) {
	var line_rule = /:(\d+):\d+:\serror:\s/g;
	error_line_array = [];
	var match = line_rule.exec(getExecRes);
	while(match != null) {
		if(error_line_array.indexOf(match[1]) < 0) { 
			error_line_array.push(match[1]);
		}
		match = line_rule.exec(getExecRes);
	}
	if(error_line_array.length > 0) {
		for(var i = 0 ; i < error_line_array.length ; i++) {
			// both row and column start from index 0, but visualized line number start from index 1
			error_line_array[i] = error_line_array[i] - 1;
			setTheLineMarker("error", error_line_array[i]);
		}
	}
}

/*
 * desc : Run the code
 */
function executeCodeBody() {		
  // check execution is allowed
	if(! execEnvironmentReady()) { return ; }
	
	// clean the other mark not removing
	removeLineMarker("all", "off");
	
	// clear the previous execution result and re-post to the server
	var sendData = { 
		"version" : $('#version-selector').val(), 
		"code" : editor.getValue(),
		"lang" : $('#language-selector').val()
	};
	
	// show the execution parameter and the result	
	$.ajax({
		type: "POST",
		url: execEnv,
		data: sendData,
		contentType: "application/x-www-form-urlencoded",
		datatype: 'json',
		success: function (msg) {
			showExecIcon("exec", "on");				
			if("pid" in msg.response && "sid" in msg.response) {
				// run time unit is "second"
				var runtime = ($('#runtime-selector').val() == "long" ? 3600 : 60);
	
				fetchExecRes(msg.response.pid, msg.response.sid, msg.response.btime, runtime);
			}
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert('error(' + xhr.status + ': ' + thrownError + ')');
		}
	});	
}

/*
 * desc : fetch execution result
 */
function fetchExecRes(pid, sid, btime, runtime) {
	$.ajax({
		type: "GET",
		url: execEnv,
		dataType: 'json', //json data type
		data: {"pid" : pid, "sid" : sid, "btime" : btime, "runtime" : runtime},
		success: function(data) {
			switch(data.response.status) {
				case 0:
					setTimeout(fetchExecRes.bind(this, pid, sid, btime, runtime), 1000);
					break;
				case 1:
					setLineMarker(data.response.result);
				case -1:
					showExecIcon("exec","off");	
					$('#execution_result').html(formatRes(data.response.result));
					break;
			}
		},
		error: function(data) {
		}
	});
}
		
/*
 * desc : export to a swift file
 */
function exportFile() {
	event.preventDefault();
	var anchor = document.createElement('a');
	anchor.href = "data:application/octet-stream;base64," + Base64.encode(editor.getValue());
	anchor.download = 'export.swift';
	anchor.click();
	document.body.appendChild(anchor);
	document.body.removeChild(anchor);
}

/*
 * desc : show selected parameters
 */
function showParas() {
	// show initial check
	showExecIcon("init", "on");

  // clear the previous execution result and re-post to the server
  var sendData = { 
    "version" : $('#version-selector').val(), 
    "code" : '',
    "lang" : $('#language-selector').val()
  };
	
	$.ajax({
		type: "GET",
		url: execEnv,
		dataType: 'json',
		data: sendData,
		timeout: 5000,
		success: function(data) {
			showExecIcon("init", "off");
			
			if("response" in data && data.response.length > 0) {
				/*var showInitCheck = ["Swift Version " + $('#version-selector').val(), $('#env-selector').val()];
				var showResStr = "";
				for(var i = 0 ; i < showInitCheck.length; i++) {
					showResStr += showInitCheck[i] + "<br>";
				}
				$('#execution_result').html(showResStr);*/
				$('#execution_result').html(data.response);
				
				// set the flag to indicate the execution can begin
				execEnvAvailableFlag = true;
			}
		},
		error: function(data) {
			showExecIcon("init", "off");
			
			var showInitCheck = [
				'<mark class="error">Docker execution environment is error</mark>.', 
				'Make sure the <mark class="tip">execution url</mark> is correct.',
				'',
				'Note : Check the variable "execEnv" at line.4 on general.js.'
			];
			var showResStr = "";
			for(var i = 0 ; i < showInitCheck.length; i++) {
				showResStr += showInitCheck[i] + "<br>";
			}
			$('#execution_result').html(showResStr);
			
			// set the flag to indicate no execution is allowed
			execEnvAvailableFlag = false;
		}
	});
}

/*
 * desc : show execution
 * inpt :
 * |- option : { on | off }
 */
function showExecIcon(type, option) {
	$('#execution_result_container').text('');
	switch(option) {
		case "on":
			var showResStr = "<div>";
			switch(type) {
				case "exec":
					showResStr += '<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i>';
					break;
				case "init":
					showResStr += '<i class="fa fa-cog fa-spin fa-2x fa-fw"></i>';
					break;
			}
			showResStr += "</div>";
			$('#execution_result_container').append(showResStr);
			break;
		case "off":
			$('#execution_result_container').append('<div id="execution_result"></div>');
			break;
	}
}

/*
 * desc : set and check example code id
 */
function setEGCodeId(getID) {
	switch(getID) {
		default:
			alert(getID + ".swift is not existing.");
			break;
		case "helloworld":
		case "quickstart":
		case "fileioandsort":
		case "bash":
		case "oop":
			egCodeId = getID;
			break;
	}
}

/*
 * desc : fetch example codes
 */
function fetchExampleCode() {
	// check execution is allowed
	if(! execEnvironmentReady()) { return ; }
	$.ajax({
		type: "GET",
		url: execEnv,
		dataType: 'json',
		data: { "egcodeid" : egCodeId },
		timeout: 5000,
		success: function(data) {
			if("response" in data && data.response.length > 0) {
				// initialize the editor first
				newFile();
				editor.setValue(data.response.replace(/\n\n/g, '\n'));
			} else {
				$('#execution_result').html('<mark class="error">Can not fetch the example code.</mark>');
			}
		},
		error: function(data) {
			$('#execution_result').html('<mark class="error">Can not fetch the example code.</mark>');
		}
	});
}

/*
 * desc : new file
 */
function newFile() {
	// remove all line marker
	removeLineMarker("all");
	
	// clear all content
	editor.setValue('');
	
	showParas();
}

/*
 * desc : check cloud services while chicking the "Cloud" button
 */
function prepareCloudService() {
	// initialize the dropbox service
	initialDropboxService();
	
	// initial github service
	initialGithubService();
}

/*
 * desc : initialization
 */
$(function() {
	// initial check and show selected parameters
	showParas();

	// initialize editor
	setEditorEnv();

	// activate when editor is edited
	editor.getSession().on('change', function(e) {
		// remove the error marker when editing the line
		removeLineMarker("partial");
	});

	// initial cloud service
	initialDropboxService();
	
	// initial github service
	initialGithubService();
		
});

/*
 * desc: at the end of all doms ready
 */
window.onload = function() {
  console.log("Window onload starts.");

  $('.version-selector').click(function() {
    showParas();
  });
};
