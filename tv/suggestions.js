define(['cardBuilder', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'emby-itemscontainer', 'emby-scroller'], function (cardBuilder, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager) {
    'use strict';

    function enableScrollX(section) {

        if (section === 'resume') {
            return !layoutManager.desktop;
        }

        return false;
    }

    function TvSuggestionsTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
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

    function renderResume(view, items) {

        var section = view.querySelector('.resumeSection');
        var container = section.querySelector('.itemsContainer');
        var supportsImageAnalysis = appHost.supports('imageanalysis');
        var cardLayout = false;

        var allowBottomPadding = !enableScrollX('resume');

        cardBuilder.buildCards(items, {
            parentContainer: section,
            itemsContainer: container,
            preferThumb: true,
            shape: getThumbShape('resume'),
            scalable: true,
            showTitle: true,
            showParentTitle: true,
            overlayText: false,
            centerText: !cardLayout,
            overlayPlayButton: true,
            allowBottomPadding: allowBottomPadding,
            cardLayout: cardLayout,
            vibrant: cardLayout && supportsImageAnalysis
        });

        if (enableScrollX('resume')) {
            section.querySelector('.emby-scroller').scrollToBeginning();
        }
    }

    function renderNextUp(view, items) {

        var section = view.querySelector('.nextUpSection');
        var container = section.querySelector('.itemsContainer');
        var supportsImageAnalysis = appHost.supports('imageanalysis');
        var cardLayout = false;

        cardBuilder.buildCards(items, {
            parentContainer: section,
            itemsContainer: container,
            preferThumb: true,
            shape: getThumbShape('nextup'),
            scalable: true,
            showTitle: true,
            showParentTitle: true,
            overlayText: false,
            centerText: !cardLayout,
            overlayPlayButton: true,
            cardLayout: cardLayout,
            vibrant: cardLayout && supportsImageAnalysis
        });

        if (enableScrollX('nextup')) {
            section.querySelector('.emby-scroller').scrollToBeginning();
        }
    }

    TvSuggestionsTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];
        var parentId = this.params.parentId;
        var limit = enableScrollX('resume') ? 18 : 5;

        promises.push(apiClient.getItems(apiClient.getCurrentUserId(), {

            SortBy: "DatePlayed",
            SortOrder: "Descending",
            IncludeItemTypes: "Episode",
            Filters: "IsResumable",
            Limit: limit,
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            ExcludeLocationTypes: "Virtual",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            EnableTotalRecordCount: false
        }));

        promises.push(apiClient.getNextUpEpisodes({

            ParentId: parentId,
            Limit: 48,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            UserId: apiClient.getCurrentUserId(),
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            EnableTotalRecordCount: false
        }));

        this.promises = promises;
    };

    TvSuggestionsTab.prototype.onShow = function (options) {

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
            renderNextUp(view, result.Items);
            return Promise.resolve();
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    TvSuggestionsTab.prototype.onHide = function () {

    };

    TvSuggestionsTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return TvSuggestionsTab;
});