//------------------------------------------------------------------------------
// Content Security Policy: The page’s settings blocked the loading of a resource at blob:moz-extension://58d8b783-8c10-4b1c-b365-058c9fb6df04/5496a970-7784-47e7-8e51-2f65322f30ae («script-src»).
// https://bugzilla.mozilla.org/show_bug.cgi?id=1294996
//------------------------------------------------------------------------------
var s3radio = {};
//------------------------------------------------------------------------------
s3radio.init_0 = function() {
	s3radio.prefs.init(function(){
		s3radio.utils.i18n_parse(document);
		s3radio.init();
	});
}
//------------------------------------------------------------------------------
s3radio.init = function() {
	var radio_id = String(location.search).replace(/\?/g, '');
	var result = /^([^\.]+)\.(.+)$/i.exec(radio_id);
	//------------------------------------------------------------------------
	if (result != null) {
		var country_id = result[1];
		var statation_id = result[2];

		//------------------------------------------------------------------
		if (country_id == 'user_list') {
			var user_list = s3radio.utils.prefs_get('user_list');
			if (user_list[radio_id]) {
				s3radio.success(user_list[radio_id], country_id);
			} else {
				s3radio.error();
			}
		}
		//------------------------------------------------------------------
		else {
			fetch('/content/stations/' + country_id + '.json').then(function(response) {
				return response.json();
			}).then(function(stations) {
				if (stations[country_id]) {
					var station = null;

					for (var i=0; i<stations[country_id].length; i++) {
						if (stations[country_id][i].image == statation_id) {
							station = stations[country_id][i];
						}
					}
					if (station) {
						s3radio.success(station, country_id);
					} else {
						s3radio.error();
					}
				} else {
					s3radio.error();
				}
			}).catch(function(error) {
				s3radio.error();
			});
		}
	}
	//------------------------------------------------------------------------
	else {
		s3radio.error();
	}
}
//------------------------------------------------------------------------------
s3radio.success = function(station, country_id) {
	s3radio.utils.HTMLDOM_value(document.getElementById('radio_name'), station.name);
	if (station.site_url) {
		s3radio.utils.HTMLDOM_value(document.getElementById('radio_site_url'), station.site_url);
		document.getElementById('radio_site_url').href = station.site_url;
	}
	if (country_id == 'user_list') {
		document.getElementById('radio_image').src = '/skin/station_user_list.png';
	} else {
		document.getElementById('radio_image').src = 'https://www.s3blog.org/s3radio-files/stations/'  + country_id + '/' + station.image;
	}
}
//------------------------------------------------------------------------------
s3radio.error = function() {
	document.getElementById('radio_image').style.display = 'none';
}
//------------------------------------------------------------------------------
window.addEventListener("load", s3radio.init_0);
