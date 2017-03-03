define(['cardBuilder', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'emby-itemscontainer', 'emby-scroller'], function (cardBuilder, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager) {
    'use strict';

    function enableScrollX() {
        return !layoutManager.desktop;
    }

    function MovieSuggestionsTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function initLayout(view) {

        var containers = view.querySelectorAll('.autoScrollSection');

        for (var i = 0, length = containers.length; i < length; i++) {

            var section = containers[i];

            var html;

            if (enableScrollX()) {
                html = '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-framesize="matchgrandparent" data-centerfocus="card"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right"></div></div>';
            } else {
                html = '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap"></div>';
            }

            section.insertAdjacentHTML('beforeend', html);
        }
    }

    function getThumbShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function getPortraitShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function renderResume(view, items) {

        var section = view.querySelector('.resumeSection');
        var container = section.querySelector('.itemsContainer');
        var supportsImageAnalysis = appHost.supports('imageanalysis');
        var cardLayout = supportsImageAnalysis;

        var allowBottomPadding = !enableScrollX();

        cardBuilder.buildCards(items, {
            parentContainer: section,
            itemsContainer: container,
            preferThumb: true,
            shape: getThumbShape(),
            scalable: true,
            showTitle: true,
            showYear: true,
            overlayText: false,
            centerText: !cardLayout,
            overlayPlayButton: true,
            allowBottomPadding: allowBottomPadding,
            cardLayout: cardLayout,
            vibrant: supportsImageAnalysis
        });

        if (enableScrollX()) {
            section.querySelector('.emby-scroller').scrollToBeginning();
        }
    }

    function renderLatest(view, items) {

        var section = view.querySelector('.latestSection');
        var container = section.querySelector('.itemsContainer');

        cardBuilder.buildCards(items, {
            parentContainer: section,
            itemsContainer: container,
            items: items,
            shape: getPortraitShape(),
            overlayText: false,
            showUnplayedIndicator: false,
            showChildCountIndicator: true,
            lazy: true,
            overlayPlayButton: true
        });

        if (enableScrollX()) {
            section.querySelector('.emby-scroller').scrollToBeginning();
        }
    }

    MovieSuggestionsTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];
        var parentId = this.params.parentid;
        var limit = enableScrollX() ? 18 : 12;

        promises.push(apiClient.getItems(apiClient.getCurrentUserId(), {

            SortBy: "DatePlayed",
            SortOrder: "Descending",
            IncludeItemTypes: "Movie",
            Filters: "IsResumable",
            Limit: limit,
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            EnableTotalRecordCount: false
        }));

        promises.push(apiClient.getLatestItems({

            IncludeItemTypes: "Movie",
            Limit: 30,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        }));

        this.promises = promises;
    };

    function getBackdropShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    MovieSuggestionsTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        var view = this.view;

        if (!this.initComplete) {
            this.initComplete = true;
            initLayout(view);
        }

        this.promises = [];

        promises[0].then(function (result) {
            renderResume(view, result.Items);
            return Promise.resolve();
        });

        promises[1].then(function (result) {
            renderLatest(view, result);
            return Promise.resolve();
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    MovieSuggestionsTab.prototype.onHide = function () {

    };

    MovieSuggestionsTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return MovieSuggestionsTab;
});