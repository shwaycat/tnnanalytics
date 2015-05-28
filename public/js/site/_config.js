// Global Vars
var globalDebugBool = true;
var eventsCheckStatusOnInterval = true;

var dataErrorClass = '.data-error-container';
var dataErrorHTML = '<div class="data-error-container"><p>There was an error loading the data for this section.</p></div>';

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
      'topCountries': false,
      'refTraffic': false
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

var fakeSummaryFacebook = {
  totalRetweets: 'askldfa',
  totalFavorites: '234',
  totalMentions: '23434',
  totalReplies: '4234a',
  totalDirectMentions: '234f',
  totalFollowers: '234assge',
  totalLikes: 'sdfdsa',
  totalShares: '2jf0',
  totalComments: '34',
  totalMentions: '234asdga',
  totalPosts: 'sdfasda'

};

var fakeMapping = {
  AD: 'Andorra',
  AE: 'United Arab Emirates',
  AF: 'Afghanistan',
  AG: 'Antigua and Barbuda',
  AI: 'Anguilla',
  AL: 'Albania',
  AM: 'Armenia',
  AO: 'Angola',
  AS: '',
  AT: 'Austria',
  AW: 'Aruba',
  AZ: 'Azerbaijan',
  AR: 'Argentina',
  AU: 'Australia',
  BA: 'Bosnia and Herzegovina',
  BB: 'Barbados',
  BD: 'Bangladesh',
  BE: 'Belgium',
  BF: 'Burkina Faso',
  BG: 'Bulgaria',
  BH: 'Bahrain',
  BI: 'Burundi',
  BJ: 'Benin',
  BM: 'Bermuda',
  BN: 'Brunei',
  BO: 'Bolivia',
  BR: 'Brazil',
  BS: 'The Bahamas',
  BT: 'Bhutan',
  BW: 'Botswana',
  BY: 'Belarus',
  BZ: 'Belize',
  CA: 'Canada',
  CD: 'Congo-Kinshasa',
  CF: 'Central African Republic',
  CG: 'Congo-Brazzaville',
  CH: 'Switzerland',
  CI: 'Côte d\'Ivoire',
  CK: 'Cook Islands',
  CL: 'Chile',
  CM: 'Cameroon',
  CN: 'People\'s Republic of China',
  CO: 'Colombia',
  CR: 'Costa Rica',
  CU: 'Cuba',
  CV: 'Cape Verde',
  CY: 'Cyprus',
  CZ: 'Czech Republic',
  DE: 'Germany',
  DJ: 'Djibouti',
  DK: 'Denmark',
  DM: 'Dominica',
  DO: 'Dominican Republic',
  DZ: 'Algeria',
  EC: 'Ecuador',
  EE: 'Estonia',
  EG: 'Egypt',
  EH: 'Sahrawi Arab Democratic Republic',
  ER: 'Eritrea',
  ES: 'Spain',
  ET: 'Ethiopia',
  FI: 'Finland',
  FJ: 'Fiji',
  FK: 'Falkland Islands',
  FM: 'Federated States of Micronesia',
  FO: 'Faroe Islands',
  FR: 'France',
  GA: 'Gabon',
  GB: 'United Kingdom',
  GD: 'Grenada',
  GE: 'Georgia',
  GG: 'Guernsey',
  GH: 'Ghana',
  GI: 'Gibraltar',
  GL: 'Greenland',
  GM: 'The Gambia',
  GN: 'Guinea',
  GP: 'Guadeloupe',
  GQ: 'Equatorial Guinea',
  GR: 'Greece',
  GS: 'South Georgia and the South Sandwich Islands',
  GT: 'Guatemala',
  GU: 'Guam',
  GW: 'Guinea-Bissau',
  GY: 'Guyana',
  HN: 'Honduras',
  HR: 'Croatia',
  HT: 'Haiti',
  HU: 'Hungary',
  ID: 'Indonesia',
  IE: 'Ireland',
  IL: 'Israel',
  IM: 'Isle of Man',
  IO: 'British Indian Ocean Territory',
  IQ: 'Iraq',
  IR: 'Iran',
  IS: 'Iceland',
  IT: 'Italy',
  JE: 'Jersey',
  JM: 'Jamaica',
  IN: 'India',
  JO: 'Jordan',
  JP: 'Japan',
  KE: 'Kenya',
  KG: 'Kyrgyzstan',
  KH: 'Cambodia',
  KI: 'Kiribati',
  KM: 'Comoros',
  KN: 'Saint Kitts and Nevis',
  KP: 'North Korea',
  KR: 'South Korea',
  KW: 'Kuwait',
  KY: 'Cayman Islands',
  KZ: 'Kazakhstan',
  LA: 'Laos',
  LB: 'Lebanon',
  LC: 'Saint Lucia',
  LI: 'Liechtenstein',
  LK: 'Sri Lanka',
  LR: 'Liberia',
  LS: 'Kingdom of Lesotho',
  LT: 'Lithuania',
  LU: 'Luxemburg',
  LV: 'Latvia',
  LY: 'Libya',
  MA: 'Morocco',
  MC: 'Monaco',
  MD: 'Moldova',
  ME: 'Montenegro',
  MG: 'Madagascar',
  MH: 'Marshall Islands',
  MK: 'Macedonia',
  ML: 'Mali',
  MM: 'Myanmar',
  MN: 'Mongolia',
  MP: 'Northern Mariana Islands',
  MQ: 'Martinique',
  MR: 'Mauritania',
  MS: 'Montserrat',
  MT: 'Malta',
  MU: 'Mauritius',
  MV: 'Maldives',
  MW: 'Malawi',
  MX: 'Mexico',
  MY: 'Malaysia',
  MZ: 'Mozambique',
  NA: 'Namibia',
  NC: 'New Caledonia',
  NE: 'Niger',
  NG: 'Nigeria',
  NI: 'Nicaragua',
  NL: 'The Netherlands',
  NO: 'Norway',
  NP: 'Nepal',
  NR: 'Nauru',
  NU: 'Niue',
  NZ: 'New Zealand',
  OM: 'Oman',
  PA: 'Panama',
  PE: 'Peru',
  PF: 'French Polynesia',
  PG: 'Papua New Guinea',
  PH: 'Philippines',
  PK: 'Pakistan',
  PL: 'Poland',
  PM: 'Saint Pierre and Miquelon',
  PN: 'Pitcairn Islands',
  PR: 'Puerto Rico',
  PS: 'Palestine',
  PT: 'Portugal',
  PW: 'Palau',
  PY: 'Paraguay',
  QA: 'Qatar',
  RE: 'Réunion',
  RO: 'Romania',
  RS: 'Serbia',
  RU: 'Russian Federation',
  RW: 'Rwanda',
  SA: 'Saudi Arabia',
  SB: 'Solomon Islands',
  SC: 'Seychelles',
  SD: 'Sudan',
  SE: 'Sweden',
  SG: 'Singapore',
  SH: 'Saint Helena, Ascension and Tristan da Cunha',
  SI: 'Slovenia',
  SK: 'Slovakia',
  SL: 'Sierra Leone',
  SM: 'San Marino',
  SN: 'Senegal',
  SO: 'Somalia',
  SR: 'Suriname',
  SS: 'South Sudan',
  ST: 'São Tomé and Príncipe',
  SV: 'El Salvador',
  SY: 'Syria',
  SZ: 'Swaziland',
  TC: 'Turks and Caicos Islands',
  TD: 'Chad',
  TG: 'Togo',
  TH: 'Thailand',
  TJ: 'Tajikistan',
  TK: 'Tokelau',
  TL: 'East Timor',
  TM: 'Turkmenistan',
  TN: 'Tunisia',
  TO: 'Tonga',
  TR: 'Turkey',
  TT: 'Trinidad and Tobago',
  TV: 'Tuvalu',
  TW: 'Taiwan',
  TZ: 'Tanzania',
  UA: 'Ukraine',
  UG: 'Uganda',
  US: 'United States of America',
  UY: 'Uruguay',
  UZ: 'Uzbekistan',
  VA: 'Vatican City',
  VC: 'Saint Vincent and the Grenadines',
  VE: 'Venezuela',
  VG: 'British Virgin Islands',
  VI: 'United States Virgin Islands',
  VN: 'Vietnam',
  VU: 'Vanuatu',
  WF: 'Wallis and Futuna',
  WS: 'Samoa',
  YE: 'Yemen',
  ZA: 'South Africa',
  ZM: 'Zambia',
  ZW: 'Zimbabwe'
}

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
        "key": "KI",
        "value": 101
      },
      {
        "key": "DK",
        "value": 102
      },
      {
        "key": "MP",
        "value": 112
      },
      {
        "key": "MW",
        "value": 504
      },
      {
        "key": "NG",
        "value": 508
      },
      {
        "key": "EG",
        "value": 606
      },
      {
        "key": "BH",
        "value": 107
      },
      {
        "key": "QA",
        "value": 105
      },
      {
        "key": "BN",
        "value": 109
      },
      {
        "key": "PK",
        "value": 110
      },
      {
        "key": "PG",
        "value": 111
      },
      {
        "key": "PM",
        "value": 103
      },
      {
        "key": "PT",
        "value": 113
      },
      {
        "key": "OM",
        "value": 114
      }

    ]


    var fakeRefTraffic = [
          {
            "key": "Referral",
            "value": 101
          },
          {
            "key": "Direct",
            "value": 443
          },
          {
            "key": "Organic Search",
            "value": 112
          },
          {
            "key": "Social",
            "value": 435
          },
          {
            "key": "Other",
            "value": 34
          }
        ]
