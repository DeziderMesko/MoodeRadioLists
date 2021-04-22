var s3radio = {};

//------------------------------------------------------------------------------
s3radio.init_0 = function() {
	s3radio.prefs.init(function(){
		setTimeout(function(){ s3radio.utils.i18n_parse(document); }, 100);
		//------------------------------------------------------------------------
		var current_locale = document.getElementById('current_locale');
		for (var i=0; i<s3radio.I18N_SUPPORTED.length; i++) {
			var el_lang = s3radio.I18N_SUPPORTED[i];
			var option = document.createElement("option");
			option.text = el_lang.name;
			option.value = el_lang.lang;
			option.setAttribute('title', el_lang.english);
			current_locale.options.add(option);
		}
		//------------------------------------------------------------------------
		current_locale.value = s3radio.utils.prefs_get('current_locale');
		//------------------------------------------------------------------------
		s3radio.init_events();
		setTimeout(function(){ s3radio.init(); }, 100);
	});
}
//------------------------------------------------------------------------------
s3radio.init_events = function() {
	//------------------------------------------------------------------------
	document.getElementById('current_locale').addEventListener("change", function() {
		var pref_value = this.value;
		s3radio.pref_save('current_locale', pref_value, function(){
			s3radio.i18n.init(pref_value);
			s3radio.utils.i18n_parse(document);
		});
	});
	//------------------------------------------------------------------------
	document.getElementById('settings_shuffle_timer').addEventListener("mousemove", function() {
		var shuffle_timer = s3radio.utils.prefs_get('shuffle_timer');
		if (shuffle_timer != this.value) {
			s3radio.pref_save('shuffle_timer', parseInt(this.value));
			s3radio.set_shuffle_timer_value();
		}
	});
	//------------------------------------------------------------------------
	document.getElementById('settings_shuffle_timer').addEventListener("change", function() {
		var shuffle_timer = s3radio.utils.prefs_get('shuffle_timer');
		if (shuffle_timer != this.value) {
			s3radio.pref_save('shuffle_timer', parseInt(this.value));
			s3radio.set_shuffle_timer_value();
		}
	});
	//------------------------------------------------------------------------
	document.getElementById('settings_sleep_timer').addEventListener("mousemove", function() {
		var sleep_timer = s3radio.utils.prefs_get('sleep_timer_value');
		if (sleep_timer != this.value) {
			s3radio.pref_save('sleep_timer_value', parseInt(this.value));
			s3radio.set_sleep_timer_value();
		}
	});
	//------------------------------------------------------------------------
	document.getElementById('settings_sleep_timer').addEventListener("change", function() {
		var sleep_timer = s3radio.utils.prefs_get('sleep_timer_value');
		if (sleep_timer != this.value) {
			s3radio.pref_save('sleep_timer_value', parseInt(this.value));
			s3radio.set_sleep_timer_value();
		}
	});
	//------------------------------------------------------------------------
	document.getElementById('theme_name_default').addEventListener("click", function() {
		s3radio.pref_save('theme_name', 'default', function(){ s3radio.set_theme_name(); });
	});
	document.getElementById('theme_name_modern_flat').addEventListener("click", function() {
		s3radio.pref_save('theme_name', 'modern_flat', function(){ s3radio.set_theme_name(); });
	});
	s3radio.set_theme_name();
	//------------------------------------------------------------------------
	var theme_pref_list = ['theme_saturate', 'theme_hue_rotate', 'theme_brightness', 'theme_contrast'];
	function theme_pref_save(theme_pref_name) {
		document.getElementById('settings_' + theme_pref_name).addEventListener("mousemove", function() {
			var theme_pref = s3radio.utils.prefs_get(theme_pref_name);
			if (theme_pref != this.value) {
				s3radio.pref_save(theme_pref_name, parseInt(this.value));
				s3radio.set_theme_color();
			}
		});
		//------------------------------------------------------------------
		document.getElementById('settings_' + theme_pref_name).addEventListener("change", function() {
			var theme_pref = s3radio.utils.prefs_get(theme_pref_name);
			if (theme_pref != this.value) {
				s3radio.pref_save(theme_pref_name, parseInt(this.value));
				s3radio.set_theme_color();
			}
		});
	}
	//------------------------------------------------------------------------
	for (var i=0; i<theme_pref_list.length; i++) {
		var theme_pref_name = theme_pref_list[i];
		theme_pref_save(theme_pref_name);
	}
	//------------------------------------------------------------------------
	document.getElementById('settings_theme_reset').addEventListener('click', function(){
		s3radio.pref_save('theme_saturate', 100);
		s3radio.pref_save('theme_hue_rotate', 0);
		s3radio.pref_save('theme_brightness', 100);
		s3radio.pref_save('theme_contrast', 100);

		document.getElementById('settings_theme_saturate').value = 100;
		document.getElementById('settings_theme_hue_rotate').value = 0;
		document.getElementById('settings_theme_brightness').value = 100;
		document.getElementById('settings_theme_contrast').value = 100;

		s3radio.set_theme_color();
	});

	//------------------------------------------------------------------------
	//------------------------------------------------------------------------
	document.getElementById('animated_icon').addEventListener("click", function() {
		var animated_icon = ! s3radio.utils.prefs_get('animated_icon');
		s3radio.pref_save('animated_icon', animated_icon);
		document.getElementById('animated_icon').checked = animated_icon;
	});
	document.getElementById('animated_icon').checked = s3radio.utils.prefs_get('animated_icon');
	//------------------------------------------------------------------------
	document.getElementById('settings_save_button').addEventListener('click', function(){ s3radio.settings_save(); });
	document.getElementById('settings_load_button').addEventListener('click', function(){ s3radio.settings_load(); });
	document.getElementById('settings_reset_button').addEventListener('click', function(){ s3radio.settings_reset(); });
	document.getElementById('settings_load_file').addEventListener('change', function(event){ s3radio.settings_load_file(event); });

	//------------------------------------------------------------------------
	s3radio.init();
}
//------------------------------------------------------------------------------
s3radio.init = function() {
	document.getElementById('settings_shuffle_timer').value = s3radio.utils.prefs_get('shuffle_timer');
	s3radio.set_shuffle_timer_value();

	document.getElementById('settings_sleep_timer').value = s3radio.utils.prefs_get('sleep_timer_value');
	s3radio.set_sleep_timer_value();

	document.getElementById('settings_theme_saturate').value = s3radio.utils.prefs_get('theme_saturate');
	document.getElementById('settings_theme_hue_rotate').value = s3radio.utils.prefs_get('theme_hue_rotate');
	document.getElementById('settings_theme_brightness').value = s3radio.utils.prefs_get('theme_brightness');
	document.getElementById('settings_theme_contrast').value = s3radio.utils.prefs_get('theme_contrast');
	s3radio.set_theme_color();

	var manifest = chrome.runtime.getManifest();
	document.getElementById('addon_version').textContent = manifest.version;
}
//------------------------------------------------------------------------------
s3radio.set_shuffle_timer_value = function() {
	var shuffle_timer = document.getElementById('settings_shuffle_timer').value;
	var settings_shuffle_timer_value = s3radio.utils.calculate_text_time(shuffle_timer);
	s3radio.utils.HTMLDOM_value(document.getElementById('settings_shuffle_timer_value'), settings_shuffle_timer_value);
}
//------------------------------------------------------------------------------
s3radio.set_sleep_timer_value = function() {
	var sleep_timer = document.getElementById('settings_sleep_timer').value;
	var settings_sleep_timer_value = s3radio.utils.calculate_text_time(sleep_timer*60);
	s3radio.utils.HTMLDOM_value(document.getElementById('settings_sleep_timer_value'), settings_sleep_timer_value);
}
//------------------------------------------------------------------------------
s3radio.set_theme_name = function() {
	var theme_name = s3radio.utils.prefs_get('theme_name') || 'default';
	if (theme_name == 'modern_flat') {
		document.getElementById('theme_name_modern_flat').checked = true;
//		document.getElementById('settings_theme_value').style.backgroundColor = '#FFB300';
		document.getElementById('settings_theme_value').style.backgroundImage = 'url("/skin/theme_modern_flat.png")';
	} else {
		document.getElementById('theme_name_default').checked = true;
//		document.getElementById('settings_theme_value').style.backgroundColor = '#91C8EF';
		document.getElementById('settings_theme_value').style.backgroundImage = 'url("/skin/theme_default.png")';
	}
}
//------------------------------------------------------------------------------
s3radio.set_theme_color = function() {
	var theme_saturate = document.getElementById('settings_theme_saturate').value;
	var theme_hue_rotate = document.getElementById('settings_theme_hue_rotate').value;
	var theme_brightness = document.getElementById('settings_theme_brightness').value;
	var theme_contrast = document.getElementById('settings_theme_contrast').value;

	s3radio.utils.HTMLDOM_value(document.getElementById('settings_theme_saturate_value'), theme_saturate);
	s3radio.utils.HTMLDOM_value(document.getElementById('settings_theme_hue_rotate_value'), theme_hue_rotate);
	s3radio.utils.HTMLDOM_value(document.getElementById('settings_theme_brightness_value'), theme_brightness);
	s3radio.utils.HTMLDOM_value(document.getElementById('settings_theme_contrast_value'), theme_contrast);
	document.getElementById('settings_theme_value').style.filter = 'saturate(' + theme_saturate + '%) hue-rotate(' + theme_hue_rotate + 'deg)  brightness(' + theme_brightness + '%) contrast(' + theme_contrast + '%)';
}
//-------------------------------------------------------------------------------------------
s3radio.settings_save = function() {
	chrome.permissions.request({
		permissions: [ 'downloads' ]
	}, function(granted) {
		if (chrome.runtime.lastError) {}
		if (granted) {
			chrome.runtime.sendMessage({ 'settings_save': true }, function(response) {});
		}
	});
}
//-------------------------------------------------------------------------------------------
s3radio.settings_load = function() {
	document.getElementById('settings_load_file').click();
}
//-------------------------------------------------------------------------------------------
s3radio.settings_load_file = function(event) {
	var file = event.target.files[0];
	var reader = new FileReader();
	//----------------------------------------------------------------------
	reader.onload = function(e) {
		s3radio.settings_load_file_done(e.target.result || '');
	}
	reader.readAsText(file);
}
//------------------------------------------------------------------------------
s3radio.settings_reset = function() {
	if (confirm(s3radio.utils.get_string('confirm_warning'))) {
		chrome.runtime.sendMessage({ 'action_reset_defaults': true }, function(response) {
			s3radio.prefs.reset_defaults(function(){
				s3radio.utils.i18n_parse(document);
				s3radio.init();
				s3radio.save_settings_message();
				alert(s3radio.utils.get_string('settings_restored'));
				window.location.reload();
			});
		});
	}
}
//-------------------------------------------------------------------------------------------
s3radio.settings_load_file_done = function(result_txt) {
 	//-----------------------------------------------------------------------
	var prefs_list = result_txt.split("\n");
	var pref_branch = s3radio.utils.clone_object(s3radio.prefs.list);
	var prefs_new = {};
	//-----------------------------------------------------------------------
	for (var i=0; i<prefs_list.length; i++) {
		try {
			var pref = prefs_list[i].replace(/[\n\r]/g, '');
			var p = pref.match(/^(.*?)\=(.*)/);
			var pref_name = p[1] || '---';
			var pref_value = p[2];
			if (pref_name in pref_branch) {
				if (typeof(pref_branch[pref_name]) == 'boolean') {
					pref_value = (String(pref_value) == 'true');
				} else if (typeof(pref_branch[pref_name]) == 'number') {
					pref_value = parseInt(pref_value);
				} else if (typeof(pref_branch[pref_name]) == 'object') {
					pref_value = JSON.parse(pref_value);
				} else if (typeof(pref_branch[pref_name]) == 'array') {
					pref_value = JSON.parse(pref_value);
				} else {
					pref_value = String(pref_value);
				}
				s3radio.utils.prefs_set(pref_name, pref_value);
				prefs_new[pref_name] = pref_value;
			}
		} catch(e) {
		}
	}
	//-----------------------------------------------------------------------
	chrome.runtime.sendMessage({ 'action_prefs_reload': true, 'prefs_new' : prefs_new }, function(response) {
		alert(s3radio.utils.get_string('settings_saved'));
		window.location.reload();
	});
}
//------------------------------------------------------------------------------
s3radio.pref_save = function(pref_name, pref_value, callback) {
	chrome.runtime.sendMessage({ 'action_prefs_set': true, 'pref_name' : pref_name, 'pref_value': pref_value }, function(response) {
		s3radio.utils.prefs_set(pref_name, pref_value);
		if (callback) {
			callback(pref_name, pref_value);
		}
		s3radio.save_settings_message();
	});
}
//------------------------------------------------------------------------------
s3radio.save_settings_message = function() {
	document.getElementById("settings_saved").removeAttribute('is_hidden');
	document.getElementById('current_locale').setAttribute('is_hidden', true);
	setTimeout(function(){
		document.getElementById("settings_saved").setAttribute('is_hidden', true);
		document.getElementById("current_locale").removeAttribute('is_hidden');
	}, 500);
}
//------------------------------------------------------------------------------
window.addEventListener("load", s3radio.init_0);
