// Global Vars
var globalDebugBool = true;

var dataErrorClass = '.data-error-container';
var dataErrorHTML = '<div class="data-error-container"><p>There was an error loading the data for this section. Please <a href="mailto:nlambert@maxmedia.com">email</a> us and let us know you found this error.</p></div>';

var loadingGifClass = '.loading-container';
var loadingGifHTML = '<div class="loading-container"><img src="/images/loader.gif" /></div>';

var GLOBAL_API_ROUTES = false

var fakeEvents = {
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


var fakeTopPost = {
      "title": "Example Top Post",
      "creation": "2015-04-23T22:45:04.000Z",
      "url": "www.gameofthrones.com",
      "source": "facebook",
      "image": "https://scontent-atl.xx.fbcdn.net/hphotos-xaf1/v/t1.0-9/379782_987468847479_1864297134_n.jpg?oh=0745e5e24c60e8ddaf269e12c945d0bb&oe=55D16C5C",
      "video_url": "",
      "content": "Lorem ipsum lol. Lorem ipsum lol. Lorem ipsum lol. Lorem ipsum lol. Lorem ipsum lol. Lorem ipsum lol. Lorem ipsum lol. Lorem ipsum lol. Lorem ipsum lol.",
      "engagement": "340",
      "shares": "432",
      "comments": "32425",
      "likes": "241"
    };

var fakeTopCountryData = [
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