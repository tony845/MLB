$(document).ready(function(){
	
	var players={"passing":[], "rushing":[], "receiving":[], "teams":[]};
	var fields_p = ["name","team","cmp","att","yds","tds","ints"];
	var fields_ru=["name","team","att","yds","tds"];
	var fields_re=["name","team","rec","yds","tds"];
	var prev_team;
	
	var origTop = $("#chart").offset().top;
	//console.log(origTop);
	$(this).scroll(function(){		//force-move the frozen headers with the underlying ones until they hit the top of the screen and then freeze 
		if (origTop - $(this).scrollTop() > 0 ){			//https://stackoverflow.com/questions/16794700/get-new-x-y-positions-of-element-after-scroll-using-jquery
			$("#headers table").css("top", origTop - $(this).scrollTop());
		}else{
			$("#headers table").css("top", 0);
		}
	});
	
	GetDayData("http://www.nfl.com/ajax/scorestrip?season=2016&seasonType=REG&week=17");
	/*True default*/ //GetDayData("http://www.nfl.com/liveupdate/scorestrip/ss.xml");
	
	//GetGameData("http://www.nfl.com/liveupdate/game-center/2016091108/2016091108_gtd.json", "2016091108", players);
	
	function GetDayData(url){
		$("#chart tbody").empty();
		$("#headers table").hide();
		$("th").removeClass("selected");
		
		$.get( url, function(data){		//https://www.w3schools.com/jquery/ajax_get.asp	
			//"http://www.nfl.com/liveupdate/scorestrip/ss.xml"
			//console.log(data);
			
			var week = data.getElementsByTagName("gms")[0].outerHTML;
			week = String(week.match(/w=\"\d{1,2}\"/));		//yields "w=\"xx\""
			week = week.slice(3).replace("\"","");					//remove w=" prefix and then " suffix
			//console.log(week);
			$("#weeknums li").css("color","");
			$("#weeknums li:nth-of-type(" + week + ")").css("color","white");
			
			players={"passing":[], "rushing":[], "receiving":[], "teams":[]};	//reset
			var calls=[];
			var games = data.getElementsByTagName("g");			//https://www.ibm.com/developerworks/xml/tutorials/x-processxmljquerytut/
			//console.log(games);
			
			for (var i=0; i<games.length; i++){
				var game = games[i].outerHTML;			
				var gameID = String(game.match(/eid=\"\d+\"/));			//yields "eid=\"2017090700\""
				gameID = String(gameID.match(/\d+/));						//yields "2017090700"
				var path = "http://www.nfl.com/liveupdate/game-center/" + gameID + "/" + gameID + "_gtd.json"
				
				calls.push(GetGameData(path, gameID, players));
				
				players.teams.push({short: String(game.match(/h=\"\w+"/)).slice(3).replace("\"",""), long: String(game.match(/hnn=\"\w+"/)).slice(5).replace("\"","")} );
				players.teams.push({short: String(game.match(/v=\"\w+"/)).slice(3).replace("\"",""), long: String(game.match(/vnn=\"\w+"/)).slice(5).replace("\"","")} );
			}
			
			$.when.apply($, calls).done(function(){
				players.teams.sort(function(a, b){
					return (a.long < b.long ? -1: a.long > b.long ? 1 : 0)
				});
				players.teams.unshift({short:"All", long:"All"});
				$("#teams").empty();
				$("#teams").append(WriteTeams(players.teams ));
				
				$("#p_body").append(WritePlayers(fields_p, players.passing.sort(NameSort) ));
				$("#ru_body").append(WritePlayers(fields_ru, players.rushing.sort(NameSort) ));
				$("#re_body").append(WritePlayers(fields_re, players.receiving.sort(NameSort) ));
				
				CreateFrozenHeader("#passing");
				CreateFrozenHeader("#rushing");
				CreateFrozenHeader("#receiving");
				
				$("#weeks").css("left", $("#rushing thead").offset().left);
			});
			
		},"xml"); 
	}
	
	function CreateFrozenHeader(table){				//http://stackoverflow.com/questions/4709390/table-header-to-stay-fixed-at-the-top-when-user-scrolls-it-out-of-view-with-jque
		var selected = $(table + "_header th").index( $(table + "_header th.selected") );		//https://api.jquery.com/index/  save off which element is selected and then restore class after recreating header
		
		$(table + "_header").empty();
		
		var headerCopy = $(table + " thead").clone();
		$(table + "_header").append(headerCopy);		
		$(table + "_header").css("top", $(table + " thead").offset().top);
		$(table + "_header").css("left", $(table + " thead").offset().left);
		
		$(table + "_header th").each(function(i){
			$(this).width($(table + " th:nth-of-type(" + (i+1) + ")").width());		//EACH STARTS AT 0, NTH-OF-TYPE STARTS AT 1
		});
		
		if (selected>=0) $(table + "_header th:nth-of-type(" + (selected+1) + ")").addClass("selected");
		
		$(table + "_header").show();		
	}
	
	function GetGameData(path, gameID, players){
		var deferred = $.getJSON(path, function(data, status) {
			var passing = data[gameID].home.stats.passing; 		//http://stackoverflow.com/questions/16908476/javascript-object-property-name-as-number
			
			for (var i =1; i<=2; i++){		//HOME THEN AWAY
				var homeaway = i==1? "home": "away";
				var stats = data[gameID][homeaway].stats;
				var team = data[gameID][homeaway].abbr;
				
				for (var player in stats.passing){
					stats.passing[player].id = player;		//ADD NFL.COM PLAYER_ID
					stats.passing[player].team = team;		//ADD TEAM
					players.passing.push(stats.passing[player]);
				}
				for (var player in stats.rushing){
					stats.rushing[player].id = player;
					stats.rushing[player].team = team;
					players.rushing.push(stats.rushing[player]);
				}
				for (var player in stats.receiving){
					stats.receiving[player].id = player;
					stats.receiving[player].team = team;
					players.receiving.push(stats.receiving[player]);
				}
			}
			//console.log(players);
			//console.log(status);
		});
		return deferred;
	}
	
	function WritePlayers(fields, players){
		for (var i=0; i<players.length; i++){
			var row = row + "<tr class='" + players[i].team + "'>";
			row += "<td><a href='http://www.nfl.com/players/profile?id=" + players[i].id + "' target=_'blank'>" + players[i].name + "</a></td>";	//https://www.w3schools.com/html/html_links.asp
			for (var j=1; j<fields.length; j++){
				row= row +  "<td>" + players[i][fields[j]] + "</td>";
			}
			row = row + "</tr>";
		}
		return row;
	}
	
	function WriteTeams(teams){
		for (var i = 0; i < teams.length; i++){
			teams[i].long = teams[i].long[0].toUpperCase() + teams[i].long.slice(1);		//CAPITALIZE
			var items = items +  "<option value=\"" + teams[i].short + "\">" + teams[i].long + "</option>";
		}
		return items;
	}
	
	function NameSort(a, b){
		var a_name = a.name.split(".");
		a_name = a_name[1] + " " + a_name[0];
		var b_name = b.name.split(".");
		b_name = b_name[1] + " " + b_name[0];
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
	
	$("#headers").on("click", "th", function(){		//http://api.jquery.com/on/  USE DELEGATED EVENT SINCE #headers TABLES ARE ADDED AT RUNTIME
		//console.log($(this).get(0));				//https://api.jquery.com/get/
		var field = $(this).get(0).innerHTML;	//https://www.w3schools.com/jsref/dom_obj_all.asp
		var table = "#" + $(this).closest("table").attr("id");		//ie table = 'passing_header'
		
		$(table + " th").removeClass("selected");
		$(this).addClass("selected");
		
		var prop = table.slice(1, table.indexOf("_"));			//ie prop = 'passing'
		var arr = players[prop];
		
		//highlight the same field on underlying table so when CreateFrozenHeader runs there's no delay in re-highlighting field
		$("#" + prop + " th").removeClass("selected");
		var selected = $(table + " th").index( $(table + " th.selected") )		//find the selected th index of passing_header
		$("#" + prop + " th:nth-of-type(" + (selected+1) + ")").addClass("selected"); 	//highlight the corresponding field in passing
		
		switch (field){
			case "Comp": 
				field = "cmp"; break;
			case "TD": 
				field = "tds"; break;
			case "INT": 
				field = "ints"; break;
			default:
				field = field.toLowerCase();
		}
		
		var fields = prop=="passing"? fields_p : prop=="rushing"? fields_ru : fields_re;
		$("#" + prop + " tbody").empty();
		$("#" + prop + " tbody").append(WritePlayers(fields, arr.sort(PropSort(field)) ));
		
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
		
		CreateFrozenHeader("#passing");
		CreateFrozenHeader("#rushing");
		CreateFrozenHeader("#receiving");
		
		//$("#teams").blur();
	};
	
	$("#selections select").mouseover(function(){
		$("#chart").addClass("blurry");
		$("#chart").fadeTo("fast", .6);
		$("#headers").addClass("blurry");
		$("#headers").fadeTo("fast", .6);
	})
	
	$("#selections select").mouseout(function(){
		$("#chart").removeClass("blurry");
		$("#chart").fadeTo("fast", 1);
		$("#headers").removeClass("blurry");
		$("#headers").fadeTo("fast", 1);
	})
	
	$("#weeknums li").click(function(){
		$("#weeknums li").css("color","");
		$(this).css("color","white");
		
		CallFromSelection();
	})
	
	$("#years").change(CallFromSelection)
	
	function CallFromSelection(){
		var year = $("#years").val();
		var week = $("#weeknums li").index( $("#weeknums li[style='color: white;']") ) + 1;
		var url = "http://www.nfl.com/ajax/scorestrip?season=" + year + "&seasonType=REG&week=" +week;
		GetDayData(url);
	}
	
});