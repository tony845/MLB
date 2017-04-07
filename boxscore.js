$(document).ready(function(){
	//http://m.mlb.com/gameday/red-sox-vs-yankees/2016/07/15/448204#game=448204,game_state=final,game_tab=box
	
	var players={"batters":[], "pitchers":[], "teams":[]};
	var fields_b = ["name_display_first_last","team","ab","r","h","rbi","bb","so","sb","d","t","hr","avg","s_hr","s_r","s_rbi"];
	var fields_p=["name_display_first_last","team","out","h","r","er","bb","so","era"];
	var prev_team;
	
	$( "#datepicker" ).datepicker(
		{defaultDate: -1,
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
		var date = year + "_" + month + "_" + day;
		//var path = "http://gd2.mlb.com/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/gid_" + date + "_bosmlb_nyamlb_1/boxscore.json";
		var path_day = "http://gd2.mlb.com/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/miniscoreboard.json";
		
		$.getJSON(path_day, function(data){
			players={"batters":[], "pitchers":[], "teams":[]};	//reset
			var calls=[];
			for (var i = 0; i<data.data.games.game.length; i++){
				if (data.data.games.game[i].status=="Final"){
					var path_game =  "http://gd2.mlb.com/" + data.data.games.game[i].game_data_directory + "/boxscore.json";
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

			for (var i =0; i<=1; i++){			//add team names
				for (var j=0; j<data.data.boxscore.batting[i].batter.length; j++){
					data.data.boxscore.batting[i].batter[j].team = data.data.boxscore.batting[i].team_flag=="home" ? data.data.boxscore.home_team_code.toUpperCase() : data.data.boxscore.away_team_code.toUpperCase();
				}
				for (j=0; j<data.data.boxscore.pitching[i].pitcher.length; j++){
					data.data.boxscore.pitching[i].pitcher[j].team = data.data.boxscore.pitching[i].team_flag=="home" ? data.data.boxscore.home_team_code.toUpperCase() : data.data.boxscore.away_team_code.toUpperCase();
				}
			}
			
			players.batters = players.batters.concat(data.data.boxscore.batting[0].batter, data.data.boxscore.batting[1].batter) ;		//COMBINE HOME AND AWAY BATTERS
			players.pitchers = players.pitchers.concat(data.data.boxscore.pitching[0].pitcher, data.data.boxscore.pitching[1].pitcher) ;	
			
			players.teams.push({short: data.data.boxscore.home_team_code.toUpperCase(), long: data.data.boxscore.home_sname});
			players.teams.push({short: data.data.boxscore.away_team_code.toUpperCase(), long: data.data.boxscore.away_sname});
			
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
			if(players[i].pos != "P") {
				//console.log(players[i].name_display_first_last);
				var row = row + "<tr class='" + players[i].team + "'>";
				for (var j=0; j<fields.length; j++){
					row= row +  "<td>" + players[i][fields[j]] + "</td>";
					//row= row +  "<td class=' " + players[i].team + " '>" + players[i][fields[j]] + "</td>";
				}
				row = row + "</tr>";
			}
		}
		return row;
	};
	
	function WritePitchers(fields, players){
		for (var i=0; i<players.length; i++){

			var row = row + "<tr class='" + players[i].team + "'>";
			for (var j=0; j<fields.length; j++){
				var value = players[i][fields[j]];
				if (players[i].note && fields[j]=="name_display_first_last") value += " " + players[i].note;
				if (fields[j]=="out") value = Math.floor(value/3) + (value % 3 > 0 ? "." + value % 3 : null) ;
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
		var a_name = a.name + a.name_display_first_last.slice(0, a.name_display_first_last.search(" "));
		var b_name = b.name + b.name_display_first_last.slice(0, b.name_display_first_last.search(" "));
		return (a_name < b_name ? -1: a_name > b_name ? 1: 0 );
	}
	
	function PropSort(prop){			//http://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value-in-javascript
		if (prop=="name") return NameSort
		else if (prop=="team"){		//text sort
			return function (a, b) {
				return (a[prop] < b[prop] ? -1: a[prop] > b[prop] ? 1:  NameSort(a, b));		//ASCENDING ORDER, IF TIE SORT BY NAME
			}
		} else{									//numerical sort
			return function (a, b) {
				//return (a[prop] < b[prop] ? 1: a[prop] > b[prop] ? -1:  NameSort(a, b));		//DESCENDING ORDER, IF TIE SORT BY NAME
				return (b[prop] - a[prop] !=0 ? b[prop] - a[prop] : NameSort(a, b));		//DESCENDING ORDER, IF TIE SORT BY NAME
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
		
		switch (field){
			case "2B": 
				field = "d"; break;
			case "3B": 
				field = "t"; break;
			case "HRs":
				field = "s_hr"; break;
			case "Runs":
				field = "s_r"; break;
			case "RBIs":
				field = "s_rbi"; break;
			case "IP":
				field = "out"; break;
			default:
				field = field.toLowerCase();
		}
		arr.sort(PropSort(field));
		
		if ($("#batters").css("display")=="none"){
			$("#p_body").empty();
			$("#p_body").append(WritePitchers(fields_p, arr ));
		}else{
			$("#b_body").empty();
			$("#b_body").append(WriteBatters(fields_b, arr ));
		}
	});

	$("#teams").change(function(){
		var team = $("#teams").val();
		//console.log(team);
		
		$("#chart tbody tr" ).show();
		
		if (team != "All") {
			$("#chart tbody tr:not(." + team +")" ).hide();
			
			//http://stackoverflow.com/questions/5545649/can-i-combine-nth-child-or-nth-of-type-with-an-arbitrary-selector			
			$("#chart tbody tr." + team + ":even").css("background-color" , "#eee");		//https://api.jquery.com/even-selector/
			$("#chart tbody tr." + team + ":odd").css("background-color" , "white");
		}
		
		if (prev_team!=null && prev_team!="All"){
			//$("#chart tbody tr." + prev_team).removeAttr("style");
			$("#chart tbody tr." + prev_team).css("background-color" , "");
		}
		prev_team=team;
		
	});	
		
});