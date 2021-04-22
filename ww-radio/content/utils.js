s3radio.utils = {};

//------------------------------------------------------------------------------
s3radio.utils.console_log = function(msg) {
	console.log('%O', msg);
}
//------------------------------------------------------------------------------
s3radio.utils.prefs_get = function(pref_name) {
	return s3radio.prefs.get(pref_name);
}
//------------------------------------------------------------------------------
s3radio.utils.prefs_set = function(pref_name, pref_value) {
	s3radio.prefs.set({ 'name' : pref_name, 'value' : pref_value });
	return true;
}
//------------------------------------------------------------------------------
s3radio.utils.get_string = function(name, params) {
	var result = '';
	if (! params) { params = [] }

	try {
		result = s3radio.i18n.get_string(name, params);
	} catch(e) {
		result = name + e;
	}
	return result || name;
}
//------------------------------------------------------------------------------
s3radio.utils.get_country_name = function(country_id, is_original) {
	if (country_id == 'user_list') {
		return s3radio.utils.get_string('user_list_radio_stations');
	}
	else if (is_original) {
		if (s3radio.country_list && s3radio.country_list[country_id]) {
			return s3radio.country_list[country_id]
		} else {
			return country_id;
		}
	} else {
		return s3radio.utils.get_string('country_name_' + country_id);
	}
}
//------------------------------------------------------------------------------
s3radio.utils.clone_object = function(object) {
	return JSON.parse(JSON.stringify(object));
}
//------------------------------------------------------------------------------
s3radio.utils.get_element = function(parent, search_id) {
	if (parent == null) { return null; };

	for (var i=0; i<parent.childNodes.length; i++) {
		var el = parent.childNodes[i];
		if (el.id == search_id) {
			return el;
		}
		if (el.hasChildNodes()) {
			var res = s3radio.utils.get_element(el, search_id);
			if (res != null) {
				return res;
			}
		}
	}
	return null;
}
//------------------------------------------------------------------------------
s3radio.utils.HTMLDOM_value = function(html_element, value) {
	var tagName = html_element.tagName.toUpperCase();
	var is_input_tag = ((tagName == 'INPUT') || (tagName == 'TEXTAREA')) ? true : false;

	if (value === undefined) {
		return (is_input_tag) ? html_element.value : html_element.textContent;
	} else {
		if (is_input_tag) {
			html_element.value = value;
		} else {
			html_element.textContent = value;
		}
		return;
	}
}
//------------------------------------------------------------------------------
s3radio.utils.i18n_parse = function(doc) {
	s3radio.i18n.parse_html(doc);
}
//------------------------------------------------------------------------------
s3radio.utils.split_text = function(text, length) {
	if (! text) { text = ''; }
	if (! length) { length = 50; }

	var result = '';
	var check_break = 0;

	for (var i=0; i<text.length; i++) {
		var symbol = text.substr(i, 1);
		result += symbol;
		check_break++;
		if ((check_break > length) && (/\s/.test(symbol))) {
			result += "\n";
			check_break = 0;
		}
	}
	return result;
}
//-------------------------------------------------------------------------------------------
s3radio.utils.create_station_id = function(station, country) {
	if (country) {
		station.country = country;
	}
	station.id = station.country + '.' + station.image;
}
//-------------------------------------------------------------------------------------------
s3radio.utils.set_prev_radio = function(station) {
	var prev_radio = s3radio.utils.prefs_get('prev_radio');
	if (! station) {
		return prev_radio;
	}
	else if ((prev_radio.length > 0) && (prev_radio[prev_radio.length-1].id == station.id)) {
		return prev_radio;
	}
	else {
		prev_radio.push(s3radio.utils.clone_object(station));
		return prev_radio;
	}
}
//-------------------------------------------------------------------------------------------
s3radio.utils.set_next_radio = function(station) {
	var next_radio = s3radio.utils.prefs_get('next_radio');
	if (! station) {
		return next_radio;
	}
	else if ((next_radio.length > 0) && (next_radio[next_radio.length-1].id == station.id)) {
		return next_radio;
	}
	else {
		next_radio.push(s3radio.utils.clone_object(station));
		return next_radio;
	}
}
//-------------------------------------------------------------------------------------------
s3radio.utils.random_string = function(size) {
	var a = 'qwertyuiopasdfghjklzxcvbnm0123456789';
	var result = '';
	for (var i=0; i<size; i++) {
		result += a.substr(Math.floor(Math.random() * a.length), 1);
	}
	return result;
}
//-------------------------------------------------------------------------------------------
s3radio.utils.create_full_description = function(station) {
	var description = station.name + ' (' + s3radio.utils.get_country_name(station.country) + ')';
	var max_length = (description.length > 50) ? description.length : 50;

	if (station.site_url) {
		var site_url = station.site_url;
		if (site_url.length > max_length) {
			site_url = site_url.replace(/^(.{max_length}).+$/, "$1...");
		}
		description += "\n" + ("−". repeat(40)) + "\n" + site_url;
	}
	if (station.description) {
		description += "\n" + ("−". repeat(40)) + "\n" + s3radio.utils.split_text(station.description, max_length);
	}
	return description;
}
//-------------------------------------------------------------------------------------------
s3radio.utils.check_is_user_list = function(station_id, user_list) {
	if (user_list[station_id]) {
		return s3radio.utils.clone_object(user_list[station_id]);
	} else {
		return null;
	}
}
//-------------------------------------------------------------------------------------------
s3radio.utils.merge_user_list = function(stations_list, user_list) {
	stations_list = s3radio.utils.clone_object(stations_list);
	stations_list['user_list'] = [];
	//------------------------------------------------------------------------
	for (var user_list_id in user_list) {
		var user_station = user_list[user_list_id];
		stations_list['user_list'].push(s3radio.utils.clone_object(user_station));
	}
	//------------------------------------------------------------------------
	return stations_list;
}
//-------------------------------------------------------------------------------------------
s3radio.utils.calculate_text_time = function(seconds_time) {
	var hours = Math.floor(seconds_time / 60 / 60);
	var minutes = Math.floor((seconds_time - (hours * 60 * 60)) / 60);
	var seconds = seconds_time - (hours * 60 * 60) - (minutes * 60);

	if (hours < 10) { hours = '0' + hours; }
	if (minutes < 10) { minutes = '0' + minutes; }
	if (seconds < 10) { seconds = '0' + seconds; }

	return hours + ':' + minutes + ':' + seconds;
}
//------------------------------------------------------------------------------
s3radio.utils.get_theme_catalog = function() {
	var theme_name = s3radio.utils.prefs_get('theme_name') || 'default';
	if (theme_name == 'modern_flat') {
		return 'theme_modern_flat';
	} else {
		return 'theme_default';
	}
}
//------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------
s3radio.utils.check_isFirefox = function() {
	var text = window.navigator.userAgent;
	return (text.indexOf("Firefox") >=0) ? true : false;
}
//-------------------------------------------------------------------------------------------
