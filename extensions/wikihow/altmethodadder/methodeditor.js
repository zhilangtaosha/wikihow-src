var toolURL = "/Special:MethodEditor";
var methodId;
var articleId;
var LEADERBOARD_REFRESH = 10 * 60;
var editUrl;
var editClose;
var pue_preview;
var pue_diff;
// set to true to write debug response data to the console
var debug = false;
var hasMethodChanges = false;
var hasQuickEditChanges = false;

$( document ).on( "click", "#method_delete", function(e) {
	e.preventDefault();
	if (confirmMethodDiscard() && !jQuery(this).hasClass('clickfail')) {
		clearTool();
		$.post(toolURL, {
			deleteMethod: true,
			methodId: methodId,
			articleId: articleId,
			method: jQuery("#method_method").val(),
			steps: jQuery("#method_steps").val()
			},
			function (result) {
				loadResult(result);
				incrementStats();
			},
			'json'
		);
		window.oTrackUserAction();
	}
});

$( document ).one('keyup', '#method_method', function(e) {
	$('#method_keep').html('Save');
});

$( document ).on( "click", "#method_keep", function(e) {
	e.preventDefault();

	if (!jQuery(this).hasClass('clickfail')) {
		clearTool();
		$.post(toolURL, {
			keepMethod: true,
			articleId: articleId,
			methodId: methodId,
			method: jQuery("#method_method").val(),
			steps: jQuery("#method_steps").val()
			},
			function (result) {
				loadResult(result);
				incrementStats();
			},
			'json'
		);
		window.oTrackUserAction();
	}
});

$( document ).on( "click", "#method_skip", function(e) {
	e.preventDefault();
	if (confirmMethodDiscard() && !jQuery(this).hasClass('clickfail')) {
		clearTool();
		$.post(toolURL, {
			skipMethod: true,
			methodId: methodId,
			articleId: articleId
			},
			function (result) {
				loadResult(result);
			},
			'json'
		);
	}
});

$(document).ready(function(){
	initToolTitle();
	$("#method_editor").hide();
	$("#article").prepend("<div id='method_count' class='tool_count'><h3></h3><span>methods remaining</span></div>");
	getNextMethod();
    showBalloonAltMethod();
	window.setTimeout(updateStandingsTable, 100);

	var mod = Mousetrap.defaultModifierKeys;
	Mousetrap.bind(mod + 'd', function() {$('#method_delete').click();});
	Mousetrap.bind(mod + 's', function() {$('#method_skip').click();});
	Mousetrap.bind(mod + 'e', function() {$('#qe_button').click();});
	Mousetrap.bind(mod + 'p', function() {$('#method_keep').click();});

	$("#method_keys").click(function(e){
		e.preventDefault();
		$("#method_info").dialog({
			width: 500,
			minHeight: 300,
			modal: true,
			title: 'Method Editor Keys',
			closeText: 'Close',
			position: 'center',
		});
	});
});

// Detect changes to method title/contents and prevent user from navigating away
// Ref: Lighthouse bug #464
function blockNavigationOnChange(ids) {
    $(ids).map(function() {
        var elem = $(this);
        
        // Save current value of element
        elem.data('oldVal', elem.val());

        // Look for changes in the value
        elem.bind('keyup paste', function(event) {
            if (!(hasMethodChanges && hasQuickEditChanges) && elem.data('oldVal') != elem.val()) {
                if (!hasMethodChanges && !hasQuickEditChanges) {
                    window.onbeforeunload = function() {
                        return "If you leave this page, all changes will be lost.";
                    }
                }
                if (ids === '#wpTextbox1') {
                    hasQuickEditChanges = true;
                } else {
                    hasMethodChanges = true;
                }
            } else {
                if (ids === '#wpTextbox1') {
                    hasQuickEditChanges = false;
                } else {
                    hasMethodChanges = false;
                }
                if (!hasMethodChanges && !hasQuickEditChanges) {
                    window.onbeforeunload = null;
                }
            }
        });
    });
}

function confirmMethodDiscard() {
    if (hasMethodChanges) {
        return confirm("This will discard your method changes. Continue anyway?");
    } else {
        return true;
    }
}

function confirmQuickEditDiscard() {
    if (hasQuickEditChanges) {
        return confirm("This will discard your quick edit changes. Continue anyway?");
    } else {
        return true;
    }
}

// asks the backend for a new article
//to edit and loads it in the page
function getNextMethod() {
	$.get(toolURL,
		{getNext: true,
			ts: new Date().getTime(),
			aid: getURLParam("aid", window.location.search)
		},
		function (result) {
			loadResult(result);
		},
		'json'
	);
}

