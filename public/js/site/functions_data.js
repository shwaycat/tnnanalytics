$.fn.serializeObject = function()
{
   var o = {};
   var a = this.serializeArray();
   $.each(a, function() {
       if (o[this.name]) {
           if (!o[this.name].push) {
               o[this.name] = [o[this.name]];
           }
           o[this.name].push(this.value || '');
       } else {
           o[this.name] = this.value || '';
       }
   });
   return o;
};

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var fakeEvents = {
	"info": "false",
	"events" : [
		{
			"id":"1234",
			"channel":"facebook",
			"status":"closed",
			"creation": "2015-04-17T22:45:04.000Z",
			"accessed": "2015-04-17T22:45:04.000Z",
			"link": "http://www.gameofthrones.com"
		},
		{
			"id":"1234",
			"channel":"twitter",
			"status":"closed",
			"creation": "2015-04-17T19:45:04.000Z",
			"accessed": "2015-04-17T20:45:04.000Z",
			"link": "http://www.gameofthrones.com"
		},
		{
			"id":"1234",
			"channel":"instagram",
			"status":"open",
			"creation": "2015-04-17T21:45:04.000Z",
			"accessed": "2015-04-17T21:45:04.000Z",
			"link": "http://www.gameofthrones.com"
		},{
			"id":"1234",
			"channel":"youtube",
			"status":"new",
			"creation": "2015-02-16T22:45:04.000Z",
			"accessed": "2015-02-16T22:45:04.000Z",
			"link": "http://www.gameofthrones.com"
		},{
			"id":"1234",
			"channel":"google+",
			"status":"closed",
			"creation": "2015-02-17T05:45:04.000Z",
			"accessed": "2015-02-17T05:45:04.000Z",
			"link": "http://www.gameofthrones.com"
		}
	]
};



function createTableContent(data, table){

	if(table[0]){

		var tableHTML = '';

		for (var i = 0; i < data.events.length; i++){
			var currentEvent = data.events[i];

			console.log(i);

			var currentEvent_creation = new Date(currentEvent.creation);

			currentEvent_creation = currentEvent_creation.getFullYear() + '/' + (currentEvent_creation.getMonth() < 10 ? ('0'+currentEvent_creation.getMonth()) : currentEvent_creation.getMonth() ) + '/' + (currentEvent_creation.getDate() < 10 ? ('0'+currentEvent_creation.getDate()) : currentEvent_creation.getDate() );

			var currentEvent_accessed = new Date(currentEvent.accessed);
			currentEvent_accessed = currentEvent_accessed.getFullYear() + '/' + (currentEvent_accessed.getMonth() < 10 ? ('0'+currentEvent_accessed.getMonth()) : currentEvent_accessed.getMonth() ) + '/' + (currentEvent_accessed.getDate() < 10 ? ('0'+currentEvent_accessed.getDate()) : currentEvent_accessed.getDate() );
			var currentEvent_accessed_human = $.timeago(currentEvent_accessed);

			var statusHTML = '';
			if (currentEvent.status == 'new'){
				statusHTML += 'status-new';
			} else if (currentEvent.status == 'open'){
				statusHTML += 'status-open';
			}

			tableHTML += '<tr class="'+statusHTML+'"><td>Checkbox</td>';
			tableHTML += '<td>'+currentEvent_creation+'</td>';
			tableHTML += '<td>'+currentEvent.channel.capitalizeFirstLetter()+'</td>';
			tableHTML += '<td>'+currentEvent.status.capitalizeFirstLetter()+'</td>';
			tableHTML += '<td>'+currentEvent.id+'</td>';
			tableHTML += '<td><span class="event-item-robot">'+currentEvent_accessed+'</span><span class="event-item-human">'+currentEvent_accessed_human.capitalizeFirstLetter()+'</span></td>';
			tableHTML += '<td class="event-link-cell"><a href="'+currentEvent.link+'" title="'+currentEvent.channel+' Link">View Post<span class="entypo entypo-chevron-right"></span></td>';
			tableHTML += '</tr>';

			table.find('tbody').append(tableHTML);

			tableHTML = '';
			
		}

		// table.draw();

	}

}

createTableContent(fakeEvents, $('#events-table'));

function createDateAsUTC(date) {
  return new Date(Date.UTC(
  	date.getFullYear(),
  	date.getMonth(),
  	date.getDate(),
  	date.getHours(),
  	date.getMinutes(),
  	date.getSeconds()
  ));
}

function convertDateToUTC(date) { 
  return new Date(
  	date.getUTCFullYear(),
  	date.getUTCMonth(),
  	date.getUTCDate(),
  	date.getUTCHours(),
  	date.getUTCMinutes(),
  	date.getUTCSeconds()
  ); 
}

