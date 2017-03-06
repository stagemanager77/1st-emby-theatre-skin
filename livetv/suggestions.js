define(['cardBuilder', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'emby-itemscontainer', 'emby-scroller'], function (cardBuilder, loading, connectionManager, appHost, layoutManager, scrollHelper) {
    'use strict';

    function enableScrollX() {
        return !layoutManager.desktop;
    }

    function LiveTvSuggestionsTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);

        initLayout(view);
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

    function getPortraitShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function renderItems(view, items, sectionClass, overlayButton, cardOptions) {

        var section = view.querySelector('.' + sectionClass);

        var container = section.querySelector('.itemsContainer');
        var cardLayout = true;

        cardOptions = cardOptions || {};

        cardBuilder.buildCards(items, Object.assign({

            parentContainer: section,
            itemsContainer: container,
            items: items,
            preferThumb: true,
            inheritThumb: false,
            shape: (enableScrollX() ? 'overflowBackdrop' : 'backdrop'),
            showParentTitleOrTitle: true,
            showTitle: false,
            centerText: !cardLayout,
            coverImage: true,
            overlayText: false,
            lazy: true,
            overlayMoreButton: overlayButton !== 'play' && !cardLayout && !layoutManager.tv,
            overlayPlayButton: overlayButton === 'play' && !layoutManager.tv,
            allowBottomPadding: !enableScrollX(),
            showAirTime: true,
            showAirDateTime: true,
            showChannelName: true,
            cardLayout: cardLayout

        }, cardOptions));

        if (enableScrollX()) {
            section.querySelector('.emby-scroller').scrollToBeginning();
        }
    }

    LiveTvSuggestionsTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];

        var limit = enableScrollX() ? 24 : 12;

        promises.push(apiClient.getLiveTvRecordings({
            UserId: apiClient.getCurrentUserId(),
            IsInProgress: true,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            EnableImageTypes: "Primary,Thumb,Backdrop"
        }));

        // on now
        promises.push(apiClient.getLiveTvRecommendedPrograms({

            UserId: apiClient.getCurrentUserId(),
            IsAiring: true,
            Limit: limit,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Thumb,Backdrop",
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo,PrimaryImageAspectRatio"

        }));

        // upcoming episodes
        promises.push(apiClient.getLiveTvRecommendedPrograms({

            UserId: apiClient.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            Limit: limit,
            IsMovie: false,
            IsSports: false,
            IsKids: false,
            IsNews: false,
            IsSeries: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo,PrimaryImageAspectRatio",
            EnableImageTypes: "Primary,Thumb"
        }));

        promises.push(apiClient.getLiveTvRecommendedPrograms({

            userId: apiClient.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            Limit: limit,
            IsMovie: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"

        }));

        promises.push(apiClient.getLiveTvRecommendedPrograms({

            userId: apiClient.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            Limit: limit,
            IsSports: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"

        }));

        promises.push(apiClient.getLiveTvRecommendedPrograms({

            userId: apiClient.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            Limit: limit,
            IsKids: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"

        }));

        // upcoming programs
        promises.push(apiClient.getLiveTvRecommendedPrograms({

            UserId: apiClient.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            Limit: limit,
            IsMovie: false,
            IsSports: false,
            IsKids: false,
            IsSeries: false,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo,PrimaryImageAspectRatio",
            EnableImageTypes: "Primary,Thumb"
        }));

        this.promises = promises;
    };

    function renderRecordings(section, items, cardOptions) {

        var container = section.querySelector('.itemsContainer');
        var supportsImageAnalysis = appHost.supports('imageanalysis');

        cardBuilder.buildCards(items, Object.assign({
            parentContainer: section,
            itemsContainer: container,
            shape: (enableScrollX() ? 'autooverflow' : 'auto'),
            showTitle: true,
            showParentTitle: true,
            coverImage: true,
            lazy: true,
            cardLayout: true,
            allowBottomPadding: !enableScrollX(),
            preferThumb: 'auto'
        }, cardOptions || {}));

        if (enableScrollX()) {
            section.querySelector('.emby-scroller').scrollToBeginning();
        }
    }

    function getBackdropShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function renderActiveRecordings(context, items) {

        renderRecordings(context.querySelector('.activeRecordings'), items, {
            shape: getBackdropShape(),
            showParentTitle: false,
            showTitle: true,
            showAirTime: true,
            showAirEndTime: true,
            showChannelName: true,
            cardLayout: true,
            preferThumb: true,
            coverImage: true,
            overlayText: false
        });
    }

    LiveTvSuggestionsTab.prototype.onShow = function () {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        promises[0].then(function (result) {
            renderActiveRecordings(view, result.Items);
        });

        promises[1].then(function (result) {
            renderItems(view, result.Items, 'activePrograms');
        });

        promises[2].then(function (result) {
            renderItems(view, result.Items, 'upcomingEpisodes');
        });

        promises[3].then(function (result) {
            renderItems(view, result.Items, 'upcomingTvMovies', null, {
                shape: getPortraitShape(),
                preferThumb: null
            });
        });

        promises[4].then(function (result) {
            renderItems(view, result.Items, 'upcomingSports');
        });

        promises[5].then(function (result) {
            renderItems(view, result.Items, 'upcomingKids');
        });

        promises[6].then(function (result) {
            renderItems(view, result.Items, 'upcomingPrograms');
        });

    };

    LiveTvSuggestionsTab.prototype.onHide = function () {

    };

    LiveTvSuggestionsTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return LiveTvSuggestionsTab;
});