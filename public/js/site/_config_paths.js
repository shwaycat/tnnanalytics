// Use this to store the paths for the various JSON endpoints. If this is barely used or redundant remove it.

var GLOBAL_API_DATA = {
  facebook: 'TODO data here!',
  twitter: 'TODO data here!',
  instagram: 'TODO data here!',
  google_plus: 'TODO data here!',
  youtube: 'TODO data here!',
  fakedata1: [ 5, 10, 13, 19, 21, 25, 22, 18, ],
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
  fakedata3: createFakeData(),
  fakedata4: [
    {
      "label": "USA",
      "value": 79000
    },
    {
      "label": "Canada",
      "value": 74000
    },
    {
      "label": "Mexico",
      "value": 23000
    },
    {
      "label": "England",
      "value": 500
    },
    {
      "label": "Ireland",
      "value": 40000
    },
    {
      "label": "Germany",
      "value": 9000
    },
    {
      "label": "Belgium",
      "value": 43400
    },
    {
      "label": "Russia",
      "value": 54522
    },
    {
      "label": "Japan",
      "value": 500
    },
    {
      "label": "China",
      "value": 323
    }
  ]
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

