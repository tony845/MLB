$(document).ready(function(){
	
	var teams={};
	
	var startDate = new Date();
	startDate.setMonth(startDate.getMonth()-1);
	startDate.setDate(1);
	//if (startDate > new Date(2017,8,1)) startDate = new Date(2017,8,1);
	
	$("#datepicker").val((startDate.getMonth()+1) + "/" + startDate.getDate() + "/" + startDate.getFullYear() );	
	
	$("#datepicker").datepicker(
		{defaultDate: startDate, //-1,
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
			$("#teams tbody").append(row);
			
			if (document.location.href.endsWith("phoenix.html")){
				
				var winners = arrTeams.filter(function(team){return team.count >= 14}).slice(0,3);		//take the top 3 winners
				//console.log(winners);
				
				if (winners.length>0){
					winners.forEach(function(team){
						//team.maxDate = Math.max(...team.scores);	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator
						team.maxDate = team.scores.reduce(function(max, curr){return curr > max ? curr : max});
						//console.log(team);
					});	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach  
					
					winners.sort(function(a,b){ return a.maxDate < b.maxDate ? -1 : a.maxDate > b.maxDate ? 1 : 0});
					
					row="";
					winners.forEach(function(team, i){
						switch(i){
							case 0: var place="Winner: "; break;
							case 1: place = "Second: "; break;
							case 2: place = "Third: "; break;
						}
						row += "<tr><td>" + place + "</td><td>" + names[team.name]  +  " </td><td>" + team.maxDate.slice(5) + "</td></tr>";
					});
					
					$("#winners tbody").append(row);
					$("#winners").show();
				}
			}
		});
	}
	
	function GetDayData(boxdate){		
		var today = boxdate; 
		var year = today.getFullYear();
		var month = today.getMonth()+1;
		if (month<10) month = "0" + month;
		var day = today.getDate();
		if (day<10) day = "0" + day;
		//var date = year + "_" + month + "_" + day;
		//var path_day = "http://gd2.mlb.com/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/miniscoreboard.json";
		var date = month + "/" + day + "/" + year;
		var path_day = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=" + date
		
		var deferred = $.getJSON(path_day, function(json){
			
			if (json.totalGames==0) return;
			
			for (var i = 0; i<json.dates[0].games.length; i++){
				if (json.dates[0].games[i].status.codedGameState != 'F') continue;
				var game = json.dates[0].games[i].teams;
				var gameDate = json.dates[0].date.replace(/-/g, "/");
				
				if (!teams[game.home.team.name]) teams[game.home.team.name]=[];
				if (!teams[game.away.team.name]) teams[game.away.team.name]=[];
				
				//game.home_team_runs = Math.min(game.home_team_runs, 13);
				//game.away_team_runs = Math.min(game.away_team_runs, 13);
				if ((teams[game.home.team.name][game.home.score]==null || gameDate < teams[game.home.team.name][game.home.score])
					&& game.home.score<=13){
					teams[game.home.team.name][game.home.score] = gameDate;
				}
				if ((teams[game.away.team.name][game.away.score]==null || gameDate < teams[game.away.team.name][game.away.score])
					&& game.away.score<=13){
					teams[game.away.team.name][game.away.score] = gameDate;
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
		return {"Los Angeles Angels":"Alex",
				"Arizona Diamondbacks":"Frockers",
				"Colorado Rockies":"VJ",
				"Oakland Athletics":"Shrugs",
				"San Francisco Giants":"PTK",
				"Seattle Mariners":"Arun",
				"Tampa Bay Rays":"PTK",
				"Atlanta Braves":"Arun",
				"Chicago Cubs":"Tony",
				"Cincinnati Reds":"Eric",
				"Cleveland Indians":"Shrugs",
				"Houston Astros":"Chris",
				"Los Angeles Dodgers":"Tim",
				"Milwaukee Brewers":"Tony",
				"Minnesota Twins":"Alex",
				"New York Yankees":"Paul",
				"San Diego Padres":"Arun",
				"Texas Rangers":"Tom",
				"Toronto Blue Jays":"Tom",
				"Washington Nationals":"Pete M",
				"Boston Red Sox":"Tim",
				"Chicago White Sox":"Arun",
				"Detroit Tigers":"Khanh",
				"Miami Marlins":"Khanh",
				"Kansas City Royals":"VJ",
				"New York Mets":"Chris",
				"Philadelphia Phillies":"Frockers",
				"Pittsburgh Pirates":"Eric",
				"St. Louis Cardinals":"Paul",
				"Baltimore Orioles":"Pete M"
		}
	}
	
});