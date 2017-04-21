define(['cardBuilder', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'homeSections', 'emby-itemscontainer', 'emby-scroller'], function (cardBuilder, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager, homeSections) {
    'use strict';

    function enableScrollX(section) {

        return !layoutManager.desktop;
    }

    function HomeTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.currentApiClient();
    }

    function initLayout(view) {

        var containers = view.querySelectorAll('.autoScrollSection');

        for (var i = 0, length = containers.length; i < length; i++) {

            var section = containers[i];

            var html;

            if (enableScrollX(section.getAttribute('data-section'))) {
                html = '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-framesize="matchgrandparent" data-centerfocus="card"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right"></div></div>';
            } else {
                html = '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x"></div>';
            }

            section.insertAdjacentHTML('beforeend', html);
        }
    }

    function getThumbShape(section) {
        return enableScrollX(section) ? 'overflowBackdrop' : 'backdrop';
    }

    function getRequirePromise(deps) {

        return new Promise(function (resolve, reject) {

            require(deps, resolve);
        });
    }

    HomeTab.prototype.onBeforeShow = function (options) {

        this.refreshOnShow = options.refresh;
    };

    HomeTab.prototype.onShow = function (options) {

        if (!this.refreshOnShow) {
            return;
        }

        var view = this.view;

        if (!this.initComplete) {
            this.initComplete = true;
            initLayout(view);
        }

        var apiClient = this.apiClient;

        var promises = [
            apiClient.getCurrentUser(),
            getRequirePromise(['userSettings'])
        ];

        Promise.all(promises).then(function (responses) {

            var user = responses[0];
            var userSettings = responses[1];

            homeSections.loadSections(view.querySelector('.sections'), apiClient, user, userSettings).then(function () {

                if (options.autoFocus) {
                    focusManager.autoFocus(view);
                }

                loading.hide();
            });
        });
    };

    HomeTab.prototype.onHide = function () {

    };

    HomeTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return HomeTab;
});