// Global Vars
var globalDebugBool = true;
var eventsCheckStatusOnInterval = true;

var dataErrorClass = '.data-error-container';
var dataErrorHTML = '<div class="data-error-container"><p>There was an error loading the data for this section. Please <a href="mailto:nlambert@maxmedia.com">email</a> us and let us know you found this error.</p></div>';

var loadingGifClass = '.loading-container';
var loadingGifHTML = '<div class="loading-container"><img src="/images/loader.gif" /></div>';

var GLOBAL_API_ROUTES = false;

var cachedData = {
      'engagement': false,
      'acquisition': false,
      'reach': false,
      'topFacebookPost': false,
      'topTweet': false,
      'topInstagramPost': false,
      'topGooglePost': false,
      'topYoutubeVideo': false,
      'topCountries': false
    };
var cachedSummary = {
      'engagement': false,
      'acquisition': false,
      'reach': false,
      'topFacebookPost': false,
      'topTweet': false,
      'topInstagramPost': false,
      'topGooglePost': false,
      'topYoutubeVideo': false,
      'topCountries': false
    };

var cookieName = 'novo_date',
    cookieExp = 1,
    cookiePath = '/';

$.cookie.json = true;

var currentSelectedDate;
if($('.date-container')[0]){
  currentSelectedDate = dateCookie();
}




//Fake data for testing below

