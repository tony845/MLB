//http://statsapi.mlb.com/docs/
//https://github.com/baseballhackday/data-and-resources/wiki/Resources-and-ideas

$(document).ready(function(){
	//http://m.mlb.com/gameday/red-sox-vs-yankees/2016/07/15/448204#game=448204,game_state=final,game_tab=box
	
	var players={"batters":[], "pitchers":[], "teams":[]};
	//var fields_b = ["name_display_first_last","team","ab","r","h","rbi","bb","so","sb","d","t","hr","avg","s_hr","s_r","s_rbi","obp","slg","s_so"];
	//var fields_p=["name_display_first_last","team","out","h","r","er","bb","so","era","s_ip","s_so","w","sv","hld"];
	var fields_b = ["name","team","atBats","runs","hits","rbi","baseOnBalls","strikeOuts","stolenBases","doubles","triples","homeRuns","s_avg","s_homeRuns","s_runs","s_rbi","s_obp","s_slg","s_strikeOuts"];
	var fields_p=["name","team","inningsPitched","hits","runs","earnedRuns","baseOnBalls","strikeOuts","s_era","s_inningsPitched","s_strikeOuts","s_wins","s_saves","s_holds"];
	var prev_team;
	
	var startDate = new Date();
	startDate.setDate(startDate.getDate()-1);
	//if (startDate > new Date(2017,9,1)) startDate = new Date(2017,9,1);		//CAP AT LAST DAY OF REGULAR SEASON
	
	$("#datepicker").val((startDate.getMonth()+1) + "/" + startDate.getDate() + "/" + startDate.getFullYear() );	
	
	$( "#datepicker" ).datepicker(
		{defaultDate: startDate, //-1,
			onSelect: function(dateText){
				GetDayData(new Date(dateText));
			}
		});
	
	GetDayData($( "#datepicker" ).datepicker( "getDate" ));
	
	
	function GetDayData(boxdate){
		console.log(boxdate);
		
		var today = boxdate; // new Date(2016, 6, 15);
		var year = today.getFullYear();
		var month = today.getMonth()+1;
		if (month<10) month = "0" + month;
		var day = today.getDate();
		if (day<10) day = "0" + day;
		//var date = year + "_" + month + "_" + day;
		////var path = "http://gd2.mlb.com/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/gid_" + date + "_bosmlb_nyamlb_1/boxscore.json";
		//var path_day = "http://gd2.mlb.com/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/miniscoreboard.json";
		var date = month + "/" + day + "/" + year;
		var path_day = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=" + date + "&fields=dates,games,gamePk,status,codedGameState";
		
		//callback=?  https://stackoverflow.com/questions/6396623/jquery-getjson-access-control-allow-origin-issue
		//path_day="http://gd2.mlb.com/components/game/mlb/year_2017/month_06/day_12/miniscoreboard.json?callback=jQuery1124010225989694133197_1497384738587&_=1497384738588"
		
		$.getJSON(path_day, function(data){									
			players={"batters":[], "pitchers":[], "teams":[]};	//reset
			var calls=[];
			for (var i = 0; i<data.dates[0].games.length; i++){
				if (data.dates[0].games[i].status.codedGameState=="F"){
					var path_game = "https://statsapi.mlb.com/api/v1/game/" + data.dates[0].games[i].gamePk + "/boxscore";
					calls.push(GetGameData(path_game, players));	//put all function calls (deferred objects) into array to run logic once all are done (cause getJSON is asynchronous)
				}
			}			
			
			$.when.apply($, calls).done(function(){				//APPLY: http://stackoverflow.com/questions/5627284/pass-in-an-array-of-deferreds-to-when  WHEN: https://api.jquery.com/jquery.when/
				console.log("done:" + players.batters.length);
				//console.log(calls);
				$("#chart tbody").empty();
				
				console.log(players.batters.length);
				players.batters.sort(NameSort);
				$("#b_body").append(WriteBatters(fields_b, players.batters ));
				if ($("#batters").css("display") != "none" && ! $("#batters th").hasClass("floatThead-col") )  $("#batters").floatThead();		//RUN ON FIRST PAGE LOAD ONLY, WHEN TABLE IS NOT HIDDEN AND floatThead HASN'T BEEN RUN BEFORE
				
				console.log(players.pitchers.length);
				players.pitchers.sort(NameSort);
				$("#p_body").append(WritePitchers(fields_p, players.pitchers ));
				
				players.teams.sort(function(a, b){
					return (a.long < b.long ? -1: a.long > b.long ? 1 : 0)
				});
				players.teams.unshift({short:"All", long:"All"});
				$("#teams").empty();
				$("#teams").append(WriteTeams(players.teams ));
			});
		});
	};
	
	function GetGameData(path, players){
		var deferred = $.getJSON(path, function(data) {		//https://api.jquery.com/category/deferred-object/  &  http://api.jquery.com/jquery.ajax/
			
			for (var i=0; i<=1; i++){		//ONLY TAKE FROM THE PLAYERS OBJECT THOSE IDS THAT APPEAR IN BATTERS/PITCHERS ARRAYS, AND ADD TEAM NAME
				var homeAway = i==0 ? "home" : "away";
				players.teams.push({short: data.teams[homeAway].team.abbreviation, long: data.teams[homeAway].team.shortName});
				
				for (var j=0; j<=1; j++){
					var battersPitchers = j==0? "batters" : "pitchers";
					
					for (var k=0; k<data.teams[homeAway][battersPitchers].length; k++){
						var player = data.teams[homeAway].players["ID" + data.teams[homeAway][battersPitchers][k]];
						player.team = data.teams[homeAway].team.abbreviation;
						player.name = player.person.fullName;
						players[battersPitchers].push(player);
					}
				}
			}			
		}).done(function(){
			//console.log(players.batters.length);
			//return players.batters.length;
			})
			.error(function(data, status){
				//console.log("error");
				//console.log(status);
			});
		//console.log("statustext:");
		//console.log(deferred);
		return deferred;	
	};
	
	function WriteBatters(fields, players){
		for (var i=0; i<players.length; i++){
			if(players[i].position.abbreviation != "P") {
				//console.log(players[i].person.fullName);
				var row = row + "<tr class='" + players[i].team + "'>";
				row += "<td><a href='http://m.mlb.com/player/" + players[i].person.id + "' target=_'blank'>" + players[i].person.fullName + "</a></td>";	//https://www.w3schools.com/html/html_links.asp
				for (var j=1; j<fields.length; j++){
					if (fields[j]=="name" || fields[j]=="team"){
						var value = players[i][fields[j]];
					}else if (fields[j].startsWith("s_")){		//SEASON STATS
						value = players[i].seasonStats.batting[fields[j].substr(2)];		//USE substr TO IGNORE THE s_ PREFIX
					}else{
						value = players[i].stats.batting[fields[j]]; 
					}
					row= row +  "<td>" + value + "</td>";
				}
				row = row + "</tr>";
			}
		}
		return row;
	};
	
	function WritePitchers(fields, players){
		for (var i=0; i<players.length; i++){
			
			var row = row + "<tr class='" + players[i].team + "'>";
			row += "<td><a href='http://m.mlb.com/player/" + players[i].person.id + "' target=_'blank'>" + players[i].person.fullName + (players[i].stats.pitching.note? " " + players[i].stats.pitching.note: "")  + "</a></td>";	//https://www.w3schools.com/html/html_links.asp
			
			for (var j=1; j<fields.length; j++){
				if (fields[j]=="name" || fields[j]=="team"){
						var value = players[i][fields[j]];
					}else if (fields[j].startsWith("s_")){		//SEASON STATS
						value = players[i].seasonStats.pitching[fields[j].substr(2)];		//USE substr TO IGNORE THE s_ PREFIX
					}else{
						value = players[i].stats.pitching[fields[j]]; 
					}
				row= row +  "<td>" + value + "</td>";
			}
			row = row + "</tr>";
		}

		return row;
	};
	
	function WriteTeams(teams){
		for (var i = 0; i < teams.length; i++){
			var items = items +  "<option value=\"" + teams[i].short + "\">" + teams[i].long + "</option>";
		}
		return items;
	}
	
	function NameSort(a, b){
		
		var a_name = a.name.split(" ");
		a_name = a_name[1] + a_name[0];	//REVERSE LASTNAME-FIRSTNAME
		
		var b_name = b.name.split(" ");
		b_name = b_name[1] + b_name[0];
		
		return (a_name < b_name ? -1: a_name > b_name ? 1: 0 );
	}
	
	function PropSort(prop, stats, battingPitching){			//http://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value-in-javascript
		if (prop=="name") return NameSort
		else if (prop=="team"){		//text sort
			return function (a, b) {
				return (a[prop] < b[prop] ? -1: a[prop] > b[prop] ? 1:  NameSort(a, b));		//ASCENDING ORDER, IF TIE SORT BY NAME
			}
		} else{									//numerical sort
			return function (a, b) {
				//return (a[prop] < b[prop] ? 1: a[prop] > b[prop] ? -1:  NameSort(a, b));		//DESCENDING ORDER, IF TIE SORT BY NAME
				return (b[stats][battingPitching][prop] - a[stats][battingPitching][prop] !=0 ? b[stats][battingPitching][prop] - a[stats][battingPitching][prop] : NameSort(a, b));		//DESCENDING ORDER, IF TIE SORT BY NAME
			}
		}
	};
	
	$("#navbar li:first-child").click(function(){
		$("#pitchers").hide();
		$("#pitchers").floatThead('destroy');
		$("#batters").show();
		$("#batters").floatThead();
		$("#navbar li:nth-child(2)").removeClass("selected");
		$("#navbar li:first-child").addClass("selected");
	});
	
	$("#navbar li:nth-child(2)").click(function(){
		$("#batters").hide();
		$("#batters").floatThead('destroy');
		$("#pitchers").show();
		$("#pitchers").floatThead();
		$("#navbar li:first-child").removeClass("selected");
		$("#navbar li:nth-child(2)").addClass("selected");
	});
	
	
	$("#chart th").click(function(){
		//console.log($(this).get(0))				//https://api.jquery.com/get/
		var field = $(this).get(0).innerHTML;	//https://www.w3schools.com/jsref/dom_obj_all.asp
		
		$("#chart th").removeClass("selected");
		$(this).addClass("selected");
		
		var arr = $("#batters").css("display")=="none" ? players.pitchers: players.batters ;	
		var battingPitching = $("#batters").css("display")=="none" ? "pitching": "batting";
		
		switch (field){
			case "AB":
				field = "atBats"; break;
			case "R":
				field = "runs"; break;
			case "H":
				field = "hits"; break;
			case "BB":
				field = "baseOnBalls"; break;
			case "SO":
				field = "strikeOuts"; break;
			case "SB":
				field = "stolenBases"; break;
			case "2B": 
				field = "doubles"; break;
			case "3B": 
				field = "triples"; break;
			case "HR":
				field = "homeRuns"; break;
			case "HRs":
				field = "s_homeRuns"; break;
			case "Rs":
				field = "s_runs"; break;
			case "RBIs":
				field = "s_rbi"; break;
			case "OBP":
				field = "s_obp"; break;
			case "SLG":
				field = "s_slg"; break;
			case "Ks":
				field = "s_strikeOuts"; break;
			case "IP":
				field = "inningsPitched"; break;
			case "ER":
				field = "earnedRuns"; break;
			case "ERA":
				field = "s_era"; break;
			case "IPs":
				field = "s_inningsPitched"; break;
			case "W":
				field = "s_wins"; break;
			case "SV":
				field = "s_saves"; break;
			case "HLD":
				field = "s_holds"; break;
			default:
				field = field.toLowerCase();
		}
		
		if (field.startsWith("s_")){
			field = field.substr(2);
			var stats = "seasonStats";
		}else{
			stats = "stats";
		}
		
		arr.sort(PropSort(field, stats, battingPitching));
		
		if ($("#batters").css("display")=="none"){
			$("#p_body").empty();
			$("#p_body").append(WritePitchers(fields_p, arr ));
		}else{
			$("#b_body").empty();
			$("#b_body").append(WriteBatters(fields_b, arr ));
		}
		
		//$("#teams").val("All");
		if ( $("#teams").val() != "All") FilterTeam();
		
	}); 
	
	$("#teams").change(FilterTeam);
	
	function FilterTeam(){
		var team = $("#teams").val();
		//console.log(team);
		
		$("#chart tbody tr" ).show();
		
		if (team != "All") {
			$("#chart tbody tr:not(." + team +")" ).hide();
			
			//http://stackoverflow.com/questions/5545649/can-i-combine-nth-child-or-nth-of-type-with-an-arbitrary-selector			
			$("#chart tbody tr." + team + ":even").css("background-color" , "#eee");		//https://api.jquery.com/even-selector/
			$("#chart tbody tr." + team + ":odd").css("background-color" , "white");
		}
		
		if (prev_team!=null && prev_team!="All" && prev_team!=team){
			//$("#chart tbody tr." + prev_team).removeAttr("style");
			$("#chart tbody tr." + prev_team).css("background-color" , "");
		}
		prev_team=team;
	};
	
});