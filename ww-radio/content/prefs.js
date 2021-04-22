s3radio.prefs = {};
s3radio.prefs.list = {};

//------------------------------------------------------------------------------
s3radio.prefs.init = function(callback) {
	chrome.storage.local.get(function(items) {
		s3radio.prefs.list = items;

		if (s3radio.i18n) {
			s3radio.i18n.init(items.current_locale);
		}

		s3radio.prefs.check_defaults();
		if (callback) {
			callback();
		}
	});
}
//------------------------------------------------------------------------------
s3radio.prefs.set = function(pref) {
	var pref_hash = {};
	pref_hash[pref.name] = pref.value;
	chrome.storage.local.set(pref_hash);
	s3radio.prefs.list[pref.name] = pref.value;
}
//------------------------------------------------------------------------------
s3radio.prefs.get = function(pref_name) {
	return s3radio.prefs.list[pref_name];
}
//------------------------------------------------------------------------------
s3radio.prefs.check_defaults = function() {
	var defaults = s3radio.utils.clone_object(s3radio.prefs.defaults);

	for (var pref_name in defaults) {
		if (s3radio.prefs.list[pref_name] === undefined) {
			s3radio.prefs.list[pref_name] = defaults[pref_name];
		}
		else if (typeof(s3radio.prefs.list[pref_name]) != typeof(defaults[pref_name])) {
			s3radio.prefs.list[pref_name] = defaults[pref_name];
		}
	}
}
//------------------------------------------------------------------------------
s3radio.prefs.reset_defaults = function(callback) {
	chrome.storage.local.clear(function() {
		s3radio.prefs.list = {};
		s3radio.prefs.check_defaults();
		if (s3radio.i18n) {
			s3radio.i18n.init();
		}
		if (callback) {
			callback();
		}
	});
}
//------------------------------------------------------------------------------
s3radio.prefs.defaults = {
	'current_version' : '0',
	'not_open_contribute_page' : false,
	'show_page_timer' : 0,

	'current_radio' : {},
	'prev_radio' : [],
	'next_radio' : [],
	'animated_icon' : true,
	'selected_country' : '',
	'last_normal_selected_country' : '',
	'started_radio' : 'pause', // pause , play, wait
	'volume_value' : 50,
	'volume_value_old' : 50,
	'favorites_list' : {},
	'user_list' : {},
	'search_open' : false,
	'search_text' : '',
	'search_country' : 'all',
	'radio_list_show' : true,
	'user_list_new_show' : false,
	'user_list_new_station_id' : '',
	'user_list_new_station_name' : '',
	'user_list_new_stream_url' : '',
	'user_list_new_website_url' : '',
	'user_list_new_last' : 'station_name',

	'shuffle_enabled' : false,
	'shuffle_timer' : 15, // in seconds
	'sleep_timer_enabled' : false,
	'sleep_timer_value' : 5, // in minutes

	'theme_name' : 'default',
	'theme_saturate' : 100,
	'theme_hue_rotate' : 0,
	'theme_brightness' : 100,
	'theme_contrast' : 100,

	'_end' : '_end'
};
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
s3radio.prefs.init();