var fakeEvents = {
    "info": false,
    "events" : [
      {
        "id":"1111",
        "source":"facebook",
        "alertState":"new",
        "timestamp": "2015-04-23T22:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-23T22:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },
      {
        "id":"2222",
        "source":"twitter",
        "alertState":"new",
        "timestamp": "2015-04-17T19:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T20:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },
      {
        "id":"3333",
        "source":"instagram",
        "alertState":"open",
        "timestamp": "2015-04-17T21:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T21:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },{
        "id":"4444",
        "source":"youtube",
        "alertState":"new",
        "timestamp": "2015-02-16T22:45:04.000Z",
        "alertStateUpdatedAt": "2015-02-16T22:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "direct_message"
      },{
        "id":"5555",
        "source":"google+",
        "alertState":"closed",
        "timestamp": "2015-02-17T05:45:04.000Z",
        "alertStateUpdatedAt": "2015-02-17T05:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "direct_message"
      },
      {
        "id":"6666",
        "source":"facebook",
        "alertState":"closed",
        "timestamp": "2015-04-17T22:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T22:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },
      {
        "id":"7777",
        "source":"twitter",
        "alertState":"closed",
        "timestamp": "2015-04-17T19:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T20:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "direct_message"
      },
      {
        "id":"8888",
        "source":"instagram",
        "alertState":"open",
        "timestamp": "2015-04-17T21:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T21:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },{
        "id":"9999",
        "source":"youtube",
        "alertState":"new",
        "timestamp": "2015-02-16T22:45:04.000Z",
        "alertStateUpdatedAt": "2015-02-16T22:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },{
        "id":"0000",
        "source":"google+",
        "alertState":"closed",
        "timestamp": "2015-02-17T05:45:04.000Z",
        "alertStateUpdatedAt": "2015-02-17T05:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },{
        "id":"1212",
        "source":"facebook",
        "alertState":"closed",
        "timestamp": "2015-04-17T22:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T22:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },
      {
        "id":"1313",
        "source":"twitter",
        "alertState":"closed",
        "timestamp": "2015-04-17T19:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T20:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },
      {
        "id":"1414",
        "source":"instagram",
        "alertState":"open",
        "timestamp": "2015-04-17T21:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T21:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },{
        "id":"1515",
        "source":"youtube",
        "alertState":"new",
        "timestamp": "2015-02-16T22:45:04.000Z",
        "alertStateUpdatedAt": "2015-02-16T22:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },{
        "id":"1616",
        "source":"google+",
        "alertState":"closed",
        "timestamp": "2015-02-17T05:45:04.000Z",
        "alertStateUpdatedAt": "2015-02-17T05:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },{
        "id":"1717",
        "source":"facebook",
        "alertState":"closed",
        "timestamp": "2015-04-17T22:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T22:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },
      {
        "id":"1818",
        "source":"twitter",
        "alertState":"closed",
        "timestamp": "2015-04-17T19:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T20:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },
      {
        "id":"1919",
        "source":"instagram",
        "alertState":"open",
        "timestamp": "2015-04-17T21:45:04.000Z",
        "alertStateUpdatedAt": "2015-04-17T21:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },{
        "id":"2020",
        "source":"youtube",
        "alertState":"new",
        "timestamp": "2015-02-16T22:45:04.000Z",
        "alertStateUpdatedAt": "2015-02-16T22:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      },{
        "id":"2121",
        "source":"google+",
        "alertState":"closed",
        "timestamp": "2015-02-17T05:45:04.000Z",
        "alertStateUpdatedAt": "2015-02-17T05:45:04.000Z",
        "url": "http://www.gameofthrones.com",
        "doc_type": "blah"
      }
    ]
  };


var fakeTopPost = {
      "title": "Example Top Post",
      "creation": "2015-04-23T22:45:04.000Z",
      "url": "http://www.gameofthrones.com",
      "image": "https://scontent-atl.xx.fbcdn.net/hphotos-xaf1/v/t1.0-9/379782_987468847479_1864297134_n.jpg?oh=0745e5e24c60e8ddaf269e12c945d0bb&oe=55D16C5C",
      "video_url": "",
      "content": "Brunch yr street art, Shoreditch organic mustache roof party umami DIY master cleanse. Cray cred Schlitz before they sold out tofu disrupt. Letterpress cred selvage, gluten-free craft beer post-ironic stumptown tofu trust fund pug four loko Austin lomo. Small batch roof party quinoa, pickled biodiesel photo booth asymmetrical flexitarian. Jean shorts XOXO distillery, chillwave pickled blog flannel viral. Brunch synth post-ironic Pinterest. Swag Blue Bottle put a bird on it paleo, lumbersexual fap salvia readymade kogi street art aesthetic asymmetrical Neutra retro selfies.",
      "engagement": "340",
      "shares": "432",
      "comments": "32425",
      "likes": "241"
    };

var fakeTopTweet = {
      "title": "Example Top Tweet",
      "creation": "2015-04-23T22:45:04.000Z",
      "url": "http://www.gameofthrones.com",
      "image": "https://scontent-atl.xx.fbcdn.net/hphotos-xaf1/v/t1.0-9/379782_987468847479_1864297134_n.jpg?oh=0745e5e24c60e8ddaf269e12c945d0bb&oe=55D16C5C",
      "video_url": "",
      "content": "Brunch yr street art, Shoreditch organic mustache roof party umami DIY master cleanse. Cray cred Schlitz before they sold out tofu disrupt. Letterpress cred selvage, gluten-free craft beer post-ironic stumptown tofu trust fund pug four loko Austin lomo. Small batch roof party quinoa, pickled biodiesel photo booth asymmetrical flexitarian. Jean shorts XOXO distillery, chillwave pickled blog flannel viral. Brunch synth post-ironic Pinterest. Swag Blue Bottle put a bird on it paleo, lumbersexual fap salvia readymade kogi street art aesthetic asymmetrical Neutra retro selfies.",
      "engagement": "340",
      "favorites": "432",
      "replies": "32425",
      "retweets": "241"
    };


var fakeTopCountryData = [
      {
        "label": "sdf",
        "value": 101
      },
      {
        "label": "USA",
        "value": 102
      },
      {
        "label": "Canada",
        "value": 112
      },
      {
        "label": "Mexico",
        "value": 504
      },
      {
        "label": "England",
        "value": 508
      },
      {
        "label": "Ireland",
        "value": 606
      },
      {
        "label": "Germany",
        "value": 107
      },
      {
        "label": "Belgium",
        "value": 105
      },
      {
        "label": "Russia",
        "value": 109
      },
      {
        "label": "Japan",
        "value": 110
      },
      {
        "label": "TaiWorld",
        "value": 111
      },
      {
        "label": "JeremyLand",
        "value": 103
      },
      {
        "label": "TravisTown",
        "value": 113
      },
      {
        "label": "NickCity",
        "value": 114
      }

    ]