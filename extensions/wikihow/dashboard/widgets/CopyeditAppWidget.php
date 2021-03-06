<?

class CopyeditAppWidget extends DashboardWidget {

	public function __construct($name) {
		parent::__construct($name);
	}

	/*
	 * Returns the start link for this widget
	 */
	public function getStartLink($showArrow, $widgetStatus){
		if($widgetStatus == DashboardWidget::WIDGET_ENABLED)
			$link = "<a href='/Special:EditFinder/Copyedit' class='comdash-start'>Start";
		else if($widgetStatus == DashboardWidget::WIDGET_LOGIN)
			$link = "<a href='/Special:Userlogin?returnto=Special:EditFinder/Copyedit' class='comdash-login'>Login";
		else if($widgetStatus == DashboardWidget::WIDGET_DISABLED)
			$link = "<a href='/Become-a-New-Article-Booster-on-wikiHow' class='comdash-start'>Start";
		if($showArrow)
			$link .= " <img src='" . wfGetPad('/skins/owl/images/actionArrow.png') . "' alt=''>";
		$link .= "</a>";

		return $link;
	}

	public function getMWName(){
		return "Copyedit";
	}

	/**
	 *
	 * Provides the content in the footer of the widget
	 * for the last contributor to this widget
	 */
	public function getLastContributor(&$dbr){
		$sql = "";
		$bots = WikihowUser::getBotIDs();

		if(sizeof($bots) > 0) {
			$sql = "log_user NOT IN (" . $dbr->makeList($bots) . ")";
		}

		// Note log_type == EF_copyedi, not EF_copyediT.  wiki log types can only be 10 chars, so truncating
		if($sql != "")
			$res = $dbr->select('logging', array('*'), array('log_type' => 'EF_copyedi', $sql), 'CopyeditAppWidget::getLastContributor', array("ORDER BY"=>"log_timestamp DESC", "LIMIT"=>1));
		else
			$res = $dbr->select('logging', array('*'), array('log_type' => 'EF_copyedi'), 'CopyeditAppWidget::getLastContributor', array("ORDER BY"=>"log_timestamp DESC", "LIMIT"=>1));
		$row = $dbr->fetchObject($res);
		$res->free();

		return $this->populateUserObject($row->log_user, $row->log_timestamp);
	}

	/**
	 *
	 * Provides the content in the footer of the widget
	 * for the top contributor to this widget
	 */
	public function getTopContributor(&$dbr){
		$startdate = strtotime("7 days ago");
		$starttimestamp = date('YmdG',$startdate) . floor(date('i',$startdate)/10) . '00000';

		$sql = "";
		$bots = WikihowUser::getBotIDs();

		if(sizeof($bots) > 0) {
			$sql = "log_user NOT IN (" . $dbr->makeList($bots) . ")";
		}

		// Note log_type == EF_copyedi, not EF_copyediT.  wiki log types can only be 10 chars, so truncating
		if($sql != "")
			$res = $dbr->select('logging', array('*', 'count(*) as C', 'MAX(log_timestamp) as log_recent'), array('log_type' => 'EF_copyedi', 'log_timestamp >= "' . $starttimestamp . '"', $sql), 'CopyeditAppWidget::getTopContributor', array("GROUP BY" => 'log_user', "ORDER BY"=>"C DESC", "LIMIT"=>1));
		else
			$res = $dbr->select('logging', array('*', 'count(*) as C', 'MAX(log_timestamp) as log_recent'), array('log_type' => 'EF_copyedi', 'log_timestamp >= "' . $starttimestamp . '"'), 'CopyeditAppWidget::getTopContributor', array("GROUP BY" => 'log_user', "ORDER BY"=>"C DESC", "LIMIT"=>1));
		$row = $dbr->fetchObject($res);
		$res->free();

		return $this->populateUserObject($row->log_user, $row->log_recent);
	}

	/**
	 * Provides names of javascript files used by this widget.
	 */
	public function getJSFiles() {
		return array('CopyeditAppWidget.js');
	}

	/**
	 * Provides names of CSS files used by this widget.
	 */
	public function getCSSFiles() {
		return array('CopyeditAppWidget.css');
	}

	/*
	 * Returns the number of images left to be added.
	 */
	public function getCount(&$dbr){
		return EditFinder::getUnfinishedCount($dbr, 'Copyedit');
	}

	public function getUserCount(){
		$standings = new EditFinderStandingsIndividual('copyedit');
		$data = $standings->fetchStats();
		return $data['week'];
	}

	public function getAverageCount(){
		$standings = new EditFinderStandingsGroup('copyedit');
		return $standings->getStandingByIndex(self::GLOBAL_WIDGET_MEDIAN);
	}

	/**
	 *
	 * Gets data from the Leaderboard class for this widget
	 */
	public function getLeaderboardData(&$dbr, $starttimestamp){

		$data = Leaderboard::getArticlesRepaired($starttimestamp, 'copyedit');
		arsort($data);

		return $data;

	}

	public function getLeaderboardTitle(){
		return "<a href='/Special:Leaderboard/repair_copyedit?period=7'>" . $this->getTitle() . "</a>";
	}

	public function isAllowed($isLoggedIn, $userId=0){
		if(!$isLoggedIn)
			return false;
		else
			return true;
	}

}
