var s3radio = {};
s3radio.current_radio = {};
s3radio.selected_country = '';
s3radio.station_list = [];
s3radio.stop_event_scroll = false;
s3radio.shuffle_enabled = false;
s3radio.sleep_timer_enabled = false;
s3radio.div_body_load_progress = null;
s3radio.draggable = null;
s3radio.show_init_progress = true;

//------------------------------------------------------------------------------
s3radio.init_0 = function() {
	var country_list = [
		'cu', 'ht', 'us', 'pr', 'jm', 'ca', 'mx', 'tt', 'do',
		'cr', 'sv', 'ni', 'pa', 'gt', 'hn',
		'ar', 'bo', 'br', 'py', 'pe', 'sr', 'cl', 'co', 'mq', 'gy', 'gp', 'gf', 'ec', 'uy', 'fk', 've',
		'be', 'by', 'dk', 'cz', 'ee', 'es', 'de', 'fr', 'gr', 'cy', 'at', 'pl', 'pt', 'ro', 'ch', 'si', 'fi', 'hr', 'ie', 'it', 'lu', 'lt', 'hu', 'nl', 'tr', 'se', 'no', 'bg', 'uk', 'ru', 'ua', 'md', 'sk', 'mt',
		'dz', 'cm', 'ci', 'cg', 'ng', 'za', 'sn', 'tn', 'gh', 'ke', 'ma', 'ug', 'mg', 'rs', 'eg',
		'az', 'bd', 'ge', 'kr', 'hk', 'in', 'id', 'ir', 'iq', 'kz', 'sg', 'lk', 'vn', 'il', 'th', 'my', 'np', 'jp', 'pk', 'ph', 'cn', 'tw', 'sa', 
		'au', 'nz'
	];

	s3radio.div_body_load_progress = document.getElementById('div_body_load_progress');

	s3radio.prefs.init(function(){
		s3radio.set_theme_color();
		s3radio.selected_country = s3radio.utils.prefs_get('selected_country');
		var favorites_country_hash = false;

		//------------------------------------------------------------------
		var stylesheet = document.createElement('link');
		stylesheet.setAttribute('rel', 'stylesheet');
		stylesheet.setAttribute('type', 'text/css');
		stylesheet.setAttribute('href', '/skin/' + s3radio.utils.get_theme_catalog() + '/popup.css');
		document.getElementById('div_body').appendChild(stylesheet);

		//------------------------------------------------------------------
		if (s3radio.selected_country == 'favorites') {
			var favorites_list = s3radio.utils.prefs_get('favorites_list');
			favorites_country_hash = {};
			for (var favorite_id in favorites_list) {
				if (typeof favorites_list[favorite_id] != 'object') {
					favorites_list[favorite_id] = { 'country' : favorites_list[favorite_id], 'order' : (new Date()).getTime() };
				}
				var country_id = favorites_list[favorite_id].country;
				favorites_country_hash[country_id] = true;
			}
			country_list.sort(function(a,b){
				if (favorites_country_hash[a]) { return -1; } else { return 1; }
			});
		}
		//------------------------------------------------------------------
		else {
			country_list.sort(function(a,b){
				if (a == s3radio.selected_country) { return -1; } else { return 1; }
			});
		}
		s3radio.utils.i18n_parse(document);
		//-----------------------------------------------------------------
		if (s3radio.selected_country == 'user_list') {
			s3radio.init_stations_end();
		}
		//-----------------------------------------------------------------
		s3radio.init_stations(country_list, country_list.length, favorites_country_hash);
	});
}
//------------------------------------------------------------------------------
s3radio.init_stations = function(country_list, total_length, favorites_list) {
	if (country_list.length%5 == 0) {
		if (s3radio.show_init_progress) {
			s3radio.div_body_load_progress.style.width = Math.floor((total_length-country_list.length)*100/total_length) + '%';
		}
	}

	if (country_list && country_list.length > 0) {
		var country = country_list.shift();
		fetch('/content/stations/' + country + '.json').then(function(response) {
			return response.json();
		}).then(function(stations) {
			if (stations[country]) {
				//-----------------------------------------------------
				if (country == 'us') {
					s3radio.stations[country] = stations[country];
					country_list.unshift('us_2');
					s3radio.init_stations(country_list, total_length, favorites_list);
					return;
				}
				//-----------------------------------------------------
				else if (country == 'us_2') {
					country = 'us';
					s3radio.stations['us'].push.apply(s3radio.stations['us'], stations['us_2']);
				}
				//-----------------------------------------------------
				else {
					s3radio.stations[country] = stations[country];
				}
				//-----------------------------------------------------
				if (country == s3radio.selected_country) {
					s3radio.init_stations_end();
				} else if (favorites_list && ! favorites_list[country]) {
					s3radio.init_stations_end();
				}
			}
			s3radio.init_stations(country_list, total_length, favorites_list);
		}).catch(function(error) {
			s3radio.utils.console_log(country + " : " + error.message);
			s3radio.init_stations(country_list, total_length, favorites_list);
		});
	}
	//------------------------------------------------------------------------
	else {
		s3radio.init_stations_end(true);
		s3radio.create_country_list();
	}
}
//------------------------------------------------------------------------------
s3radio.init_stations_end = function(is_finish) {
	if (s3radio.utils.prefs_get('search_open') && ! is_finish) {
		return;
	}
	if (s3radio.show_init_progress) {
		s3radio.show_init_progress = false;
		s3radio.div_body_load_progress.style.width = '100%';
		s3radio.div_body_load_progress.setAttribute('is_hidden', true);
		document.getElementById('div_body_player').setAttribute('is_hidden', false);
		s3radio.init_1();
	}
}
//------------------------------------------------------------------------------
s3radio.init_1 = function() {
	//------------------------------------------------------------------------
	document.getElementById('radio_player_control_volume').addEventListener("mousemove", function() {
		var volume_value = s3radio.utils.prefs_get('volume_value');
		if (volume_value != this.value) {
			s3radio.pref_save('volume_value', parseInt(this.value));
			s3radio.volume_value();
		}
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_control_volume').addEventListener("change", function() {
		var volume_value = s3radio.utils.prefs_get('volume_value');
		if (volume_value != this.value) {
			s3radio.pref_save('volume_value', parseInt(this.value));
			s3radio.volume_value();
		}
	});

	//------------------------------------------------------------------------
	document.getElementById('radio_player_control_sound').addEventListener("click", function() {
		var volume_value = s3radio.utils.prefs_get('volume_value');
		var volume_value_old = volume_value || s3radio.utils.prefs_get('volume_value_old') || 50;

		volume_value = (volume_value > 0) ? 0 : volume_value_old;
		document.getElementById('radio_player_control_volume').value = volume_value;
		s3radio.pref_save('volume_value', volume_value);
		s3radio.pref_save('volume_value_old', volume_value_old);
		s3radio.volume_value();
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_control_play').addEventListener("click", function(event) {
		s3radio.radio_play();
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_country').addEventListener("click", function(event) {
		s3radio.selected_country = s3radio.current_radio.country;
		s3radio.pref_save('selected_country', s3radio.selected_country, function(){
			s3radio.create_list_selector();
		});
		event.preventDefault();
		event.stopPropagation();
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_prev').addEventListener("click", function() {
		s3radio.radio_station_prev_next(false);
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_next').addEventListener("click", function() {
		s3radio.radio_station_prev_next(true);
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_random').addEventListener("click", function() {
		s3radio.radio_station_random();
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_shuffle').addEventListener("click", function() {
		s3radio.radio_station_shuffle();
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_sleep_timer').addEventListener("click", function() {
		s3radio.radio_player_sleep_timer();
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_search').addEventListener("click", function() {
		var search_open = ! s3radio.utils.prefs_get('search_open');

		s3radio.pref_save('search_open', search_open, function(){
			document.getElementById('radio_player_search').setAttribute('is_search', search_open);
			document.getElementById('radio_search_box').setAttribute('is_hidden', ! search_open);
			s3radio.create_list_selector();
		});
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_search_input').addEventListener("input", function(e) {
		s3radio.pref_save('search_text', this.value, function(){
			s3radio.create_list_by_search();
		});
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_favorites').addEventListener("click", function() {
		var search_open = s3radio.utils.prefs_get('search_open');
		if (search_open && (s3radio.selected_country == 'favorites')) {
			s3radio.pref_save('selected_country', s3radio.selected_country, function(){
				s3radio.create_list_selector();
			});
		}
		else if (s3radio.selected_country == 'favorites') {
			s3radio.selected_country = s3radio.current_radio.country;
			s3radio.pref_save('selected_country', s3radio.selected_country, function(){
				s3radio.create_list_selector();
			});
		} else {
			s3radio.selected_country = 'favorites';
			s3radio.pref_save('selected_country', s3radio.selected_country, function(){
				s3radio.create_list_selector();
			});
		}
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_user_list').addEventListener("click", function() {
		var search_open = s3radio.utils.prefs_get('search_open');
		if (search_open && (s3radio.selected_country == 'user_list')) {
			s3radio.pref_save('selected_country', s3radio.selected_country, function(){
				s3radio.create_list_selector();
			});
		}
		else if (s3radio.selected_country == 'user_list') {
			s3radio.selected_country = s3radio.utils.prefs_get('last_normal_selected_country');
			s3radio.pref_save('selected_country', s3radio.selected_country, function(){
				s3radio.create_list_selector();
			});
		} else {
			s3radio.selected_country = 'user_list';
			s3radio.pref_save('selected_country', s3radio.selected_country, function(){
				s3radio.create_list_selector();
			});
		}
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_list').addEventListener("click", function() {
		if (s3radio.utils.prefs_get('search_open')) { return; }

		var radio_list_show = ! s3radio.utils.prefs_get('radio_list_show');
		s3radio.pref_save('radio_list_show', radio_list_show, function(){
			document.getElementById('radio_player_list').setAttribute('is_hidden', ! radio_list_show);
			document.getElementById('radio_list_box').setAttribute('is_hidden', ! radio_list_show);
			document.getElementById('radio_box_head').setAttribute('is_hidden', ! radio_list_show);
			document.getElementById('radio_player_list').setAttribute('title', s3radio.utils.get_string((radio_list_show) ? 'hide_list_radio_stations' : 'show_list_radio_stations'));
			document.getElementById('radio_list_box_is_empty').setAttribute('is_hidden', ! radio_list_show);
		});
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_country_list').addEventListener("click", function() {
		document.getElementById('div_body_player').setAttribute('is_hidden', true);
		document.getElementById('div_body_country_list').setAttribute('is_hidden', false);
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_station_favorites').addEventListener("click", function() {
		var favorites_list = s3radio.utils.prefs_get('favorites_list');
		if (favorites_list[s3radio.current_radio.id]) {
			delete favorites_list[s3radio.current_radio.id];
		} else {
			favorites_list[s3radio.current_radio.id] = { 'country' : s3radio.current_radio.country, 'order' : (new Date()).getTime() };
		}
		s3radio.pref_save('favorites_list', favorites_list, function(){
			var search_open = s3radio.utils.prefs_get('search_open');
			if ((! search_open) && s3radio.selected_country == 'favorites') {
				s3radio.create_list_by_favorites();
			} else {
				s3radio.create_list_elements();
			}
			s3radio.create_player();
		});
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_player_settings').addEventListener("click", function() {
		chrome.runtime.openOptionsPage();
		s3radio.window_close();
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_list_box').addEventListener("scroll", function(event) {
		s3radio.create_list_elements_plus(event);
	});
	//------------------------------------------------------------------------
	document.getElementById('button_body_country_list_close').addEventListener("click", function() {
		document.getElementById('div_body_player').setAttribute('is_hidden', false);
		document.getElementById('div_body_country_list').setAttribute('is_hidden', true);
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_search_select_country_current').addEventListener("click", function() {
		var country_list_box = document.getElementById('radio_search_select_country_list');
		country_list_box.setAttribute('is_hidden', 'false');
		document.getElementById('div_body_player').style.minHeight = (document.getElementById('radio_player_box').clientHeight + country_list_box.clientHeight + 20) + 'px';
		country_list_box.focus();
		s3radio.check_country_list_search();

		//------------------------------------------------------------------------
		if (! country_list_box.second_open) {
			country_list_box.second_open = true;
			var search_country = s3radio.utils.prefs_get('search_country') || 'DDD';
			if (s3radio.stations[search_country]) {
				s3radio.scrollIntoView(document.getElementById('radio_search_select_country_list_' + search_country), 4);
			}
		}
	});
	//------------------------------------------------------------------------
	document.getElementById('radio_search_select_country_list').addEventListener("blur", function() {
		this.setAttribute('is_hidden', 'true');
		document.getElementById('div_body_player').style.minHeight = '';
	});

	//------------------------------------------------------------------------
	//------------------------------------------------------------------------
	document.getElementById('user_list_head_plus').addEventListener("click", function() {
		document.getElementById('div_body_player').setAttribute('is_hidden', true);
		document.getElementById('div_body_user_list_new').setAttribute('is_hidden', false);
		document.getElementById('user_list_new_station_name').value = '';
		document.getElementById('user_list_new_station_stream_url').value = '';
		document.getElementById('user_list_new_station_website_url').value = '';
		document.getElementById('user_list_new_station_id').value = '';
		document.getElementById('user_list_new_station_name').focus();
		document.getElementById('user_list_new_station_delete').setAttribute('not_show', true);
		s3radio.pref_save('user_list_new_show', true);
		s3radio.pref_save('user_list_new_station_id', '');
		s3radio.pref_save('user_list_new_station_name', '');
		s3radio.pref_save('user_list_new_stream_url', '');
		s3radio.pref_save('user_list_new_website_url', '');
		s3radio.pref_save('user_list_new_last', 'station_name');
		s3radio.utils.HTMLDOM_value(document.getElementById('user_list_radio_stations_new_title'), s3radio.utils.get_string('user_list_radio_stations_new'));
		s3radio.user_list_station_new_check();
	});
	//------------------------------------------------------------------------
	document.getElementById('button_body_user_list_new_close').addEventListener("click", s3radio.user_list_station_new_close);
	//------------------------------------------------------------------------
	document.getElementById('user_list_new_station_name').addEventListener('focus', s3radio.user_list_station_new_set);
	document.getElementById('user_list_new_station_name').addEventListener('keyup', s3radio.user_list_station_new_set);
	document.getElementById('user_list_new_station_name').addEventListener('paste', s3radio.user_list_station_new_set);
	document.getElementById('user_list_new_station_name').addEventListener('input', s3radio.user_list_station_new_set);
	//------------------------------------------------------------------------
	document.getElementById('user_list_new_station_stream_url').addEventListener('focus', s3radio.user_list_station_new_set);
	document.getElementById('user_list_new_station_stream_url').addEventListener('keyup', s3radio.user_list_station_new_set);
	document.getElementById('user_list_new_station_stream_url').addEventListener('paste', s3radio.user_list_station_new_set);
	document.getElementById('user_list_new_station_stream_url').addEventListener('input', s3radio.user_list_station_new_set);
	//------------------------------------------------------------------------
	document.getElementById('user_list_new_station_website_url').addEventListener('focus', s3radio.user_list_station_new_set);
	document.getElementById('user_list_new_station_website_url').addEventListener('keyup', s3radio.user_list_station_new_set);
	document.getElementById('user_list_new_station_website_url').addEventListener('paste', s3radio.user_list_station_new_set);
	document.getElementById('user_list_new_station_website_url').addEventListener('input', s3radio.user_list_station_new_set);
	//------------------------------------------------------------------------
	document.getElementById('user_list_new_station_form').addEventListener("submit", s3radio.user_list_new_station_save);
	document.getElementById('user_list_new_station_save').addEventListener("click", s3radio.user_list_new_station_save);
	document.getElementById('user_list_new_station_delete').addEventListener("click", s3radio.user_list_new_station_delete);

	//------------------------------------------------------------------------
	var scale_height = document.documentElement.clientHeight / 400;
	var scale_width = document.documentElement.clientWidth / 350;
	var scale_value = (scale_height > scale_width) ? scale_width : scale_height;
	if (scale_value > 1) {
		document.getElementById('div_body').style.transform = 'scale(' + scale_value.toFixed(2)+ ')';
	}

	//------------------------------------------------------------------------
	s3radio.init();
}
//------------------------------------------------------------------------------
s3radio.set_theme_color = function() {
	var theme_saturate = s3radio.utils.prefs_get('theme_saturate');
	var theme_hue_rotate = s3radio.utils.prefs_get('theme_hue_rotate');
	var theme_brightness = s3radio.utils.prefs_get('theme_brightness');
	var theme_contrast = s3radio.utils.prefs_get('theme_contrast');
	var theme_hue_rotate_invert = 360 - theme_hue_rotate;

	document.getElementById('div_body').style.filter = 'saturate(' + theme_saturate + '%) hue-rotate(' + theme_hue_rotate + 'deg) brightness(' + theme_brightness + '%) contrast(' + theme_contrast + '%)';
	document.getElementById('radio_player_site_url').style.filter = 'hue-rotate(' + (theme_hue_rotate_invert+11) + 'deg) saturate(35%)';
	document.getElementById('radio_search_select_country_list').style.filter = 'hue-rotate(' + theme_hue_rotate_invert + 'deg)';

	var x = document.getElementById('div_body').querySelectorAll("#radio_station_country");
	for (var i = 0; i < x.length; i++) {
		x[i].style.filter = 'hue-rotate(' + theme_hue_rotate_invert + 'deg)';
	}

	var x2 = document.getElementById('div_body').querySelectorAll(".country_region_list");
	for (var i = 0; i < x2.length; i++) {
		x2[i].style.filter = 'hue-rotate(' + theme_hue_rotate_invert + 'deg)';
	}
}
//------------------------------------------------------------------------------
s3radio.init = function() {
	//------------------------------------------------------------------------
	//------------------------------------------------------------------------
	s3radio.current_radio = s3radio.utils.prefs_get('current_radio');

	//------------------------------------------------------------------------
	s3radio.shuffle_enabled = s3radio.utils.prefs_get('shuffle_enabled');
	document.getElementById('radio_player_shuffle').setAttribute('shuffle_enabled', s3radio.shuffle_enabled);

	//------------------------------------------------------------------------
	s3radio.sleep_timer_enabled = s3radio.utils.prefs_get('sleep_timer_enabled');
	document.getElementById('radio_player_sleep_timer').setAttribute('sleep_timer_enabled', s3radio.sleep_timer_enabled);
	var sleep_timer_value = s3radio.utils.prefs_get('sleep_timer_value');
	s3radio.utils.HTMLDOM_value(
		document.getElementById('radio_player_sleep_timer_tooltip'), 
		s3radio.utils.get_string('sleep_timer_tooltip', [ s3radio.utils.calculate_text_time(sleep_timer_value*60) ])
	);

	//------------------------------------------------------------------------
	var radio_list_show = s3radio.utils.prefs_get('radio_list_show');
	document.getElementById('radio_search_input').setAttribute('placeholder', s3radio.utils.get_string('search_placeholder'));
	document.getElementById('radio_player_list').setAttribute('is_hidden', ! radio_list_show);
	document.getElementById('radio_list_box').setAttribute('is_hidden', ! radio_list_show);
	document.getElementById('radio_box_head').setAttribute('is_hidden', ! radio_list_show);
	document.getElementById('radio_player_list').setAttribute('title', s3radio.utils.get_string((radio_list_show) ? 'hide_list_radio_stations' : 'show_list_radio_stations'));

	//------------------------------------------------------------------------
	if (s3radio.current_radio && s3radio.current_radio.country) {
		s3radio.create_player();
	}

	//------------------------------------------------------------------------
	if (s3radio.utils.prefs_get('user_list_new_show')) {
		var station_id = s3radio.utils.prefs_get('user_list_new_station_id');
		document.getElementById('div_body_player').setAttribute('is_hidden', true);
		document.getElementById('div_body_user_list_new').setAttribute('is_hidden', false);
		document.getElementById('user_list_new_station_id').value = station_id;
		document.getElementById('user_list_new_station_name').value = s3radio.utils.prefs_get('user_list_new_station_name');
		document.getElementById('user_list_new_station_stream_url').value = s3radio.utils.prefs_get('user_list_new_stream_url');
		document.getElementById('user_list_new_station_website_url').value = s3radio.utils.prefs_get('user_list_new_website_url');
		document.getElementById('user_list_new_station_delete').setAttribute('not_show', station_id ? false : true);
		if (station_id) {
			s3radio.utils.HTMLDOM_value(document.getElementById('user_list_radio_stations_new_title'), s3radio.utils.get_string('user_list_radio_stations_edit'));
		}
		//------------------------------------------------------------------
		if (s3radio.utils.prefs_get('user_list_new_last') == 'stream_url') {
			document.getElementById('user_list_new_station_stream_url').focus();
		} else if (s3radio.utils.prefs_get('user_list_new_last') == 'website_url') {
			document.getElementById('user_list_new_station_website_url').focus();
		} else {
			document.getElementById('user_list_new_station_name').focus();
		}
		//------------------------------------------------------------------
		s3radio.user_list_station_new_check();
	}
	//------------------------------------------------------------------------
	var search_text = s3radio.utils.prefs_get('search_text');
	document.getElementById('radio_search_input').value = search_text;
	s3radio.create_list_selector();
}
//------------------------------------------------------------------------------
s3radio.create_list_selector = function() {
	//------------------------------------------------------------------------
	s3radio.title_list_head_hide();
	//------------------------------------------------------------------------
	if (s3radio.utils.prefs_get('search_open')) {
		document.getElementById('radio_search_box').setAttribute('is_hidden', false);
		document.getElementById('radio_player_search').setAttribute('is_search', true);
		s3radio.create_list_by_search();
		document.getElementById('button_body_country_list_close').setAttribute('is_hidden', false);
	}
	else if (s3radio.selected_country == 'favorites') {
		s3radio.create_list_by_favorites();
		document.getElementById('radio_player_favorites').setAttribute("is_favorites", true);
		document.getElementById('button_body_country_list_close').setAttribute('is_hidden', false);
	}
	else if (s3radio.selected_country == 'user_list') {
		s3radio.create_list_by_user_list();
		document.getElementById('radio_player_user_list').setAttribute("is_user_list", true);
		document.getElementById('button_body_country_list_close').setAttribute('is_hidden', false);
	}
	else if (s3radio.selected_country && s3radio.stations[s3radio.selected_country]) {
		s3radio.create_list_by_country(s3radio.selected_country);
		document.getElementById('button_body_country_list_close').setAttribute('is_hidden', false);
	}
	else {
		document.getElementById('div_body_player').setAttribute('is_hidden', true);
		document.getElementById('div_body_country_list').setAttribute('is_hidden', false);
	}
}
//------------------------------------------------------------------------------
s3radio.title_list_head_hide = function() {
	document.getElementById('country_list_head').setAttribute('is_hidden', true);
	document.getElementById('favorite_list_head').setAttribute('is_hidden', true);
	document.getElementById('search_list_head').setAttribute('is_hidden', true);
	document.getElementById('user_list_head').setAttribute('is_hidden', true);
}
//------------------------------------------------------------------------------
s3radio.create_country_list = function() {
	s3radio.create_country_list_main();
	s3radio.create_country_list_search();
}
//------------------------------------------------------------------------------
s3radio.create_country_list_main = function() {
	var region_map = [
		{ 'region' : 'north_america', 'country_list' : [ 'cu', 'ht', 'us', 'pr', 'jm', 'ca', 'mx', 'tt', 'do' ] },
		{ 'region' : 'central_america', 'country_list' : [ 'cr', 'sv', 'ni', 'pa', 'gt', 'hn' ] },
		{ 'region' : 'south_america', 'country_list' : [ 'ar', 'bo', 'br', 'py', 'pe', 'sr', 'cl', 'co', 'mq', 'gy', 'gp', 'gf', 'ec', 'uy', 'fk', 've' ] },
		{ 'region' : 'europe', 'country_list' : [ 'be', 'by', 'cz', 'dk', 'ee', 'es', 'de', 'fr', 'gr', 'cy', 'at', 'pl', 'pt', 'ro', 'ch', 'si', 'fi', 'hr', 'ie', 'it', 'hu', 'lu', 'lt', 'nl', 'tr', 'se', 'no', 'bg', 'rs', 'ua', 'ru', 'sk', 'uk', 'mt', 'md' ] },
		{ 'region' : 'africa', 'country_list' : [ 'dz', 'cm', 'ci', 'cg', 'ng', 'za', 'eg', 'sn', 'tn', 'gh', 'ke', 'ma', 'ug', 'mg' ] },
		{ 'region' : 'asia', 'country_list' : [ 'az', 'bd', 'ge', 'kr', 'hk', 'in', 'id', 'ir', 'iq', 'kz', 'sg', 'lk', 'vn', 'il', 'th', 'my', 'np', 'sa', 'jp', 'pk', 'ph', 'cn', 'tw' ] },
		{ 'region' : 'oceania', 'country_list' : [ 'au', 'nz' ] },
	];

	for (var i=0; i<region_map.length; i++) {
		var region_id = region_map[i].region;
		var country_list = region_map[i].country_list;
		var region_box = document.getElementById('country_region_' + region_id);

		for (var i2=0; i2<country_list.length; i2++) {
			var country_id = country_list[i2];
			var country_region_box = document.createElement('div');
			country_region_box.className = 'country_region_box';

			var country_region_image = document.createElement('div');
			country_region_image.className = 'country_region_image';
			country_region_box.appendChild(country_region_image);

			var country_region_name = document.createElement('div');
			country_region_name.className = 'country_region_name';
			country_region_box.appendChild(country_region_name);

			s3radio.utils.HTMLDOM_value(country_region_name, s3radio.utils.get_country_name(country_id, true));
			country_region_image.style.backgroundImage = 'url("/skin/country/' + country_id + '.png")';
			country_region_box.setAttribute('title', s3radio.utils.get_country_name(country_id) + ' (' + s3radio.stations[country_id].length + ')');
			country_region_box.setAttribute('country_id', country_id);
			region_box.appendChild(country_region_box);

			country_region_box.addEventListener("click", function(event) {
				s3radio.selected_country = this.getAttribute('country_id');
				s3radio.pref_save('selected_country', s3radio.selected_country, function(){
					//-----------------------------------------------
					if (! s3radio.current_radio.country) {
						s3radio.current_radio = s3radio.stations[s3radio.selected_country][Math.floor(Math.random() * s3radio.stations[s3radio.selected_country].length)];
						s3radio.utils.create_station_id(s3radio.current_radio, s3radio.selected_country);
						s3radio.pref_save('current_radio', s3radio.current_radio);
						s3radio.create_player();
					}
					//-----------------------------------------------
					s3radio.create_list_by_country(s3radio.selected_country);
					document.getElementById('button_body_country_list_close').setAttribute('is_hidden', false);
					//-----------------------------------------------
					document.getElementById('div_body_player').setAttribute('is_hidden', false);
					document.getElementById('div_body_country_list').setAttribute('is_hidden', true);
				});
			}, true);
		}
	}
}
//------------------------------------------------------------------------------
s3radio.create_country_list_search = function() {
	var country_list_box = document.getElementById('radio_search_select_country_list');
	var country_list = [];

	//------------------------------------------------------------------------
	for (var country_id in s3radio.country_list) {
		country_list.push({ 'country_id' : country_id, 'name' : s3radio.utils.get_country_name(country_id) });
	}
	//------------------------------------------------------------------------
	country_list = country_list.sort(function(a, b) {
		if (a.name > b.name) { return 1; }
		if (a.name < b.name) { return -1; }
		return 0;
	});

	//------------------------------------------------------------------------
	for (var i=0; i<country_list.length; i++) {
		var country_option = document.createElement('div');
		country_option.className = 'country_list_option';
		country_option.id = 'radio_search_select_country_list_' + country_list[i].country_id;
		s3radio.utils.HTMLDOM_value(country_option, country_list[i].name);
		country_option.style.backgroundImage = 'url("/skin/country/' + country_list[i].country_id + '.png")';
		country_option.setAttribute('title', country_list[i].name);
		country_option.country_id = country_list[i].country_id;
		country_list_box.appendChild(country_option);

		//------------------------------------------------------------------
		country_option.addEventListener("click", function(event) {
			var search_country = this.country_id;
			s3radio.pref_save('search_country', search_country, function(){
				s3radio.make_search_country_current();
				s3radio.create_list_by_search();
				country_list_box.blur();
			});
		}, true);
	}

	//------------------------------------------------------------------------
	document.getElementById('radio_search_select_country_list_all').addEventListener("click", function(event) {
		s3radio.pref_save('search_country', 'all', function(){
			s3radio.make_search_country_current();
			s3radio.create_list_by_search();
			country_list_box.blur();
		});
	}, true);
	//------------------------------------------------------------------------
	document.getElementById('radio_search_select_country_list_user_list').addEventListener("click", function(event) {
		s3radio.pref_save('search_country', 'user_list', function(){
			s3radio.make_search_country_current();
			s3radio.create_list_by_search();
			country_list_box.blur();
		});
	}, true);

	//------------------------------------------------------------------------
	s3radio.make_search_country_current();
}
//------------------------------------------------------------------------------
s3radio.check_country_list_search = function() {
	var search_text = s3radio.utils.prefs_get('search_text');
	var country_station_list_all = 0;
	var user_list = s3radio.utils.prefs_get('user_list');
	var stations_list = s3radio.utils.merge_user_list(s3radio.stations, user_list);

	//------------------------------------------------------------------------
	for (var country_id in stations_list) {
		var country_station_list = 0;

		//------------------------------------------------------------------
		for (var i=0; i<stations_list[country_id].length; i++) {
			var station = s3radio.utils.clone_object(stations_list[country_id][i]);
			if (station.name.toLocaleLowerCase().indexOf(search_text.toLocaleLowerCase()) >= 0) {
				country_station_list++;
				country_station_list_all++;
			}
		}
		//------------------------------------------------------------------
		var id = 'radio_search_select_country_list_' + country_id;
		if (document.getElementById(id)) {
			document.getElementById(id).setAttribute('is_search_count', country_station_list);
			document.getElementById(id).setAttribute('title', s3radio.utils.get_country_name(country_id) + ' (' + country_station_list + ')');
		}
	}

	//------------------------------------------------------------------------
	document.getElementById('radio_search_select_country_list_all').setAttribute('title', s3radio.utils.get_string('all_countries') + ' (' + country_station_list_all + ')');
}
//------------------------------------------------------------------------------
s3radio.make_search_country_current = function() {
	var search_country = s3radio.utils.prefs_get('search_country') || 'DDD';

	//------------------------------------------------------------------------
	for (var country_id in s3radio.country_list) {
		var id = 'radio_search_select_country_list_' + country_id;
		document.getElementById(id).setAttribute('is_selected', (country_id == search_country) ? true : false);
	}

	//------------------------------------------------------------------------
	var search_country_current = document.getElementById('radio_search_select_country_current');
	if (s3radio.stations[search_country]) {
		search_country_current.setAttribute('all_countries', false);
		s3radio.utils.HTMLDOM_value(search_country_current, s3radio.utils.get_country_name(search_country));
		search_country_current.style.backgroundImage = 'url("/skin/country/' + search_country + '.png")';
		document.getElementById('radio_search_select_country_list_all').setAttribute('is_selected', false);
		document.getElementById('radio_search_select_country_list_user_list').setAttribute('is_selected', false);
	} else if (search_country == 'user_list') {
		search_country_current.setAttribute('all_countries', false);
		s3radio.utils.HTMLDOM_value(search_country_current, s3radio.utils.get_string('user_list_radio_stations'));
		search_country_current.style.backgroundImage = 'url("/skin/' + s3radio.utils.get_theme_catalog() + '/button_user_list.png")';
		document.getElementById('radio_search_select_country_list_all').setAttribute('is_selected', false);
		document.getElementById('radio_search_select_country_list_user_list').setAttribute('is_selected', true);
	} else {
		search_country_current.setAttribute('all_countries', true);
		s3radio.utils.HTMLDOM_value(search_country_current, s3radio.utils.get_string('all_countries'));
		document.getElementById('radio_search_select_country_list_all').setAttribute('is_selected', true);
		document.getElementById('radio_search_select_country_list_user_list').setAttribute('is_selected', false);
	}
}
//------------------------------------------------------------------------------
s3radio.create_player = function() {
	var radio_name = s3radio.utils.create_full_description(s3radio.current_radio);
	//------------------------------------------------------------------------
	s3radio.utils.HTMLDOM_value(document.getElementById('radio_player_name'), s3radio.current_radio.name);
	document.getElementById('radio_player_name').setAttribute('title', radio_name);
	//------------------------------------------------------------------------
	if (s3radio.current_radio.site_url) {
		document.getElementById('radio_player_name').setAttribute('href', s3radio.current_radio.site_url);
	} else {
		document.getElementById('radio_player_name').removeAttribute('href');
	}

	//------------------------------------------------------------------------
	document.getElementById('radio_player_control_play').setAttribute('started_radio', s3radio.utils.prefs_get('started_radio'));
	if (s3radio.current_radio.site_url) {
		document.getElementById('radio_player_site_url').setAttribute('href', s3radio.current_radio.site_url);
	} else {
		document.getElementById('radio_player_site_url').removeAttribute('href');
	}
	document.getElementById('radio_player_country').setAttribute('title', s3radio.utils.get_country_name(s3radio.current_radio.country));
	//------------------------------------------------------------------------
	if (s3radio.current_radio.country == 'user_list') {
		document.getElementById('radio_player_image').setAttribute('title', radio_name);
		document.getElementById('radio_player_image').setAttribute('alt', radio_name);
		document.getElementById('radio_player_image').src = '/skin/station_user_list.png';
		document.getElementById('radio_player_country').src = '/skin/' + s3radio.utils.get_theme_catalog() + '/button_user_list.png';
	} else {
		document.getElementById('radio_player_image').setAttribute('title', radio_name);
		document.getElementById('radio_player_image').setAttribute('alt', radio_name);
		document.getElementById('radio_player_image').src = 'https://www.s3blog.org/s3radio-files/stations/'  + s3radio.current_radio.country + '/' + s3radio.current_radio.image;
		document.getElementById('radio_player_country').src = '/skin/country/'  + s3radio.current_radio.country + '.png';
//		document.getElementById('radio_player_country_list').style.backgroundImage = 'url("/skin/country/' + s3radio.current_radio.country + '.png")';
	}

	//------------------------------------------------------------------------
	var radio_station_box = document.getElementById('radio_list_' + s3radio.current_radio.id);
	if (radio_station_box) {
		s3radio.utils.get_element(radio_station_box, 'radio_station_play').setAttribute('started_radio', s3radio.utils.prefs_get('started_radio'));
//		radio_station_box.scrollIntoView();
	}

	//------------------------------------------------------------------------
	var favorites_list = s3radio.utils.prefs_get('favorites_list');
	if (favorites_list[s3radio.current_radio.id]) {
		document.getElementById('radio_player_station_favorites').setAttribute('is_favorite', true);
		document.getElementById('radio_player_station_favorites').setAttribute('title', s3radio.utils.get_string('remove_from_favorites'));
	} else {
		document.getElementById('radio_player_station_favorites').setAttribute('is_favorite', false);
		document.getElementById('radio_player_station_favorites').setAttribute('title', s3radio.utils.get_string('add_to_favorites'));
	}

	//------------------------------------------------------------------------
	document.getElementById('radio_player_control_volume').value = s3radio.utils.prefs_get('volume_value');
	s3radio.volume_value();
}
//------------------------------------------------------------------------------
s3radio.create_list_by_country = function(country_id) {
	if (! s3radio.stations[country_id]) {
		return;
	}

	//------------------------------------------------------------------------
	s3radio.station_list = s3radio.utils.clone_object(s3radio.stations[country_id]).sort(function(a, b) {
		if (String(a.name).toLowerCase() > String(b.name).toLowerCase()) { return 1; }
		if (String(a.name).toLowerCase() < String(b.name).toLowerCase()) { return -1; }
		return 0;
	});

	//------------------------------------------------------------------------
	for (var i=0; i<s3radio.station_list.length; i++) {
		s3radio.utils.create_station_id(s3radio.station_list[i], country_id);
	}

	//------------------------------------------------------------------------
	if (s3radio.shuffle_enabled) {
		chrome.runtime.sendMessage({ 'action_set_station_list' : true, 'station_list' : s3radio.station_list }, function(response) {});
	}
	//------------------------------------------------------------------------
	s3radio.title_list_head_hide();
	document.getElementById('country_list_head').setAttribute('is_hidden', false);
	s3radio.utils.HTMLDOM_value(document.getElementById('country_list_head'), s3radio.utils.get_country_name(country_id));
	//------------------------------------------------------------------------
	s3radio.create_list_elements();
}
//------------------------------------------------------------------------------
s3radio.create_list_by_favorites = function() {
	var favorites_list = s3radio.utils.prefs_get('favorites_list');
	var user_list = s3radio.utils.prefs_get('user_list');
	//------------------------------------------------------------------------
	s3radio.station_list = [];

	//------------------------------------------------------------------------
	for (var favorite_id in favorites_list) {
		if (typeof favorites_list[favorite_id] != 'object') {
			favorites_list[favorite_id] = { 'country' : favorites_list[favorite_id], 'order' : (new Date()).getTime() };
		}
		//------------------------------------------------------------------
		var country_id = favorites_list[favorite_id].country;
		//------------------------------------------------------------------
		if (s3radio.stations[country_id]) {
			for (var i=0; i<s3radio.stations[country_id].length; i++) {
				var station = s3radio.utils.clone_object(s3radio.stations[country_id][i]);
				s3radio.utils.create_station_id(station, country_id);
				if (station.id == favorite_id) {
					station.order = favorites_list[favorite_id].order;
					s3radio.station_list.push(station);
				}
			}
		}
		//------------------------------------------------------------------
		else {
			var user_station = s3radio.utils.check_is_user_list(favorite_id, user_list);
			if (user_station) {
				s3radio.utils.create_station_id(user_station);
				user_station.order = favorites_list[favorite_id].order;
				s3radio.station_list.push(user_station);
			}
		}
	}

	//------------------------------------------------------------------------
	s3radio.station_list = s3radio.station_list.sort(function(a, b) {
		if (a.order > b.order) { return 1; }
		if (a.order < b.order) { return -1; }
		return 0;
	});

	//------------------------------------------------------------------------
	if (s3radio.shuffle_enabled) {
		chrome.runtime.sendMessage({ 'action_set_station_list' : true, 'station_list' : s3radio.station_list }, function(response) {});
	}
	//------------------------------------------------------------------------
	s3radio.title_list_head_hide();
	document.getElementById('favorite_list_head').setAttribute('is_hidden', false);
	//------------------------------------------------------------------------
	s3radio.create_list_elements();
}
//------------------------------------------------------------------------------
s3radio.create_list_by_user_list = function() {
	var user_list = s3radio.utils.prefs_get('user_list');
	s3radio.station_list = [];

	//------------------------------------------------------------------------
	for (var user_list_id in user_list) {
		var user_station = user_list[user_list_id];
		var station = s3radio.utils.clone_object(user_station);
		s3radio.utils.create_station_id(station);
		s3radio.station_list.push(station);
	}

	//------------------------------------------------------------------------
	s3radio.station_list = s3radio.station_list.sort(function(a, b) {
		if (a.order > b.order) { return 1; }
		if (a.order < b.order) { return -1; }
		return 0;
	});

	//------------------------------------------------------------------------
	if (s3radio.shuffle_enabled) {
		chrome.runtime.sendMessage({ 'action_set_station_list' : true, 'station_list' : s3radio.station_list }, function(response) {});
	}
	//------------------------------------------------------------------------
	s3radio.title_list_head_hide();
	document.getElementById('user_list_head').setAttribute('is_hidden', false);
	//------------------------------------------------------------------------
	s3radio.create_list_elements();
}
//------------------------------------------------------------------------------
s3radio.create_list_by_search = function() {
	var search_text = s3radio.utils.prefs_get('search_text');
	//------------------------------------------------------------------------
	var search_country = s3radio.utils.prefs_get('search_country') || 'DDD';
	var user_list = s3radio.utils.prefs_get('user_list');
	var stations_list = s3radio.utils.merge_user_list(s3radio.stations, user_list);

	//------------------------------------------------------------------------
	if (! stations_list[search_country]) { search_country = ''; }

	s3radio.station_list = [];
	//------------------------------------------------------------------------
	for (var country_id in stations_list) {
		if ((country_id == search_country) || (search_country == '')) {
			for (var i=0; i<stations_list[country_id].length; i++) {
				var station = s3radio.utils.clone_object(stations_list[country_id][i]);
				s3radio.utils.create_station_id(station, country_id);
				if (station.name.toLocaleLowerCase().indexOf(search_text.toLocaleLowerCase()) >= 0) {
					s3radio.station_list.push(station);
				}
			}
		}
	}

	//------------------------------------------------------------------------
	s3radio.station_list = s3radio.station_list.sort(function(a, b) {
		if (String(a.name).toLowerCase() > String(b.name).toLowerCase()) { return 1; }
		if (String(a.name).toLowerCase() < String(b.name).toLowerCase()) { return -1; }
		return 0;
	});

	//------------------------------------------------------------------------
	if (search_country == '') {
		document.getElementById('radio_search_select_country_current').setAttribute('title', s3radio.utils.get_string('all_countries') + ' (' + s3radio.station_list.length + ')');
	} else {
		document.getElementById('radio_search_select_country_current').setAttribute('title', s3radio.utils.get_country_name(search_country) + ' (' + s3radio.station_list.length + ')');
	}

	//------------------------------------------------------------------------
	if (s3radio.shuffle_enabled) {
		chrome.runtime.sendMessage({ 'action_set_station_list' : true, 'station_list' : s3radio.station_list }, function(response) {});
	}
	//------------------------------------------------------------------------
	s3radio.title_list_head_hide();
	document.getElementById('search_list_head').setAttribute('is_hidden', false);
	//------------------------------------------------------------------------
	s3radio.create_list_elements();
}
//------------------------------------------------------------------------------
s3radio.create_list_elements = function(is_plus, is_direction_down) {
	var radio_list_box = document.getElementById('radio_list_box');
	var list_length = 200;

	//------------------------------------------------------------------------
	if (! is_plus) {
		radio_list_box.scrollTop = 0;
		while (radio_list_box.firstChild) {
			radio_list_box.removeChild(radio_list_box.firstChild);
		}
		radio_list_box.setAttribute('not_empty', s3radio.station_list.length);
 		radio_list_box.appendChild(document.createElement("div"));
		document.getElementById('radio_list_box_is_empty').setAttribute('not_empty', s3radio.station_list.length);
	}

	//------------------------------------------------------------------------
	var last_scrollTop = radio_list_box.scrollTop;
	var first_view_element = radio_list_box.firstChild;
	//------------------------------------------------------------------------
	while (last_scrollTop > 0) {
		last_scrollTop = last_scrollTop - first_view_element.clientHeight;
		if (first_view_element.nextSibling) {
			first_view_element = first_view_element.nextSibling;
		}
	}

	//------------------------------------------------------------------------
	var favorites_list = s3radio.utils.prefs_get('favorites_list');
	var started_radio = s3radio.utils.prefs_get('started_radio');
	var add_to_favorites_text = s3radio.utils.get_string('add_to_favorites');
	var remove_from_favorites_text = s3radio.utils.get_string('remove_from_favorites');
	var radio_station_box_sep = radio_list_box.firstChild;

	//------------------------------------------------------------------------
	if (is_plus) {
		if (is_direction_down) {
			radio_list_box.list_start = radio_list_box.list_end;
			radio_list_box.list_end = s3radio.station_list.length;
			if ((radio_list_box.list_end - radio_list_box.list_start) > list_length/2) {
				radio_list_box.list_end = radio_list_box.list_start + list_length/2;
			}
		} else {
			radio_list_box.list_end = radio_list_box.list_start;
			radio_list_box.list_start = radio_list_box.list_start - list_length/2;
			if (radio_list_box.list_start < 0) {
				radio_list_box.list_start = 0;
			}
		}
	}
	//------------------------------------------------------------------------
	else {
		var index_id = s3radio.station_list.findIndex(function(station){
			return (station.id == s3radio.current_radio.id) ? true : false;
		});
		radio_list_box.list_start = 0;
		radio_list_box.list_end = s3radio.station_list.length;

		if (radio_list_box.list_end > list_length) {
			if (index_id >= 0) {
				if ((index_id+list_length/2) > radio_list_box.list_end) {
					radio_list_box.list_start = radio_list_box.list_end - list_length;
				} else if ((index_id-list_length/2) < 0) {
					radio_list_box.list_end = list_length;
				} else {
					radio_list_box.list_start = index_id - list_length/2;
					radio_list_box.list_end = radio_list_box.list_start + list_length;
				}
				if (radio_list_box.list_start < 0) {
					radio_list_box.list_start = 0;
				}
				if (radio_list_box.list_end > s3radio.station_list.length) {
					radio_list_box.list_end = s3radio.station_list.length;
				}
			} else {
				radio_list_box.list_end = list_length;
			}
		}
	}

	//------------------------------------------------------------------------
	var new_element_count = 0;
	var search_open = s3radio.utils.prefs_get('search_open');

	//------------------------------------------------------------------------
	for (var i=radio_list_box.list_start; i<radio_list_box.list_end; i++) {
		var station = s3radio.station_list[i];
		//------------------------------------------------------------------
		if (document.getElementById('radio_list_' + station.id)) {
			continue;
		}
		//------------------------------------------------------------------
		var radio_list_template = document.getElementById('radio_list_template').cloneNode(true);
		var radio_station_box = s3radio.utils.get_element(radio_list_template, 'radio_station_box');

		//------------------------------------------------------------------
		if (((s3radio.selected_country == 'favorites') || (s3radio.selected_country == 'user_list')) && ! search_open) {
			s3radio.utils.get_element(radio_list_template, 'radio_station_order').setAttribute('is_hidden', false);
		} else {
			s3radio.utils.get_element(radio_list_template, 'radio_station_order').setAttribute('is_hidden', true);
		}
		//------------------------------------------------------------------
		if ((s3radio.selected_country == 'user_list') && ! search_open) {
			s3radio.utils.get_element(radio_list_template, 'radio_station_country').setAttribute('is_hidden', true);
			s3radio.utils.get_element(radio_list_template, 'radio_station_user_list_edit').setAttribute('is_hidden', false);
			s3radio.utils.get_element(radio_station_box, 'radio_station_user_list_edit').setAttribute('title', s3radio.utils.get_string('user_list_radio_stations_edit'));
		} else {
			s3radio.utils.get_element(radio_list_template, 'radio_station_country').setAttribute('is_hidden', false);
			s3radio.utils.get_element(radio_list_template, 'radio_station_user_list_edit').setAttribute('is_hidden', true);
		}

		//------------------------------------------------------------------
		radio_station_box.id = 'radio_list_' + station.id;

		//------------------------------------------------------------------
		s3radio.utils.HTMLDOM_value(s3radio.utils.get_element(radio_station_box, 'radio_station_name'), station.name);
		var radio_name = s3radio.utils.create_full_description(station);
		//------------------------------------------------------------------
		if (station.country == 'user_list') {
			s3radio.utils.get_element(radio_station_box, 'radio_station_name').setAttribute('title', radio_name);
			s3radio.utils.get_element(radio_station_box, 'radio_station_country').style.backgroundImage = 'url("/skin/' + s3radio.utils.get_theme_catalog() + '/button_user_list.png")';
			s3radio.utils.get_element(radio_station_box, 'radio_station_country').setAttribute('title', s3radio.utils.get_string('user_list_radio_stations'));
			s3radio.utils.get_element(radio_station_box, 'radio_station_country').setAttribute('is_user_list', true);
		} else {
			s3radio.utils.get_element(radio_station_box, 'radio_station_name').setAttribute('title', radio_name);
			s3radio.utils.get_element(radio_station_box, 'radio_station_country').style.backgroundImage = 'url("/skin/country/' + station.country + '.png")';
			s3radio.utils.get_element(radio_station_box, 'radio_station_country').setAttribute('title', s3radio.utils.get_country_name(station.country));
		}

		//------------------------------------------------------------------
		if (s3radio.current_radio.id == station.id) {
			s3radio.utils.get_element(radio_station_box, 'radio_station_play').setAttribute('started_radio', started_radio);
			radio_station_box.setAttribute('current_radio', true);
		} else {
			s3radio.utils.get_element(radio_station_box, 'radio_station_play').setAttribute('started_radio', 'pause');
			radio_station_box.setAttribute('current_radio', false);
		}

		//------------------------------------------------------------------
		if (favorites_list[station.id]) {
			s3radio.utils.get_element(radio_station_box, 'radio_station_favorites').setAttribute('is_favorite', true);
			s3radio.utils.get_element(radio_station_box, 'radio_station_favorites').setAttribute('title', remove_from_favorites_text);
		} else {
			s3radio.utils.get_element(radio_station_box, 'radio_station_favorites').setAttribute('title', add_to_favorites_text);
		}

		//------------------------------------------------------------------
		if (is_plus && ! is_direction_down) {
 			radio_list_box.insertBefore(radio_station_box, radio_station_box_sep);
		} else {
			radio_list_box.appendChild(radio_station_box);
		}
		//------------------------------------------------------------------
		if (is_plus && is_direction_down) {
			radio_list_box.removeChild(radio_list_box.firstChild);
		}
		else if (is_plus && ! is_direction_down) {
			if (radio_station_box_sep != radio_list_box.lastChild) {
				radio_list_box.removeChild(radio_list_box.lastChild);
			}
		}
		s3radio.create_list_events(radio_station_box, station);
		new_element_count++;
	}

	//------------------------------------------------------------------------
	if (is_plus) {
		if (! s3radio.stop_event_scroll) {
			if (new_element_count>0) {
				first_view_element.scrollIntoView();
			}
		}
	}
	//------------------------------------------------------------------------
	else {
		var radio_station_box = document.getElementById('radio_list_' + s3radio.current_radio.id);
		if (radio_station_box) {
			s3radio.stop_event_scroll = true;
			s3radio.scrollIntoView(radio_station_box, 4);
			setTimeout(function(){
				s3radio.stop_event_scroll = false;
			}, 100);
		}
	}

	//------------------------------------------------------------------------
	s3radio.set_theme_color();
}
//------------------------------------------------------------------------------
s3radio.create_list_elements_plus = function(event) {
	var radio_list_box = document.getElementById('radio_list_box');
	if (! radio_list_box.last_scrollTop) { radio_list_box.last_scrollTop = radio_list_box.scrollTop; }

	var last_scrollTop = radio_list_box.last_scrollTop;
	var scrollTop = radio_list_box.scrollTop;
	var clientHeight = radio_list_box.clientHeight;
	var scrollHeight = radio_list_box.scrollHeight;
	radio_list_box.last_scrollTop = radio_list_box.scrollTop;

	if (scrollTop > last_scrollTop) {
		if ((scrollTop + clientHeight + 300) >= scrollHeight) {
			s3radio.create_list_elements(true, true);
		}
	} else if (scrollTop < last_scrollTop) {
		if (scrollTop < 200) {
			s3radio.create_list_elements(true, false);
		}
	}
}
//------------------------------------------------------------------------------
s3radio.create_list_events = function(radio_station_box, station) {
	radio_station_box.station = station;
	//------------------------------------------------------------------------
	s3radio.utils.get_element(radio_station_box, 'radio_station_name').addEventListener("dblclick", function(event) {
		if (s3radio.current_radio.id == station.id) {
			s3radio.radio_play();
		} else {
			s3radio.station_switch(station);
		}
	}, true);

	//------------------------------------------------------------------------
	s3radio.utils.get_element(radio_station_box, 'radio_station_name').addEventListener("touchstart", function(event) {
		radio_station_box.touch_station_id = station.id;
	}, true);
	//------------------------------------------------------------------------
	s3radio.utils.get_element(radio_station_box, 'radio_station_name').addEventListener("touchmove", function(event) {
		radio_station_box.touch_station_id = null;
	}, true);
	//------------------------------------------------------------------------
	s3radio.utils.get_element(radio_station_box, 'radio_station_name').addEventListener("touchend", function(event) {
		if (radio_station_box.touch_station_id == station.id) {
			if (s3radio.current_radio.id == station.id) {
				s3radio.radio_play();
			} else {
				s3radio.station_switch(station);
			}
		}
	}, true);

	//------------------------------------------------------------------------
	s3radio.utils.get_element(radio_station_box, 'radio_station_play').addEventListener("click", function(event) {
		if (s3radio.current_radio.id == station.id) {
			s3radio.radio_play();
		} else {
			s3radio.station_switch(station);
		}
	}, true);

	//------------------------------------------------------------------------
	s3radio.utils.get_element(radio_station_box, 'radio_station_favorites').addEventListener("click", function(event) {
		var favorites_list = s3radio.utils.prefs_get('favorites_list');
		if (favorites_list[station.id]) {
			delete favorites_list[station.id];
		} else {
			favorites_list[station.id] = { 'country' : station.country, 'order' : (new Date()).getTime() };
		}
		s3radio.pref_save('favorites_list', favorites_list, function(){
			var search_open = s3radio.utils.prefs_get('search_open');
			if ((! search_open) && s3radio.selected_country == 'favorites') {
				s3radio.create_list_by_favorites();
			} else {
				s3radio.create_list_elements();
			}
			s3radio.create_player();
		});
	}, true);

	//------------------------------------------------------------------------
	s3radio.utils.get_element(radio_station_box, 'radio_station_country').addEventListener("click", function(event) {
		if (s3radio.utils.prefs_get('search_open')) {
			s3radio.pref_save('search_country', station.country, function(){
				s3radio.make_search_country_current();
				s3radio.create_list_selector();
			});
		} else {
			s3radio.selected_country = station.country;
			s3radio.pref_save('selected_country', s3radio.selected_country, function(){
			s3radio.create_list_selector();
			});
		}
	});

	//------------------------------------------------------------------------
	s3radio.utils.get_element(radio_station_box, 'radio_station_user_list_edit').addEventListener("click", function(event) {
		document.getElementById('div_body_player').setAttribute('is_hidden', true);
		document.getElementById('div_body_user_list_new').setAttribute('is_hidden', false);
		document.getElementById('user_list_new_station_name').value = station.name;
		document.getElementById('user_list_new_station_stream_url').value = station.radio_url;
		document.getElementById('user_list_new_station_website_url').value = station.site_url;
		document.getElementById('user_list_new_station_id').value = station.id;
		document.getElementById('user_list_new_station_name').focus();
		document.getElementById('user_list_new_station_delete').setAttribute('not_show', false);
		s3radio.pref_save('user_list_new_show', true);
		s3radio.pref_save('user_list_new_station_id', station.id);
		s3radio.pref_save('user_list_new_station_name', station.name);
		s3radio.pref_save('user_list_new_stream_url', station.radio_url);
		s3radio.pref_save('user_list_new_website_url', station.site_url);
		s3radio.pref_save('user_list_new_last', 'station_name');

		document.getElementById('user_list_new_station_delete').removeAttribute('is_confirm');
		s3radio.utils.HTMLDOM_value(document.getElementById('user_list_new_station_delete'), s3radio.utils.get_string('user_list_radio_stations_new_delete'));
		s3radio.utils.HTMLDOM_value(document.getElementById('user_list_radio_stations_new_title'), s3radio.utils.get_string('user_list_radio_stations_edit'));
		//------------------------------------------------------------------
		s3radio.user_list_station_new_check();
	});

	//------------------------------------------------------------------------
	//------------------------------------------------------------------------
	s3radio.utils.get_element(radio_station_box, 'radio_station_order').addEventListener("dragstart", function(event) {
		s3radio.draggable = {
			'start_element' : radio_station_box,
			'movement_y' : 'still',
			'client_y' :  event.clientY,
			'timeout_id' : {}
		};
		event.dataTransfer.setData('text/plain', ''); // for fix Firefox gluches...
		event.dataTransfer.setDragImage(radio_station_box, 340, 10);
		event.dataTransfer.effectAllowed = "move";
	}, true);
	//------------------------------------------------------------------------
	s3radio.utils.get_element(radio_station_box, 'radio_station_order').addEventListener("dragend", function(event) {
		radio_station_box.removeAttribute('drag_start');
	}, true);
	//------------------------------------------------------------------------
	radio_station_box.addEventListener("dragover", function(event) {
		if (s3radio.draggable == null) { return false; }
		if (s3radio.draggable.start_element == radio_station_box) { return false; }

		//------------------------------------------------------------------
		s3radio.draggable.start_element.setAttribute('drag_start', true);

		//------------------------------------------------------------------
		if (s3radio.draggable.timeout_id[radio_station_box.id]) {
			clearTimeout(s3radio.draggable.timeout_id[radio_station_box.id]);
		}

		//------------------------------------------------------------------
		if ((event.clientY-3) > s3radio.draggable.client_y) {
			s3radio.draggable.movement_y = 'down';
			s3radio.draggable.client_y = event.clientY;
		} else if ((event.clientY+3) < s3radio.draggable.client_y) {
			s3radio.draggable.movement_y = 'up';
			s3radio.draggable.client_y = event.clientY;
		}

		//------------------------------------------------------------------
		setTimeout(function() { 
			radio_station_box.setAttribute('drag_over', true);
			radio_station_box.setAttribute('drag_movement_y', (s3radio.draggable) ? s3radio.draggable.movement_y : 0);
		}, 50);
		//------------------------------------------------------------------
		event.preventDefault();
	}, true);
	//------------------------------------------------------------------------
	radio_station_box.addEventListener("dragleave", function(event) {
		s3radio.draggable.timeout_id[radio_station_box.id] = setTimeout(function() { 
			radio_station_box.removeAttribute('drag_over');
		}, 50);
	}, true);
	//------------------------------------------------------------------------
	radio_station_box.addEventListener("drop", function(event) {
		var station_list = null;
		//------------------------------------------------------------------
		if (s3radio.selected_country == 'favorites') {
			var favorites_list = s3radio.utils.prefs_get('favorites_list');
			if (favorites_list[radio_station_box.station.id] && favorites_list[s3radio.draggable.start_element.station.id]) {
				station_list = favorites_list;
			}
		}
		//------------------------------------------------------------------
		else if (s3radio.selected_country == 'user_list') {
			var user_list = s3radio.utils.prefs_get('user_list');
			if (s3radio.utils.check_is_user_list(radio_station_box.station.id, user_list) && s3radio.utils.check_is_user_list(s3radio.draggable.start_element.station.id, user_list)) {
				station_list = user_list;
			}
		}
		//------------------------------------------------------------------
		if (station_list) {
			var start_id = s3radio.station_list.findIndex(function(station){
				return (station.id == s3radio.draggable.start_element.station.id) ? true : false;
			});
			var removed = s3radio.station_list.splice(start_id, 1);
			//------------------------------------------------------------
			var drop_id = s3radio.station_list.findIndex(function(station){
				return (station.id == radio_station_box.station.id) ? true : false;
			});
			if (s3radio.draggable.movement_y == 'down') {
				s3radio.station_list.splice(drop_id+1, 0, removed[0]);
			} else {
				s3radio.station_list.splice(drop_id, 0, removed[0]);
			}

			//------------------------------------------------------------
			for (var i=0; i<s3radio.station_list.length; i++) {
				s3radio.station_list[i].order = i+1;
				if (station_list[s3radio.station_list[i].id]) {
					station_list[s3radio.station_list[i].id].order = i+1;
				}
			}
			//------------------------------------------------------------
			if (s3radio.selected_country == 'favorites') {
				s3radio.pref_save('favorites_list', station_list);
			}
			//------------------------------------------------------------
			else if (s3radio.selected_country == 'user_list') {
				s3radio.pref_save('user_list', user_list);
			}
			//------------------------------------------------------------
			s3radio.pref_save('prev_radio', []);
			s3radio.pref_save('next_radio', []);
			//------------------------------------------------------------
			if (s3radio.shuffle_enabled) {
				chrome.runtime.sendMessage({ 'action_set_station_list' : true, 'station_list' : s3radio.station_list }, function(response) {});
			}
			//------------------------------------------------------------
			s3radio.create_list_elements();
		}

		radio_station_box.removeAttribute('drag_over');
		s3radio.draggable = null;
		event.preventDefault();
	}, true);
}
//------------------------------------------------------------------------------
s3radio.station_switch = function(station, no_history) {
	//------------------------------------------------------------------------
	var radio_station_box = document.getElementById('radio_list_' + s3radio.current_radio.id);
	if (radio_station_box) {
		radio_station_box.setAttribute('current_radio', false);
		s3radio.utils.get_element(radio_station_box, 'radio_station_play').setAttribute('started_radio', 'pause');
	}
	//------------------------------------------------------------------------
	if (! no_history) {
		s3radio.pref_save('prev_radio', s3radio.utils.set_prev_radio(s3radio.current_radio));
		s3radio.pref_save('next_radio', []);
	}
	//------------------------------------------------------------------------
	s3radio.current_radio = station;
	s3radio.pref_save('current_radio', s3radio.current_radio);
	s3radio.pref_save('started_radio', 'pause', function(){
		s3radio.radio_play();
	});
	//------------------------------------------------------------------------
	var radio_station_box = document.getElementById('radio_list_' + s3radio.current_radio.id);
	if (radio_station_box) {
		radio_station_box.setAttribute('current_radio', true);
	}
}
//------------------------------------------------------------------------------
s3radio.radio_play = function() {
	var started_radio = s3radio.utils.prefs_get('started_radio');
	started_radio = (started_radio == 'pause') ? 'wait' : 'pause';
	s3radio.pref_save('started_radio', started_radio, function(){
		var radio_name = s3radio.current_radio.name + ' (' + s3radio.utils.get_country_name(s3radio.current_radio.country) + ')';
		chrome.runtime.sendMessage({ 'action_radio_play' : true, 'current_radio' : s3radio.current_radio, 'radio_name' : radio_name, 'started_radio' : started_radio }, function(response) { });
		s3radio.create_player();
	});
}
//------------------------------------------------------------------------------
s3radio.radio_station_prev_next = function(is_next) {
	var current_id = -1;

	//------------------------------------------------------------------------
	for (var i=0; i<s3radio.station_list.length; i++) {
		var station = s3radio.station_list[i];
		if (s3radio.current_radio.id == station.id) {
			current_id = i;
			break;
		}
	}

	//------------------------------------------------------------------------
	if (is_next) {
		var next_radio_list = s3radio.utils.prefs_get('next_radio');
		var next_radio = next_radio_list.pop();
		var index_id = -1;
		//------------------------------------------------------------------
		if (next_radio) {
			index_id = s3radio.station_list.findIndex(function(station){
				return (station.id == next_radio.id) ? true : false;
			});
		}
		//------------------------------------------------------------------
		if (index_id >= 0) {
			current_id = index_id;
		} else {
			current_id++;
			if (current_id >= s3radio.station_list.length) {
				current_id = 0;
			}
		}
		//------------------------------------------------------------------
		s3radio.pref_save('prev_radio', s3radio.utils.set_prev_radio(s3radio.current_radio));
		s3radio.pref_save('next_radio', next_radio_list);
	}
	//------------------------------------------------------------------------
	else {
		var prev_radio_list = s3radio.utils.prefs_get('prev_radio');
		var prev_radio = prev_radio_list.pop();
		var index_id = -1;
		//------------------------------------------------------------------
		if (prev_radio) {
			index_id = s3radio.station_list.findIndex(function(station){
				return (station.id == prev_radio.id) ? true : false;
			});
		}
		//------------------------------------------------------------------
		if (index_id >= 0) {
			current_id = index_id;
		} else {
			current_id--;
			if (current_id < 0) {
				current_id = s3radio.station_list.length - 1;
			}
		}
		//------------------------------------------------------------------
		s3radio.pref_save('prev_radio', prev_radio_list);
		s3radio.pref_save('next_radio', s3radio.utils.set_next_radio(s3radio.current_radio));
	}

	//------------------------------------------------------------------------
	if (s3radio.station_list[current_id]) {
		s3radio.station_switch(s3radio.station_list[current_id], true);
		//------------------------------------------------------------------
		var radio_station_box = document.getElementById('radio_list_' + s3radio.current_radio.id);
		if (radio_station_box) {
			s3radio.stop_event_scroll = true;
			s3radio.scrollIntoView(radio_station_box, 4);
			setTimeout(function(){
				s3radio.scrollIntoView(radio_station_box, 4);
				s3radio.stop_event_scroll = false;
			}, 100);
		} else {
			s3radio.create_list_elements();
		}
	}
}
//------------------------------------------------------------------------------
s3radio.radio_station_random = function() {
	var current_id = Math.floor(Math.random() * s3radio.station_list.length);
	s3radio.station_switch(s3radio.station_list[current_id]);

	s3radio.create_list_elements();
}
//------------------------------------------------------------------------------
s3radio.radio_station_shuffle = function() {
	s3radio.shuffle_enabled = ! s3radio.shuffle_enabled;
	chrome.runtime.sendMessage({ 'action_shuffle_enabled' : true, 'is_enabled' : s3radio.shuffle_enabled, 'station_list' : s3radio.station_list }, function(response) {
		document.getElementById('radio_player_shuffle').setAttribute('shuffle_enabled', s3radio.shuffle_enabled);
	});
}
//------------------------------------------------------------------------------
s3radio.radio_player_sleep_timer = function() {
	s3radio.sleep_timer_enabled = ! s3radio.sleep_timer_enabled;
	chrome.runtime.sendMessage({ 'action_sleep_timer_enabled' : true, 'is_enabled' : s3radio.sleep_timer_enabled }, function(response) {
		document.getElementById('radio_player_sleep_timer').setAttribute('sleep_timer_enabled', s3radio.sleep_timer_enabled);
	});
}
//------------------------------------------------------------------------------
s3radio.volume_value = function() {
	var volume_value = document.getElementById('radio_player_control_volume').value;
	var volume_value_img = 0;
	if ((volume_value > 0) && (volume_value <= 33)) {
		volume_value_img = 1;
	}
	else if ((volume_value > 33) && (volume_value <= 80)) {
		volume_value_img = 2;
	}
	else if (volume_value > 80) {
		volume_value_img = 3;
	}
	document.getElementById('radio_player_control_sound').setAttribute('volume', volume_value_img);
	document.getElementById('radio_player_control_sound').setAttribute('title', volume_value + '%');
	document.getElementById('radio_player_control_volume').setAttribute('title', volume_value + '%');
}
//------------------------------------------------------------------------------
s3radio.scrollIntoView = function(node, count) {
	while (node.previousSibling && count > 0) {
		node = node.previousSibling;
		count--;
	}
	node.scrollIntoView();
}
//------------------------------------------------------------------------------
s3radio.user_list_station_new_set = function(event) {
	s3radio.pref_save('user_list_new_station_name', document.getElementById('user_list_new_station_name').value);
	s3radio.pref_save('user_list_new_stream_url', document.getElementById('user_list_new_station_stream_url').value);
	s3radio.pref_save('user_list_new_website_url', document.getElementById('user_list_new_station_website_url').value);
	s3radio.pref_save('user_list_new_last', (event.target.id == 'user_list_new_station_stream_url') ? 'stream_url' : (event.target.id == 'user_list_new_station_website_url') ? 'website_url' : 'station_name');
	s3radio.user_list_station_new_check();
}
//------------------------------------------------------------------------------
s3radio.user_list_station_new_close = function(event) {
	document.getElementById('div_body_player').setAttribute('is_hidden', false);
	document.getElementById('div_body_user_list_new').setAttribute('is_hidden', true);
	document.getElementById('user_list_new_station_id').value = '';
	document.getElementById('user_list_new_station_name').value = '';
	document.getElementById('user_list_new_station_stream_url').value = '';
	document.getElementById('user_list_new_station_website_url').value = '';
	document.getElementById('user_list_new_station_delete').setAttribute('not_show', true);
	s3radio.pref_save('user_list_new_show', false);
}
//------------------------------------------------------------------------------
s3radio.user_list_station_new_check = function() {
	var station_name = document.getElementById('user_list_new_station_name').value;
	var stream_url = document.getElementById('user_list_new_station_stream_url').value;
	var website_url = document.getElementById('user_list_new_station_website_url').value;
	//------------------------------------------------------------------
	document.getElementById('user_list_new_station_name').setAttribute('is_error', false);
	document.getElementById('user_list_new_station_stream_url').setAttribute('is_error', false);
	document.getElementById('user_list_new_station_website_url').setAttribute('is_error', false);
	document.getElementById('user_list_new_station_save').removeAttribute('disabled');

	//------------------------------------------------------------------
	var is_ok = true;
	//------------------------------------------------------------------
	if (station_name.trim() == '') {
		is_ok = false;
		document.getElementById('user_list_new_station_name').setAttribute('is_error', true);
	}
	//------------------------------------------------------------------
	if (! /^https?\:\/\/.+/.test(stream_url.trim())) {
		is_ok = false;
		document.getElementById('user_list_new_station_stream_url').setAttribute('is_error', true);
	}
	//------------------------------------------------------------------
	if (website_url && (! /^https?\:\/\/.+/.test(website_url.trim()))) {
		is_ok = false;
		document.getElementById('user_list_new_station_website_url').setAttribute('is_error', true);
	}
	//------------------------------------------------------------------
	document.getElementById('user_list_new_station_name').value = station_name;
	document.getElementById('user_list_new_station_stream_url').value = stream_url;
	document.getElementById('user_list_new_station_website_url').value = website_url;

	//------------------------------------------------------------------
	if (! is_ok) {
		document.getElementById('user_list_new_station_save').setAttribute('disabled', true);
	}
	//------------------------------------------------------------------
	return is_ok;
}
//------------------------------------------------------------------------------
s3radio.user_list_new_station_save = function(event) {
	try {
		event.preventDefault();
		event.stopPropagation();
	} catch(e) {
	}

	if (s3radio.user_list_station_new_check()) {
		var station_name = document.getElementById('user_list_new_station_name').value.trim();
		var stream_url = document.getElementById('user_list_new_station_stream_url').value.trim();
		var website_url = document.getElementById('user_list_new_station_website_url').value.trim();
		var station_id = document.getElementById('user_list_new_station_id').value;

		var user_list = s3radio.utils.prefs_get('user_list');
		var order = 0;
		//------------------------------------------------------------------
		if (station_id && user_list[station_id]) {
			order = user_list[station_id].order;
		} else {
			station_id = 'user_list.user_list_' + s3radio.utils.random_string(16);
		}
		//------------------------------------------------------------------
		user_list[station_id] = {
			"name" : station_name,
			"image" : station_id.replace(/^user_list\./, ''),
			"site_url" : website_url,
			"radio_url" : stream_url,
			"description" : null,
			"country" : 'user_list',
			"order" : order
		};
		//------------------------------------------------------------------
		s3radio.pref_save('user_list', user_list, function(){
			s3radio.user_list_station_new_close();
			s3radio.create_list_selector();
			if (s3radio.current_radio.id == station_id) {
				s3radio.current_radio = user_list[station_id];
				s3radio.current_radio.id = station_id;
				s3radio.create_player();
				s3radio.pref_save('current_radio', s3radio.current_radio);
			}
		});
	}
}
//------------------------------------------------------------------------------
s3radio.user_list_new_station_delete = function(event) {
	//------------------------------------------------------------------------
	if (document.getElementById('user_list_new_station_delete').hasAttribute('is_confirm')) {
		var station_id = document.getElementById('user_list_new_station_id').value;
		var user_list = s3radio.utils.prefs_get('user_list');
		//------------------------------------------------------------------
		if (station_id && user_list[station_id]) {
			delete user_list[station_id];
			//------------------------------------------------------------
			var favorites_list = s3radio.utils.prefs_get('favorites_list');
			if (favorites_list[station_id]) {
				delete favorites_list[station_id];
				s3radio.pref_save('favorites_list', favorites_list);
			}
			s3radio.pref_save('user_list', user_list, function(){
				s3radio.create_list_selector();
			});
		}
		s3radio.user_list_station_new_close();
		s3radio.create_player();
	}
	//------------------------------------------------------------------------
	else {
		document.getElementById('user_list_new_station_delete').setAttribute('is_confirm', true);
		s3radio.utils.HTMLDOM_value(document.getElementById('user_list_new_station_delete'), s3radio.utils.get_string('confirm_delete'));
	}
}
//------------------------------------------------------------------------------
s3radio.window_close = function() {
	setTimeout(function(){ 
		try {
			window.close(); 
		} catch(e) {};
	}, 5);
}
//------------------------------------------------------------------------------
s3radio.pref_save = function(pref_name, pref_value, callback) {
	chrome.runtime.sendMessage({ 'action_prefs_set': true, 'pref_name' : pref_name, 'pref_value': pref_value }, function(response) {
		if (callback) {
			callback();
		}
	});
	s3radio.utils.prefs_set(pref_name, pref_value);

	//------------------------------------------------------------------------
	if (pref_name == 'selected_country') {
		//------------------------------------------------------------------
		document.getElementById('radio_player_favorites').setAttribute("is_favorites", (pref_value == 'favorites') ? true : false);
		document.getElementById('radio_player_user_list').setAttribute("is_user_list", (pref_value == 'user_list') ? true : false);

		//------------------------------------------------------------------
		chrome.runtime.sendMessage({ 'action_prefs_set': true, 'pref_name' : 'search_open', 'pref_value': false }, function(response) {});
		s3radio.utils.prefs_set('search_open', false);
		document.getElementById('radio_search_box').setAttribute('is_hidden', true);
		document.getElementById('radio_player_search').setAttribute('is_search', false);

		//------------------------------------------------------------------
		chrome.runtime.sendMessage({ 'action_prefs_set': true, 'pref_name' : 'radio_list_show', 'pref_value': true }, function(response) {});
		s3radio.utils.prefs_set('radio_list_show', true);
		document.getElementById('radio_player_list').setAttribute('is_hidden', false);
		document.getElementById('radio_list_box').setAttribute('is_hidden', false);
		document.getElementById('radio_box_head').setAttribute('is_hidden', false);
		document.getElementById('radio_player_list').setAttribute('title', s3radio.utils.get_string('hide_list_radio_stations'));

		//------------------------------------------------------------------
		if ((pref_value != 'favorites') && (pref_value != 'user_list')) {
			chrome.runtime.sendMessage({ 'action_prefs_set': true, 'pref_name' : 'last_normal_selected_country', 'pref_value': pref_value }, function(response) {
				s3radio.utils.prefs_set('last_normal_selected_country', pref_value);
			});
		}
	}
	//------------------------------------------------------------------------
	else if (pref_name == 'search_open') {
		document.getElementById('radio_player_favorites').setAttribute("is_favorites", false);
		document.getElementById('radio_player_user_list').setAttribute("is_user_list", false);
		//------------------------------------------------------------------
		chrome.runtime.sendMessage({ 'action_prefs_set': true, 'pref_name' : 'radio_list_show', 'pref_value': true }, function(response) {});
		s3radio.utils.prefs_set('radio_list_show', true);
		document.getElementById('radio_player_list').setAttribute('is_hidden', false);
		document.getElementById('radio_list_box').setAttribute('is_hidden', false);
		document.getElementById('radio_box_head').setAttribute('is_hidden', false);
		document.getElementById('radio_player_list').setAttribute('title', s3radio.utils.get_string('hide_list_radio_stations'));
	}
}
//------------------------------------------------------------------------------
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		//------------------------------------------------------------------
		if (! request) { return; }

		//------------------------------------------------------------------
		if (request.action_started_radio) {
			s3radio.utils.prefs_set('started_radio', request.action_started_radio);
			s3radio.create_player();
		}
		//------------------------------------------------------------------
		else if (request.action_update_radio) {
			s3radio.prefs.list = request.prefs_list;
			s3radio.init();
		}
		//------------------------------------------------------------------
		else if (request.action_sleep_timer_process) {
			s3radio.utils.HTMLDOM_value(
				document.getElementById('radio_player_sleep_timer_tooltip'), 
				s3radio.utils.get_string('sleep_timer_tooltip', [ s3radio.utils.calculate_text_time(request.sleep_timer_value) ])
			);
		}
		//------------------------------------------------------------------
		else if (request.action_sleep_timer_finish) {
			s3radio.sleep_timer_enabled = false;
			document.getElementById('radio_player_sleep_timer').setAttribute('sleep_timer_enabled', s3radio.sleep_timer_enabled);
			var sleep_timer_value = s3radio.utils.prefs_get('sleep_timer_value');
			s3radio.utils.HTMLDOM_value(
				document.getElementById('radio_player_sleep_timer_tooltip'), 
				s3radio.utils.get_string('sleep_timer_tooltip', [ s3radio.utils.calculate_text_time(sleep_timer_value*60) ])
			);
		}
		//------------------------------------------------------------------
		sendResponse({ 'success' : false });
	}
);
//------------------------------------------------------------------------------
window.addEventListener("load", s3radio.init_0);
