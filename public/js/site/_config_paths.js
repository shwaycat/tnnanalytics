var globalDebugBool = true;

// Use this to store the paths for the various JSON endpoints. If this is barely used or redundant remove it.
var GLOBAL_API_DATA = {
  dashboard : {},
  facebook: {},
  twitter: {},
  instagram: {},
  google_plus: {},
  youtube: {},
  events: {}
};

if ($('body.dashboard')[0]){
  globalDebug('    API Call: dashboard');

  GLOBAL_API_DATA.dashboard = {
    "reach": createFakeData(),
    "engagement": createFakeData(),
    "acquisition": createFakeData(),
    "top_post": "",
    "top_countries": [
      {
        "label": "USA",
        "value": 50
      },
      {
        "label": "Canada",
        "value": 1
      },
      {
        "label": "Mexico",
        "value": 2
      },
      {
        "label": "England",
        "value": 3
      },
      {
        "label": "Ireland",
        "value": 5
      },
      {
        "label": "Germany",
        "value": 5
      },
      {
        "label": "Belgium",
        "value": 5
      },
      {
        "label": "Russia",
        "value": 5
      },
      {
        "label": "Japan",
        "value": 5
      },
      {
        "label": "China",
        "value": 5
      },
      {
        "label": "TaiWorld",
        "value": 5
      }

    ]
  };
  GLOBAL_API_DATA.dashboard.top_countries = simplifyData(GLOBAL_API_DATA.dashboard.top_countries);
}

if ($('body.facebook')[0]){
  globalDebug('    API Call: facebook');

  GLOBAL_API_DATA.facebook = {
    "reach": createFakeData(),
    "engagement": createFakeData(),
    "acquisition": createFakeData(),
    "top_post": "",
    "top_countries": [
      {
        "label": "USA",
        "value": 50
      },
      {
        "label": "Canada",
        "value": 1
      },
      {
        "label": "Mexico",
        "value": 2
      },
      {
        "label": "England",
        "value": 3
      },
      {
        "label": "Ireland",
        "value": 5
      },
      {
        "label": "Germany",
        "value": 5
      },
      {
        "label": "Belgium",
        "value": 5
      },
      {
        "label": "Russia",
        "value": 5
      },
      {
        "label": "Japan",
        "value": 5
      },
      {
        "label": "China",
        "value": 5
      },
      {
        "label": "TaiWorld",
        "value": 5
      }

    ]
  };
  GLOBAL_API_DATA.facebook.top_countries = simplifyData(GLOBAL_API_DATA.facebook.top_countries);
}

if ($('body.twitter')[0]){
  globalDebug('    API Call: twitter');

  GLOBAL_API_DATA.twitter = {
    "reach": createFakeData(),
    "engagement": createFakeData(),
    "acquisition": createFakeData(),
    "top_post": "",
    "top_countries": [
      {
        "label": "USA",
        "value": 50
      },
      {
        "label": "Canada",
        "value": 1
      },
      {
        "label": "Mexico",
        "value": 2
      },
      {
        "label": "England",
        "value": 3
      },
      {
        "label": "Ireland",
        "value": 5
      },
      {
        "label": "Germany",
        "value": 5
      },
      {
        "label": "Belgium",
        "value": 5
      },
      {
        "label": "Russia",
        "value": 5
      },
      {
        "label": "Japan",
        "value": 5
      },
      {
        "label": "China",
        "value": 5
      },
      {
        "label": "TaiWorld",
        "value": 5
      }

    ]
  };
  GLOBAL_API_DATA.twitter.top_countries = simplifyData(GLOBAL_API_DATA.twitter.top_countries);
}

