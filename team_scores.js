$(document).ready(function(){
	
	var teams={};
	
	$( "#datepicker" ).datepicker(
		{defaultDate: new Date(2017,3,2), //-1,
			onSelect: function(dateText){
				GetScoresSince(new Date(dateText));
			}
		});
		
	GetScoresSince($( "#datepicker" ).datepicker( "getDate" ));
	
	
	function GetScoresSince(boxdate){
		var today = new Date();
		today.setDate(today.getDate()-1);
		teams={};		//reset
		var calls=[];
			
		while (boxdate < today){
			calls.push(GetDayData(boxdate));		//put all function calls (deferred objects) into array to run logic once all are done (cause getJSON is asynchronous)
			console.log(boxdate);
			boxdate.setDate(boxdate.getDate()+1);
		}
		
		$.when.apply($, calls).done(function(){				//APPLY: http://stackoverflow.com/questions/5627284/pass-in-an-array-of-deferreds-to-when
			var arrTeams =[];
			if (document.location.href.endsWith("phoenix.html")) var names = SetNames();		//https://www.w3schools.com/jsref/obj_location.asp
			
			for (var prop in teams){
				arrTeams.push({name: prop, scores:teams[prop], count: teams[prop].filter(function(x){return true}).length} );		//http://stackoverflow.com/questions/6265940/count-empty-values-in-array
			}
			arrTeams.sort(function(a,b){
				return(a.count > b.count? -1: a.count<b.count? 1: a.name<b.name? -1: 1)
			});
			
			$("#teams tbody").empty();
			
			for (var i = 0; i<arrTeams.length; i++){
				var team = arrTeams[i];
				if (team.scores.length<14) team.scores[13]="";		//to force an array of 0-13
				var row = row + "<tr>" + "<td>" + team.name + "</td>";
				if (names) row += "<td>" + names[team.name] + "</td>";
				
				for (var j=0; j<team.scores.length; j++){ 
					row += "<td>" + (team.scores[j]==null? "" : team.scores[j].slice(5)) + "</td>";
				}
				row = row + "<td>" + team.count + "</td></tr>";
			}
			
			/*
			for (var prop in teams){
				if (teams[prop].length<14) teams[prop][13]="";		//to force an array of 0-13
				var row = row + "<tr>" + "<td>" + prop + "</td>";
				for (i=0; i<teams[prop].length; i++){ 
					row += "<td>" + (teams[prop][i]==null? "" : teams[prop][i].slice(5)) + "</td>";
				}
				row = row + "</tr>";
			}*/
			$("#teams tbody").append(row);
		});
	}
	
	function GetDayData(boxdate){		
		var today = boxdate; 
		var year = today.getFullYear();
		var month = today.getMonth()+1;
		if (month<10) month = "0" + month;
		var day = today.getDate();
		if (day<10) day = "0" + day;
		var date = year + "_" + month + "_" + day;
		var path_day = "http://gd2.mlb.com/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/miniscoreboard.json";
		
		var deferred = $.getJSON(path_day, function(json){
	
			for (var i = 0; i<json.data.games.game.length; i++){
				var game = json.data.games.game[i];
				
				if (!teams[game.home_team_city]) teams[game.home_team_city]=[];
				if (!teams[game.away_team_city]) teams[game.away_team_city]=[];
				
				game.home_team_runs = Math.min(game.home_team_runs, 13);
				game.away_team_runs = Math.min(game.away_team_runs, 13);
				if (teams[game.home_team_city][game.home_team_runs]==null || game.original_date < teams[game.home_team_city][game.home_team_runs]){
					teams[game.home_team_city][game.home_team_runs] = game.original_date;
				}
				if (teams[game.away_team_city][game.away_team_runs]==null || game.original_date < teams[game.away_team_city][game.away_team_runs]){
					teams[game.away_team_city][game.away_team_runs] = game.original_date;
				}
			}
		});
		return deferred;
	};
	
	/*
	$("#usernames").change(function(){		
		var reader = new FileReader();
		
		reader.onload = function(){
			console.log(reader);
			//console.log(reader.result);
			console.log("reader onload");
		};
		
		var selectedFile = document.getElementById('usernames').files[0];
		//var selectedFile = this.files[0];							//ALTERNATIVE
		//var selectedFile = $("#usernames")[0].files[0];	//ALTERNATIVE
		//console.log(selectedFile);
		
		reader.readAsText(selectedFile);

	});
	*/
	
	function SetNames(){
		return {"LA Angels":"Alex",
				"Arizona":"Frockers",
				"Colorado":"VJ",
				"Oakland":"Shrugs",
				"San Francisco":"PTK",
				"Seattle":"Arun",
				"Tampa Bay":"PTK",
				"Atlanta":"Arun",
				"Chi Cubs":"Tony",
				"Cincinnati":"Eric",
				"Cleveland":"Shrugs",
				"Houston":"Chris",
				"LA Dodgers":"Tim",
				"Milwaukee":"Tony",
				"Minnesota":"Alex",
				"NY Yankees":"Paul",
				"San Diego":"Arun",
				"Texas":"Tom",
				"Toronto":"Tom",
				"Washington":"Pete M",
				"Boston":"Tim",
				"Chi White Sox":"Arun",
				"Detroit":"Khanh",
				"Miami":"Khanh",
				"Kansas City":"VJ",
				"NY Mets":"Chris",
				"Philadelphia":"Frockers",
				"Pittsburgh":"Eric",
				"St. Louis":"Paul",
				"Baltimore":"Pete M"
		}
	}
	
});