function loadResult(result) {
	if (debug == true && result['debug']) {
		console.log(result['debug']);
	}
	$("#method_waiting").hide();
	if (result['error']) {
		$("#method").hide();
		$("#method_error").html(result['error_msg']);
		$("#method_error").show();
		$("#method_count").hide();
	}
	else {
		$("#method_article").html(result['article']);
		$("#method_method").val(result['method']).focus();
		$("#method_steps").val(result['steps']); //should we munge the steps?
		$("#method_edit").html(result['quickEditUrl']);
		$("h1.firstHeading").html(result['articleTitle']);
		methodId = result['methodId'];
		articleId = result['articleId'];
		$("#method_header a").removeClass("clickfail");
		setCount(result['methodCount']);
        blockNavigationOnChange('#method_steps');
	}
}

function setCount(count) {
	$("#method_count h3").fadeOut(400, function() {
		$("#method_count h3").html(count).fadeIn();
	});
}

function clearTool() {
	$("#method_waiting").show();
	$("#method_article").html("");
	$("h1.firstHeading").text("Method Editor");
	$("#method_header a").addClass("clickfail");
    clearChanges();
}

function clearChanges(onlyQuickEdit) {
    hasMethodChanges = onlyQuickEdit ? hasMethodChanges : false;
    hasQuickEditChanges = false;
    if (!hasMethodChanges) {
        window.onbeforeunload = null;
    }
}

function showBalloonAltMethod() {
	var cookieName = 'amgrd_b';
	if ($.cookie(cookieName) != '1') {
		window.setTimeout(function(){
			$('.altmethod_bubble_outer').fadeIn('slow');
			$('#method_header').on('click', '.altmethod_x', function(e) {
				$('.altmethod_bubble_outer').fadeOut('slow');
				$.cookie(cookieName, '1');
			});
		}, 2000);
	}
}

updateStandingsTable = function() {
	var url = '/Special:Standings/MethodEditorStandingsGroup';
	$.get(url, function (data) {
		$('#iia_standings_table').html(data['html']);
	}, 'json');
	$("#stup").html(LEADERBOARD_REFRESH / 60);
	window.setTimeout(updateStandingsTable, 1000 * LEADERBOARD_REFRESH);
}

function incrementStats() {
	var statboxes = '#iia_stats_today_methodeditortool_indiv1,#iia_stats_week_methodeditortool_indiv1,#iia_stats_all_methodeditortool_indiv1,#iia_stats_group';
	$(statboxes).each(function(index, elem) {
		$(this).fadeOut(function () {
			var cur = parseInt($(this).html());
			$(this).html(cur + 1);
			$(this).fadeIn();
		});
	});
}

/*******
 *
 * This function gets called when the user clicks the quick edit button
 * This function has been copied and modified from popupEdit.js
 *
 */
function loadQuickEdit(url) {
	$("#method_header").hide();
	$("#method_editor").show();

	editUrl = url;
	$("#article_contents").html('<b>Loading...</b>');

	$.ajax({
		url: editUrl,
		success: editHandler
	});

	return false;
}

function methodEditorClose() {
    // Warn user if they've made changes.
    if (!confirmQuickEditDiscard()) {
        return;
    }

	$("#method_header").show();
	$("#method_editor").hide();
	$('html,body').animate({
		  scrollTop: $("#article").offset().top
	  }, 500);

    clearChanges(true);
}
/************
 *
 * Handles the response from the server and populates the quick edit
 * box with the correct info. Also puts the new alternate method into
 * the text.
 * This function has been copied and modified from popupEdit.js
 *
 **********/
function editHandler(data) {
	var windowText = data.replace(/<a href.*?>Cancel<\/a>/g, '<input id="wpCancel" class="button secondary submit_button" type="button" value="Cancel"  onclick="methodEditorClose();return false;">');
	document.getElementById('article_contents').innerHTML = windowText;

	restoreToolbarButtons();

	var articleText = $("#wpTextbox1").val();
	var methodName = $("#method_method").val();
	var methodText = $("#method_steps").val();
	$("<p>\""+methodName+"\" method has been added to the text below.</p>").insertBefore("#editform");

	stepsLocation = articleText.search(/^== *Steps *==/im);

	//now trim off just enough that we won't match that same section again
	partialArticleText = articleText.substring(stepsLocation + 2);
	nextSectionLocation = partialArticleText.search(/^==[ |a-z]*==/mi);
	if(stepsLocation != -1) {
		if(nextSectionLocation != -1) {
			//there's a section after steps, so put the new alternate method
			//right before that.
			adjustedNextSectionLocation = stepsLocation + 1 + nextSectionLocation;
			articleText = articleText.substring(0, adjustedNextSectionLocation) + "\n=== " + methodName + " ===\n\n" + methodText + articleText.substring(adjustedNextSectionLocation);
		}
		else {
			articleText = articleText + "\n=== " + methodName + " ===\n\n" + methodText;
		}
	}

	$("#wpTextbox1").val(articleText);

	$("#wpSummary").val("Quick edit while doing method editor");
	$("#editform").attr("target", "_blank");

	setupQuickEditButtons();
	$("#editform").attr('onsubmit', 'return submitQuickEdit();');
	$("#editform #wpTextbox1").focus();
    blockNavigationOnChange('#wpTextbox1');
}

