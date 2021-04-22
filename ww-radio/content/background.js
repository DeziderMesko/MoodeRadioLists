//------------------------------------------------------------------------------
// https://github.com/dailymotion/hls.js
// https://video-dev.github.io/hls.js/latest/
// https://video-dev.github.io/hls.js/latest/docs/API.html
// https://developer.mozilla.org/en-US/docs/Web/Apps/Fundamentals/Audio_and_video_delivery/Live_streaming_web_audio_and_video#HLS
//------------------------------------------------------------------------------

var s3radio = {};
s3radio.browserAction_interval = null;
s3radio.browserAction_frame = 0;
s3radio.audio = null;
s3radio.audio_hls = null;
s3radio.audio_timeout = null;
s3radio.shuffle_timeout = null;
s3radio.sleep_timer_timeout = null;
s3radio.current_radio = {};
s3radio.audio_status = 'pause';
s3radio.current_station_list = [];
s3radio.current_radio_src = '';

s3radio.audio_timeupdate_time = 0;

//------------------------------------------------------------------------------
s3radio.init = function() {
	s3radio.prefs.init(function(){
		s3radio.utils.prefs_set('started_radio', 'pause');
		s3radio.utils.prefs_set('prev_radio', []);
		s3radio.utils.prefs_set('next_radio', []);
		s3radio.utils.prefs_set('sleep_timer_enabled', false);
		try { chrome.browserAction.setIcon({ 'path' : '/skin/' + s3radio.utils.get_theme_catalog() + '/logo24.png' }); } catch(e) {};
		s3radio.init_audio();
	});
}
//------------------------------------------------------------------------------
s3radio.init_audio = function() {
	s3radio.audio = new Audio();
	s3radio.audio.preload = 'none';
	s3radio.audio.volume = s3radio.utils.prefs_get('volume_value') / 100;
	//------------------------------------------------------------------------
	if (Hls.isSupported()) {
		s3radio.init_audio_hls();
	}
	//------------------------------------------------------------------------
	s3radio.init_audio_native();
}
//------------------------------------------------------------------------------
s3radio.init_audio_hls = function() {
	s3radio.audio_hls = new Hls();
	//------------------------------------------------------------------------
	s3radio.audio_hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
		var play_promise = s3radio.audio.play();
		play_promise.then(function() {
			s3radio.set_started_radio('play');
		}).catch(function(error) {
			if (s3radio.audio_hls.is_play) {
				s3radio.set_started_radio('error');
				s3radio.audio_pause_source();
			}
		});
	});
	//------------------------------------------------------------------------
	s3radio.audio_hls.on(Hls.Events.ERROR, function (event, data) {
		var error_type = data.type;
		var error_details = data.details;
		if (data.fatal) {
			if ((data.type == Hls.ErrorTypes.OTHER_ERROR) && (data.details == Hls.ErrorDetails.INTERNAL_EXCEPTION)) {
				//-----------------------------------------------------
				if (s3radio.utils.check_isFirefox() && (s3radio.current_radio_src == s3radio.current_radio.radio_url)) {
					var radio_id = s3radio.current_radio.id;
					var csp_url = chrome.extension.getURL('/content/csp.html?' + radio_id);
					chrome.tabs.query({ 'url' : csp_url }, function(tabs){
						if (tabs && tabs[0]) {
							chrome.tabs.update(tabs[0].id, { 'active' : true }, function(tab){});
							chrome.tabs.reload(tabs[0].id);
						}
						//------------------------------------------------------------------
						else {
							chrome.tabs.create({ 'url' : '/content/csp.html?' + radio_id, active: true }, function(tab) { if (chrome.runtime.lastError) {} }); 
						}
					});
				}
			}
		}
		//------------------------------------------------------------------
		if (s3radio.audio_hls.is_play) {
			s3radio.set_started_radio('error');
			s3radio.audio_clear_timeout();
		}
	});
}
//------------------------------------------------------------------------------
s3radio.init_audio_native = function() {
	//------------------------------------------------------------------------
//	s3radio.audio.addEventListener("canplaythrough", function(){
	s3radio.audio.addEventListener("canplay", function(){
		var play_promise = s3radio.audio.play();
		play_promise.then(function() {
			s3radio.set_started_radio('play');
		}).catch(function(error) {
			s3radio.set_started_radio('error');
			s3radio.audio_pause_source();
		});
	});
	//------------------------------------------------------------------------
	s3radio.audio.addEventListener("waiting", function(){
		s3radio.set_started_radio('wait');
	});
	//------------------------------------------------------------------------
	s3radio.audio.addEventListener("timeupdate", function(){
		s3radio.audio_timeupdate_time = (new Date()).getTime();
		if (s3radio.audio_status == 'wait') {
			s3radio.audio_status = 'wait_pre';
		} else if (s3radio.audio_status == 'wait_pre') {
			s3radio.set_started_radio('play');
		}
	});
	//------------------------------------------------------------------------
	s3radio.audio.addEventListener("ended", function(){
		s3radio.set_started_radio('error');
		s3radio.audio_clear_timeout();
		if (! /data\:audio\/wav/.test(s3radio.audio.src)) {
			s3radio.audio_timeout = setTimeout(function(){
				s3radio.set_started_radio('wait');
				s3radio.audio.load();
			}, 1000);
		}
	});
	//------------------------------------------------------------------------
	s3radio.audio.addEventListener("error", function(){
		s3radio.set_started_radio('error');
		s3radio.audio_clear_timeout();
//		s3radio.audio_timeout = setTimeout(function(){
//			s3radio.audio.load();
//		}, 1000);
	});
	//------------------------------------------------------------------------
	s3radio.audio.addEventListener("pause", function(){
		s3radio.set_started_radio('error');
		s3radio.audio_clear_timeout();
	});

	//------------------------------------------------------------------------
	setInterval(function(){
		var current_time = (new Date()).getTime();
		if ((s3radio.audio_status == 'play') && (current_time > (s3radio.audio_timeupdate_time+1000))) {
			s3radio.set_started_radio('wait');
		}
	}, 1000);
}
//------------------------------------------------------------------------------
s3radio.audio_load_source = function(src) {
	s3radio.audio_pause_source(true);

	if (s3radio.audio_hls && /^https?\:\/\/[^\?]+\.m3u8/.test(src)) {
		s3radio.audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=';
		s3radio.audio_hls.prepare_req = new XMLHttpRequest();
		s3radio.audio_hls.prepare_req.timeout = 5000;
		s3radio.audio_hls.prepare_req.onreadystatechange = function () {
			if (s3radio.audio_hls.prepare_req && (s3radio.audio_hls.prepare_req.readyState == 3)) {
				if (/^\#EXTM3U/.test(s3radio.audio_hls.prepare_req.responseText)) {
					s3radio.audio_hls.is_play = true;
					s3radio.audio_hls.attachMedia(s3radio.audio);
					s3radio.audio_hls.loadSource(src);
				} else {
					s3radio.audio_hls.is_play = false;
					s3radio.audio.src = src;
					s3radio.audio.load();
				}
				s3radio.audio_hls.prepare_req.abort();
			}
			else if (s3radio.audio_hls.prepare_req && (s3radio.audio_hls.prepare_req.readyState == 4)) {
				if (! s3radio.audio_hls.is_play) {
					if (s3radio.audio.src != src) {
						s3radio.set_started_radio('error');
						s3radio.audio_clear_timeout();
					}
				}
			}
		};
		s3radio.audio_hls.prepare_req.open("GET", src, true);
		s3radio.audio_hls.prepare_req.send(null);
	} else {
		s3radio.audio.src = src;
		s3radio.audio.load();
	}
}
//------------------------------------------------------------------------------
s3radio.audio_pause_source = function(not_pause) {
	if (s3radio.audio_hls) {
		s3radio.audio_hls.is_play = false;
		if (s3radio.audio_hls.prepare_req) {
			try {
				s3radio.audio_hls.prepare_req.abort();
			} catch(e) {};
		}
		s3radio.audio_hls.stopLoad();
		s3radio.audio_hls.detachMedia();
	}
	if (! not_pause) {
		s3radio.audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=';
		s3radio.audio.pause();
	}
}
//------------------------------------------------------------------------------
s3radio.audio_clear_timeout = function() {
	try {
		if (s3radio.audio_timeout) {
			clearTimeout(s3radio.audio_timeout);
		}
	} catch(e) {
	}
}
//------------------------------------------------------------------------------
s3radio.shuffle_clear_timeout = function() {
	try {
		if (s3radio.shuffle_timeout) {
			clearTimeout(s3radio.shuffle_timeout);
		}
	} catch(e) {
	}
}
//------------------------------------------------------------------------------
s3radio.sleep_timer_clear_timeout = function() {
	try {
		if (s3radio.sleep_timer_timeout) {
			clearInterval(s3radio.sleep_timer_timeout);
		}
	} catch(e) {
	}
}
//------------------------------------------------------------------------------
s3radio.sleep_timer_process = function() {
	s3radio.sleep_timer_value -= 1;
	if (s3radio.sleep_timer_value < 10) {
		var volume_value = s3radio.utils.prefs_get('volume_value');
		var audio_volume = volume_value / 100;
		s3radio.audio.volume = (audio_volume * (s3radio.sleep_timer_value * 10)) / 100;
	}
	if (s3radio.sleep_timer_value <= 0) {
		s3radio.sleep_timer_finish();
	} else {
		chrome.runtime.sendMessage({ 'action_sleep_timer_process' : true, 'sleep_timer_value' : s3radio.sleep_timer_value }, function(response) { if (chrome.runtime.lastError) {} });
	}
}
//------------------------------------------------------------------------------
s3radio.sleep_timer_finish = function() {
	s3radio.set_started_radio('pause');
	s3radio.current_radio_src = '';
	s3radio.audio_pause_source();

	s3radio.sleep_timer_clear_timeout();

	var volume_value = s3radio.utils.prefs_get('volume_value');
	s3radio.audio.volume = volume_value / 100;

	s3radio.utils.prefs_set('sleep_timer_enabled', false);

	chrome.runtime.sendMessage({ 'action_sleep_timer_finish' :true }, function(response) { if (chrome.runtime.lastError) {} });
}
//------------------------------------------------------------------------------
s3radio.set_started_radio = function(started_radio) {
	s3radio.shuffle_clear_timeout();
	//------------------------------------------------------------------------
	if (started_radio == 'play') {
		if (s3radio.utils.prefs_get('shuffle_enabled')) {
			var shuffle_timer = s3radio.utils.prefs_get('shuffle_timer');
			if (shuffle_timer < 5) { shuffle_timer = 5; }
			s3radio.shuffle_timeout = setTimeout(s3radio.set_shuffle_radio, shuffle_timer*1000);
		}
	}
	//------------------------------------------------------------------------
	else if (started_radio == 'error') {
		if (/data\:audio\/wav/.test(s3radio.audio.src)) {
			started_radio = 'pause';
		}
		else if (s3radio.utils.prefs_get('shuffle_enabled')) {
			s3radio.set_shuffle_radio();
			return;
		} else {
			started_radio = 'pause';
		}
	}


	//------------------------------------------------------------------------
	s3radio.audio_status = started_radio;
	s3radio.utils.prefs_set('started_radio', started_radio);
	s3radio.browserAction(started_radio);
	chrome.runtime.sendMessage({ 'action_started_radio' : started_radio }, function(response) { if (chrome.runtime.lastError) {} });
}
//------------------------------------------------------------------------------
s3radio.set_shuffle_radio = function() {
	if (s3radio.current_station_list.length > 1) {
		var current_id = Math.floor(Math.random() * s3radio.current_station_list.length);
		s3radio.utils.prefs_set('prev_radio', s3radio.utils.set_prev_radio(s3radio.current_radio));
		s3radio.utils.prefs_set('next_radio', []);
		s3radio.current_radio_src = '';
	
		s3radio.current_radio = s3radio.current_station_list[current_id];
		s3radio.current_radio.radio_name = s3radio.current_radio.name + ' (' + s3radio.utils.get_country_name(s3radio.current_radio.country) + ')';
	
		s3radio.set_started_radio('wait');
		s3radio.audio_clear_timeout();
		s3radio.audio_load_source(s3radio.current_radio.radio_url);
	
		s3radio.utils.prefs_set('current_radio', s3radio.current_radio);
		chrome.runtime.sendMessage({ 'action_update_radio' : true, 'prefs_list' : s3radio.prefs.list }, function(response) { if (chrome.runtime.lastError) {} });
	} else {
		s3radio.set_started_radio('pause');
	}
}
//------------------------------------------------------------------------------
s3radio.browserAction = function(started_radio) {
	//------------------------------------------------------------------------
	if ((started_radio == 'play') || (started_radio == 'wait')) {
		s3radio.browserAction_frame = 0;
		try {
			clearInterval(s3radio.browserAction_interval);
		} catch(e) {
		}
		//-----------------------------------------------------------------
		if (s3radio.utils.prefs_get('animated_icon')) {
			var folder = (started_radio == 'play') ? 'equalizer' : 'progress';
			var frame_max = (started_radio == 'play') ? 26 : 17;
			var frame_start = (started_radio == 'play') ? 5 : 0;
			var interval_time = (started_radio == 'play') ? 100 : 80;
			//-----------------------------------------------------------
			s3radio.browserAction_interval = setInterval(function(){
				try {
					chrome.browserAction.setIcon({ 'path' : '/skin/' + s3radio.utils.get_theme_catalog() + '/' + folder + '/' + s3radio.browserAction_frame + '.png' }); 
				} catch(e) {
					clearInterval(s3radio.browserAction_interval);
				};
				s3radio.browserAction_frame++;
				if (s3radio.browserAction_frame > frame_max) {
					s3radio.browserAction_frame = frame_start;
				}
			}, interval_time);
		}
		//-----------------------------------------------------------------
		else {
			if (started_radio == 'play') { 
				try { chrome.browserAction.setIcon({ 'path' : '/skin/' + s3radio.utils.get_theme_catalog() + '/logo24_play.png' }); } catch(e) {};
			} else {
				try { chrome.browserAction.setIcon({ 'path' : '/skin/' + s3radio.utils.get_theme_catalog() + '/logo24_wait.png' }); } catch(e) {};
			}
		}
		//-----------------------------------------------------------------
		try { chrome.browserAction.setTitle({ 'title' : s3radio.current_radio.radio_name }); } catch(e) {};
	}
	//------------------------------------------------------------------------
	else {
		try {
			clearInterval(s3radio.browserAction_interval);
		} catch(e) {
		}
		try { chrome.browserAction.setIcon({ 'path' : '/skin/' + s3radio.utils.get_theme_catalog() + '/logo24.png' }); } catch(e) {};
		try { chrome.browserAction.setTitle({ 'title' : s3radio.utils.get_string('extension_name') }); } catch(e) {};
	}
}
//------------------------------------------------------------------------------
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) { return s3radio.onMessage(request, sender, sendResponse); });
//------------------------------------------------------------------------------
s3radio.onMessage = function(request, sender, sendResponse) {
	//------------------------------------------------------------------------
	if (! request) { return; }
	//------------------------------------------------------------------------
	if (request.action_prefs_set && request.pref_name) {
		//------------------------------------------------------------------
		if (request.pref_name == 'current_locale') {
			s3radio.i18n.init(request.pref_value);
		}
		//------------------------------------------------------------------
		else if (request.pref_name == 'volume_value') {
			s3radio.audio.volume = request.pref_value / 100;
		}
		//------------------------------------------------------------------
		else if (request.pref_name == 'shuffle_timer') {
			if (s3radio.utils.prefs_get('shuffle_enabled') && (s3radio.audio_status == 'play')) {
				s3radio.shuffle_clear_timeout();
				s3radio.shuffle_timeout = setTimeout(s3radio.set_shuffle_radio, request.pref_value*1000);
			}
		}
		//------------------------------------------------------------------
		else if (request.pref_name == 'sleep_timer_value') {
			if (s3radio.utils.prefs_get('sleep_timer_enabled')) {
				s3radio.sleep_timer_clear_timeout();
				s3radio.sleep_timer_value = request.pref_value * 60;
				s3radio.sleep_timer_timeout = setInterval(s3radio.sleep_timer_process, 1000);
			}
		}
		//------------------------------------------------------------------
		s3radio.utils.prefs_set(request.pref_name, request.pref_value);
		//------------------------------------------------------------------
		if (request.pref_name == 'animated_icon') {
			s3radio.browserAction(s3radio.audio_status);
		}
		//------------------------------------------------------------------
		else if (request.pref_name == 'theme_name') {
			s3radio.browserAction(s3radio.audio_status);
		}
		//------------------------------------------------------------------
		sendResponse({ 'success' : true });
	}
	//------------------------------------------------------------------------
	else if (request.action_prefs_get) {
		sendResponse({ 'prefs_list' : s3radio.prefs.list });
	}
	//------------------------------------------------------------------------
	else if (request.action_prefs_reload) {
		if (request.prefs_new) {
			for (var pref_name in request.prefs_new) {
				s3radio.utils.prefs_set(pref_name, request.prefs_new[pref_name]);
			}
		}
		s3radio.utils.prefs_set('user_list_new_show', false);
		s3radio.audio.pause();
		s3radio.audio.src = "";
		s3radio.init();
		sendResponse({ 'success' : true });
	}
	//------------------------------------------------------------------------
	else if (s3radio.action_reset_defaults) {
		s3radio.prefs.reset_defaults(function(){
			s3radio.i18n.init();
			s3radio.audio.pause();
			s3radio.audio.src = "";
			s3radio.init();
		});
		sendResponse({ 'success' : true });
	}
	//------------------------------------------------------------------------
	else if (request.settings_save) {
		var result = [];
		//------------------------------------------------------------------
		var prefs_list = s3radio.utils.clone_object(s3radio.prefs.list);
		var exclude_prefs = {
			'current_version' : 1, 'not_open_contribute_page' : 1, 'show_page_timer' : 1, 
			'next_radio' : 1, 'prev_radio' : 1,
			'search_country' : 1, 'search_open' : 1, 'search_text' : 1,
			'shuffle_enabled' : 1, 'sleep_timer_enabled' : 1, 'started_radio' : 1,
			'user_list_new_last' : 1, 'user_list_new_show' : 1, 'user_list_new_station_id' : 1,
			'user_list_new_station_name' : 1, 'user_list_new_stream_url' : 1, 'user_list_new_website_url' : 1,
			'_end' : 1
		};

		//------------------------------------------------------------------
		for (var pref_name in prefs_list) {
			if (exclude_prefs[pref_name]) { continue; }
		 	//------------------------------------------------------------
			if (typeof(prefs_list[pref_name]) == 'object') {
				result.push(pref_name + '='  + JSON.stringify(prefs_list[pref_name]));
			} else if (typeof(prefs_list[pref_name]) == 'array') {
				result.push(pref_name + '='  + JSON.stringify(prefs_list[pref_name]));
			} else {
				result.push(pref_name + '='  + prefs_list[pref_name]);
			}
		}
	 	//-------------------------------------------------------------------
		var result_txt = result.join("\n") + "\n";
	 	//-------------------------------------------------------------------
		var blob1 = new Blob([result_txt], { type: "text/plain" });
		var result_url = URL.createObjectURL(blob1);
		var date = new Date();
		var dd = date.getDate(); if (dd < 10) { dd = '0' + dd; }
		var mm = date.getMonth() + 1; if (mm < 10) { mm = '0' + mm; }
		var hh = date.getHours(); if (hh < 10) { hh = '0' + hh; }
		var mn = date.getMinutes(); if (mn < 10) { mn = '0' + mn; }
		var ss = date.getSeconds(); if (ss < 10) { ss = '0' + ss; }

		var filename = 'WorldwideRadio.' + date.getFullYear() + '.' + mm + '.'  + dd + '.'  + hh + '.'  + mn + '.'  + ss + '.txt';
	
		chrome.downloads.download({
			url: result_url,
			filename: filename,
			saveAs: true
		}, function (downloadId) {});
		sendResponse({ 'success' : true });
	}
	//------------------------------------------------------------------------
	else if (request.action_radio_play) {
		//------------------------------------------------------------------
		s3radio.current_radio = request.current_radio;
		s3radio.current_radio.radio_name = request.radio_name;
		s3radio.set_started_radio(request.started_radio);

		//------------------------------------------------------------------
		if (request.started_radio == 'wait') {
			s3radio.audio_clear_timeout();
			s3radio.current_radio_src = request.current_radio.radio_url;
			s3radio.audio_load_source(request.current_radio.radio_url);
		} else {
			s3radio.current_radio_src = '';
			s3radio.audio_pause_source();
		}

		//------------------------------------------------------------------
		sendResponse({ 'success' : true });
	}
	//------------------------------------------------------------------------
	else if (request.action_set_station_list) {
		s3radio.current_station_list = request.station_list;
		sendResponse({ 'success' : true });
	}
	//------------------------------------------------------------------------
	else if (request.action_shuffle_enabled) {
		if (request.station_list) {
			s3radio.current_station_list = request.station_list;
		}

		//------------------------------------------------------------------
		s3radio.utils.prefs_set('shuffle_enabled', request.is_enabled);
		s3radio.set_started_radio(s3radio.audio_status);
		sendResponse({ 'success' : true });
	}
	//------------------------------------------------------------------------
	else if (request.action_sleep_timer_enabled) {
		s3radio.utils.prefs_set('sleep_timer_enabled', request.is_enabled);
		s3radio.sleep_timer_clear_timeout();
		if (request.is_enabled) {
			s3radio.sleep_timer_value = s3radio.utils.prefs_get('sleep_timer_value');
			s3radio.sleep_timer_value = s3radio.sleep_timer_value * 60;
			s3radio.sleep_timer_timeout = setInterval(s3radio.sleep_timer_process, 1000);
		} else {
			var volume_value = s3radio.utils.prefs_get('volume_value');
			s3radio.audio.volume = volume_value / 100;
			chrome.runtime.sendMessage({ 'action_sleep_timer_finish' :true }, function(response) { if (chrome.runtime.lastError) {} });
		}
		sendResponse({ 'success' : true });
	}
	//------------------------------------------------------------------------
}
//------------------------------------------------------------------------------
chrome.webRequest.onBeforeSendHeaders.addListener(function(info) {
	//-----------------------------------------------------------------------
	// hide special headers about the fact that the request is made from addon
	//-----------------------------------------------------------------------
	if (s3radio.current_radio.radio_url == info.url) {
		//-----------------------------------------------------------------
		var headers = info.requestHeaders;
		var header = null;
		var new_headers = [];
		//-----------------------------------------------------------------
		while (header = headers.shift()) {
			if (/^X\-/.test(header.name)) {
			}
			else if (/DNT/.test(header.name)) {
			}
			else if (/Origin/.test(header.name)) {
			}
			else {
				new_headers.push(header);
			}
		}
		return { requestHeaders: new_headers };
	}
},
	{urls: ["http://*/*", "https://*/*"]},
	["blocking", "requestHeaders"]
);
//------------------------------------------------------------------------------
setTimeout(s3radio.init, 500);
