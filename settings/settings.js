define(['loading', './../skinsettings', 'focusManager', 'globalize'], function (loading, skinSettings, focusManager, globalize) {
    'use strict';

    return function (view, params) {

        var self = this;

        view.addEventListener('viewshow', function (e) {

            var isRestored = e.detail.isRestored;

            Emby.Page.setTitle(globalize.translate('SkinName'));

            loading.hide();

            if (!isRestored) {

                renderSettings();
            }
        });

        view.addEventListener('viewbeforehide', function (e) {

            skinSettings.enableAntiSpoliers(view.querySelector('.chkEnableEpisodeAntiSpoliers').checked);

            skinSettings.apply();
        });

        function renderSettings() {

            focusManager.autoFocus(view);

            view.querySelector('.chkEnableEpisodeAntiSpoliers').checked = skinSettings.enableAntiSpoliers();
        }
    };

});