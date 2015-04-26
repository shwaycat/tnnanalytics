// Use this to store the paths for the various JSON endpoints. If this is barely used or redundant remove it.

var GLOBAL_API_DATA = {
  facebook: 'TODO data here!',
  twitter: 'TODO data here!',
  instagram: 'TODO data here!',
  google_plus: 'TODO data here!',
  youtube: 'TODO data here!',
  fakedata1: [ 5, 10, 13, 19, 21, 25, 22, 18, 15, 13, 11, 12, 15, 20, 18, 17, 16, 18, 23, 25 ],
  fakedata2: [
    {
      "date": "2015-01-21T20:29:42.759Z",
      "count": "0"
    },
    {
      "date": "2015-02-21T20:29:42.759Z",
      "count": "30"
    },
    {
      "date": "2015-03-21T20:29:42.759Z",
      "count": "10"
    },
    {
      "date": "2015-05-21T20:29:42.759Z",
      "count": "30"
    },
  ],
  fakedata3: createFakeData()
}

var GLOBAL_GRAPH_COLORS = {
  reach_line: 'rgba(0, 159, 218, 0.2)',
  engagement_line: 'rgba(149, 29, 163, 0.2)',
  acquisition_main: 'rgba(67, 164, 27, 0.2)'
}

function createFakeData(){
  var ourArray = [];
  var index = 50;
  for (var i = 0; i < index; i++){
    var year = 1971 + i;
    var day = 1971 + i;
    var date = new Date('2014', '03', '05', '5', i*15);
    date = date.toJSON();
    var count = Math.random()*1234234*i + 500;
    ourArray[i] = { "date": date, "count": count };
  }
  return ourArray;
}

function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "k", "m", "b","t"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

