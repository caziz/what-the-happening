var express = require('express');
var sqlite3 = require('sqlite3');
var mustacheExpress = require('mustache-express');

var app = express();
app.use(express.bodyParser());
app.disable('view cache');
app.engine('html', mustacheExpress());
app.set('view engine', 'mustache');

var db = new sqlite3.Database("events.db");

function newEvent(name, starttime, endtime, info, loc, lat, long) {
     db.run("INSERT INTO events (Name, StartTime, EndTime, Info, Location, Longitude, Latitude) VALUES(?, ?, ?, ?, ?, ?, ?)",
            name, starttime, endtime, info, loc, long, lat);
}

function loadEvents(callBack) {
     var result = [];
     db.each("select * from events where EndTime > time() order by StartTime asc", function(err, resp) {
          result.push(resp);
     },
     function() {
          callBack(result);
     });
}

function formatDate(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
}

app.get('/', function(req, resp) {
     loadEvents(function(events) {
          for (var i = 0; i < events.length; i++) {
               events[i]["Info"] = events[i]["Info"].split("\n");
               events[i]["StartTime"] = formatDate(new Date(events[i]["StartTime"]));
               events[i]["EndTime"] = formatDate(new Date(events[i]["EndTime"]));
          }
          resp.render(__dirname + "/client/index.html", {"events": events});
     });
});

app.use(express.static(__dirname + '/client'));

app.post('/newevent', function (req, res) {
     // name, starttime, endtime, info, loc, lat, long
     newEvent(req.body["name"], req.body["starttime"], req.body["endtime"],
              req.body["info"], req.body["loc"], req.body["lat"],
              req.body["long"]);
     res.redirect('/');
});

app.listen(process.env.PORT, function () {
  console.log('Server started!')
})