if ($('body.instagram')[0]){
  globalDebug('    API Call: instagram');

      
}
if ($('body.youtube')[0]){
  globalDebug('    API Call: youtube');

      
}
if ($('body.google-plus')[0]){
  globalDebug('    API Call: google-plus');

      
}
if ($('body.analytics-all')[0]){
  globalDebug('    API Call: analytics-all');

      
}
if ($('body.analytics-global')[0]){
  globalDebug('    API Call: analytics-global');

      
}
if ($('body.analytics-us')[0]){
  globalDebug('    API Call: analytics-us');

      
}
if (!$('body.session')[0]){
  globalDebug('    API Call: events');

  GLOBAL_API_DATA.events = {
    "info": false,
    "events" : [
      {
        "id":"1111",
        "channel":"facebook",
        "status":"new",
        "creation": "2015-04-23T22:45:04.000Z",
        "accessed": "2015-04-23T22:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },
      {
        "id":"2222",
        "channel":"twitter",
        "status":"new",
        "creation": "2015-04-17T19:45:04.000Z",
        "accessed": "2015-04-17T20:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },
      {
        "id":"3333",
        "channel":"instagram",
        "status":"open",
        "creation": "2015-04-17T21:45:04.000Z",
        "accessed": "2015-04-17T21:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },{
        "id":"4444",
        "channel":"youtube",
        "status":"new",
        "creation": "2015-02-16T22:45:04.000Z",
        "accessed": "2015-02-16T22:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },{
        "id":"5555",
        "channel":"google+",
        "status":"closed",
        "creation": "2015-02-17T05:45:04.000Z",
        "accessed": "2015-02-17T05:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },
      {
        "id":"6666",
        "channel":"facebook",
        "status":"closed",
        "creation": "2015-04-17T22:45:04.000Z",
        "accessed": "2015-04-17T22:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },
      {
        "id":"7777",
        "channel":"twitter",
        "status":"closed",
        "creation": "2015-04-17T19:45:04.000Z",
        "accessed": "2015-04-17T20:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },
      {
        "id":"8888",
        "channel":"instagram",
        "status":"open",
        "creation": "2015-04-17T21:45:04.000Z",
        "accessed": "2015-04-17T21:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },{
        "id":"9999",
        "channel":"youtube",
        "status":"new",
        "creation": "2015-02-16T22:45:04.000Z",
        "accessed": "2015-02-16T22:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },{
        "id":"0000",
        "channel":"google+",
        "status":"closed",
        "creation": "2015-02-17T05:45:04.000Z",
        "accessed": "2015-02-17T05:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },{
        "id":"1212",
        "channel":"facebook",
        "status":"closed",
        "creation": "2015-04-17T22:45:04.000Z",
        "accessed": "2015-04-17T22:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },
      {
        "id":"1313",
        "channel":"twitter",
        "status":"closed",
        "creation": "2015-04-17T19:45:04.000Z",
        "accessed": "2015-04-17T20:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },
      {
        "id":"1414",
        "channel":"instagram",
        "status":"open",
        "creation": "2015-04-17T21:45:04.000Z",
        "accessed": "2015-04-17T21:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },{
        "id":"1515",
        "channel":"youtube",
        "status":"new",
        "creation": "2015-02-16T22:45:04.000Z",
        "accessed": "2015-02-16T22:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },{
        "id":"1616",
        "channel":"google+",
        "status":"closed",
        "creation": "2015-02-17T05:45:04.000Z",
        "accessed": "2015-02-17T05:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },{
        "id":"1717",
        "channel":"facebook",
        "status":"closed",
        "creation": "2015-04-17T22:45:04.000Z",
        "accessed": "2015-04-17T22:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },
      {
        "id":"1818",
        "channel":"twitter",
        "status":"closed",
        "creation": "2015-04-17T19:45:04.000Z",
        "accessed": "2015-04-17T20:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },
      {
        "id":"1919",
        "channel":"instagram",
        "status":"open",
        "creation": "2015-04-17T21:45:04.000Z",
        "accessed": "2015-04-17T21:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },{
        "id":"2020",
        "channel":"youtube",
        "status":"new",
        "creation": "2015-02-16T22:45:04.000Z",
        "accessed": "2015-02-16T22:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      },{
        "id":"2121",
        "channel":"google+",
        "status":"closed",
        "creation": "2015-02-17T05:45:04.000Z",
        "accessed": "2015-02-17T05:45:04.000Z",
        "link": "http://www.gameofthrones.com"
      }
    ]
  };
}





// Development fake data for line graphs.
function createFakeData(){
  var ourArray = [];
  var index = 50;
  for (var i = 0; i < index; i++){
    var year = 1971 + i;
    var day = 1971 + i;
    var date = new Date('2014', '03', i*15);
    date = date.toJSON();
    var count = Math.random()*1234234*i + 500;
    ourArray[i] = { "date": date, "count": count };
  }
  return ourArray;
}


// This is used to assimilate data lower than
// 5% in a donutGraph, removing it and replacing
// it with Other.
function simplifyData(data){
  var theData = data;

  var totalValues = 0,
      otherObj = { "label": "Other", "value": 0 };
  for (var i = 0; i < theData.length; i++){
    totalValues += theData[i].value;
  }
  for (var i = 0; i < theData.length; i++){
    if (theData[i].value/totalValues < 0.5) {
      theData.splice(i, 1);
      otherObj.value += theData[i].value;
    }
  }
  theData.push(otherObj);
  return theData;
}