function setupQuickEditButtons() {
	$("#wpPreview").click(function(e) {
		pue_preview=true;
		pue_diff=false;
	});
	$("#wpDiff").click(function(e) {
		pue_preview=false;
		pue_diff=true;
	});
	$("#wpSave").click(function(e) {
		pue_preview=false;
		pue_diff=false;
	});
}
/*****
 *
 * This function gets called when the user clicks the submit button
 * This function has been copied and modified from popupEdit.js
 *
 */
function submitQuickEdit() {
	var parameters = "";
	for (var i=0; i < document.editform.elements.length; i++) {
		var element = document.editform.elements[i];
		if (parameters != "") {
			parameters += "&";
		}
		if (element.name == 'wpSave' && !pue_preview && !pue_diff) {
			if (typeof handleQESubmit == 'function') {
				handleQESubmit();
			}
			editClose = true;
		}

		if ((element.name == 'wpPreview' && pue_preview) ||
			(element.name == 'wpSave' && !pue_preview) ||
			(element.name == 'wpDiff' && pue_diff)) {
			parameters += element.name + "=" + encodeURIComponent(element.value);
		} else if (element.name != 'wpDiff' && element.name != 'wpPreview' && element.name != 'wpSave' && element.name.substring(0,7) != 'wpDraft')  {
			if (element.type == 'checkbox') {
				if (element.checked) {
					parameters += element.name + "=1";
				}
			} else {
				parameters += element.name + "=" + encodeURIComponent(element.value);
			}
		}
	}
	$.ajax({
		type: "POST",
		url: editUrl,
		data: parameters,
		success: processSubmit
	});

    hasQuickEditChanges = false;
	if (!hasMethodChanges) {
        window.onbeforeunload = null;
    }

	return false; // block sending the form
}

/*******
 *
 * Handles the response from the server after the user
 * clicks the submit button.
 * This function has been copied and modified from popupEdit.js
 *
 *******/
function processSubmit(data) {
	$('html,body').animate({ scrollTop: $("#article").offset().top }, 500);

	if (pue_preview) {
		var windowText = data.replace(/<a href.*?>Cancel<\/a>/g, '<input id="wpCancel" class="button secondary submit_button" type="button" value="Cancel"  onclick="methodEditorClose();return false;">');
		document.getElementById('article_contents').innerHTML = windowText;

		restoreToolbarButtons();
		setupQuickEditButtons();
		$("#editform").attr('onsubmit', 'return submitQuickEdit();');
		$("#editform #wpTextbox1").focus();
	}
	else if (pue_diff) {
		var windowText = data.replace(/<a href.*?>Cancel<\/a>/g, '<input id="wpCancel" class="button secondary submit_button" type="button" value="Cancel"  onclick="methodEditorClose();return false;">');
		document.getElementById('article_contents').innerHTML = windowText;

		restoreToolbarButtons();
		setupQuickEditButtons();
		$("#editform").attr('onsubmit', 'return submitQuickEdit();');
		$("#editform #wpTextbox1").focus();
	}
	else {
		$("#method_header").show();
		$("#method_editor").hide();
		clearTool();
		incrementStats();
		$.post(toolURL, {
			quickEdit: true,
			methodId: methodId,
			articleId: articleId
		},
		function (result) {
			loadResult(result);
		},
		'json'
		);
	}
}

function getURLParam(param, queryString) {
	if(queryString == "")
		return false;

	var parArr = queryString.split("?")[1].split("&"),
		returnBool = true;

	for(var i = 0; i < parArr.length; i++){
		parr = parArr[i].split("=");
		if(parr[0] == param){
			return parr[1];
			returnBool = true;
		}else{
			returnBool = false;
		}
	}

	if(!returnBool) return false;
}

