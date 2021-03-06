<?php

if ( !defined('MEDIAWIKI') ) exit;

class AdminAnomalies extends UnlistedSpecialPage {

    public function __construct() {
		parent::__construct('AdminAnomalies');
	}

	private static function html() {
		global $wgTitle;
		$me = $wgTitle->getPrefixedText();
		$html = <<<EOHTML
<div style="font-size: 16px; font-variant: small-caps; letter-spacing: 2px; margin-bottom: 15px;">
    Fix Title Anomalies
</div>
<input type="text" id="terms" size="40" style="font-size: 18px;" />
<input type="button" id="gosearch" value="Search" style="font-size: 18px;" /><br>
<div>&nbsp;</div>
<script>
(function ($) {
	$(document).ready(function() {
		var me = '/{$me}';
		$('.delete').live('click', function() {
			var id = $(this).attr('id').replace(/^rm_/, '');
			$.get(me + '/delete?article=' + id,
				function() {
					$('#row_' + id)
						.html('<b>DELETED</b>')
						.fadeOut();
				});
			return false;
		});

		$('#gosearch').click(function() {
			var terms = $('#terms').val();
			if (terms) {
				$('#output').html('loading ...');
				$('#output').load(me + '/search?terms=' + encodeURIComponent(terms));
			}
			return false;
		});

		$('#terms').focus();
		$('#terms').bind('keypress', function(e) {
			if (e.keyCode == 13) {
				$('#gosearch').click();
			}
		});
	});
})(jQuery);
</script>
	<div id="output"></div>
EOHTML;
		return $html;
	}

	private static function searchHTML($terms) {
		$html = '';
		$html .= '<style>tr:nth-child(even) {background: #EEE}</style>';
		$html .= '<table>';
		$dbr = wfGetDB(DB_SLAVE);
		$terms = trim(strip_tags($terms));
		$terms = '%' . join('%', preg_split('@\s+@', $terms)) . '%';
		$res = $dbr->select(
			'page',
			array('page_title', 'page_is_redirect', 'page_id'),
			array('page_namespace' => NS_MAIN, 'LOWER(page_title) LIKE ' . $dbr->addQuotes($terms)),
			__METHOD__);
		foreach ($res as $row) {
			$id = $row->page_id;
			$title = Title::newFromDBkey($row->page_title);
			$html .= "<tr id='row_$id'>";
			$html .= '<td><a href="' . htmlspecialchars($title->getFullURL('redirect=no')) . '" target="_new">' .
				htmlspecialchars($title->getText()) . '</a>' . ($row->page_is_redirect ? ' <i>redirect</i>' : '') . '</td>';
			$html .= '<td><a href="#" class="delete" id="rm_' . $id . '">delete</a></td>';
			$html .= "</tr>\n";
		}
		$html .= "</table>";
		return $html;
	}

	public function execute($par) {
		global $wgUser, $wgRequest, $wgOut;

		$username = $wgUser->getName();
		$allowed = array('Reuben', 'Bridget8');
		$userGroups = $wgUser->getGroups();
		if ($wgUser->isBlocked()
			|| (!in_array('sysop', $userGroups)
				&& !in_array($username, $allowed)))
		{   
			$wgOut->setRobotpolicy('noindex,nofollow');
			$wgOut->showErrorPage('nosuchspecialpage', 'nospecialpagetext');
			return;
		}

		if (empty($par)) {
			$html = self::html();
			$wgOut->addHTML($html);
		} else {
			$terms = $wgRequest->getVal('terms');
			$article = $wgRequest->getVal('article');
			$error = '';
			$wgOut->setArticleBodyOnly(true);
			if ($par == 'search') {
				$html = self::searchHTML($terms);
				$wgOut->addHTML($html);
			} elseif ($par == 'rename') {
				if (!$article) {
					$error = 'no article ID';
				}
				$response = array('error' => $error);
				$wgOut->addHTML( json_encode($response) );
			} elseif ($par == 'delete') {
				$id = intval($article);
				$title = Title::newFromID($id);
				if (!$title) {
					$error = 'no article ID';
				} else {
					$article = new Article($title);
					if (!$article) {
						$error = 'no article';
					} else {
						$reason = 'Anomalous article title';
						$article->doDeleteArticle($reason);
					}
				}
				$response = array('error' => $error);
				$wgOut->clearHTML();
				$wgOut->addHTML( json_encode($response) );
			}
		}
	}

}

