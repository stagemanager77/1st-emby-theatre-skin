define(['appRouter', 'cardBuilder', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'focusManager', 'scrollHelper', 'pluginManager', './../skininfo', 'globalize', 'dom', 'emby-itemscontainer', 'emby-scroller'], function (appRouter, cardBuilder, loading, connectionManager, appHost, layoutManager, focusManager, scrollHelper, pluginManager, skinInfo, globalize, dom) {
    'use strict';

    function enableScrollX() {
        return true;
    }

    function LiveTvSuggestionsTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);

        initLayout(view);
        initMoreButtons(view, params);

        view.addEventListener('click', onViewClick);
    }

    function onViewClick(e) {
        var textButtonCard = dom.parentWithClass(e.target, 'textButtonCard');

        if (textButtonCard) {
            var verticalSection = dom.parentWithClass(textButtonCard, 'verticalSection');

            var btnMore = verticalSection.querySelector('.btnMore');

            btnMore.click();
        }
    }

    function initLayout(view) {

        var containers = view.querySelectorAll('.autoScrollSection');

        for (var i = 0, length = containers.length; i < length; i++) {

            var section = containers[i];

            var html;

            if (enableScrollX()) {
                html = '<div is="emby-scroller" data-mousewheel="false" data-framesize="matchgrandparent" data-centerfocus="card"><div class="scrollerframe padded-top-focusscale padded-bottom-focusscale"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right align-items-flex-start"></div></div></div>';
            } else {
                html = '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap"></div>';
            }

            section.insertAdjacentHTML('beforeend', html);
        }
    }

    function onMoreButtonClick() {

        var url = 'livetv/' + this.getAttribute('data-href');

        url += '&serverId=' + this.getAttribute('data-serverid');

        appRouter.show(pluginManager.mapRoute(skinInfo.id, url));
    }

    function initMoreButtons(view, params) {

        var elems = view.querySelectorAll('.btnMore');
        for (var i = 0, length = elems.length; i < length; i++) {

            elems[i].setAttribute('data-serverid', params.serverId);
            elems[i].addEventListener('click', onMoreButtonClick);
        }
    }

    function getPortraitShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function renderItems(view, items, sectionClass, overlayButton, cardOptions) {

        var section = view.querySelector('.' + sectionClass);

        var container = section.querySelector('.itemsContainer');
        var cardLayout = false;

        cardOptions = cardOptions || {};

        var enableCardMoreButton = layoutManager.tv;

        var trailingButtons = enableCardMoreButton && section.classList.contains('withMoreButton') ? [
            {
                name: globalize.translate('More'),
                id: 'more'
            }
        ] : null;

        cardBuilder.buildCards(items, Object.assign({

            parentContainer: section,
            itemsContainer: container,
            items: items,
            preferThumb: 'auto',
            inheritThumb: false,
            shape: (enableScrollX() ? 'autooverflow' : 'auto'),
            defaultShape: getBackdropShape(),
            showParentTitle: true,
            showTitle: true,
            centerText: true,
            coverImage: true,
            overlayText: false,
            lazy: true,
            overlayMoreButton: overlayButton === 'more',
            overlayPlayButton: overlayButton === 'play',
            allowBottomPadding: !enableScrollX(),
            showAirTime: true,
            //showChannelName: true,
            showAirDateTime: true,
            trailingButtons: trailingButtons,
            lines: 3

        }, cardOptions));

        if (enableScrollX()) {
            section.querySelector('.emby-scroller').scrollToBeginning();
        }

        var moreButton = section.querySelector('.btnMore');
        if (moreButton) {
            if (enableCardMoreButton) {
                moreButton.classList.add('hide');
            } else {
                moreButton.classList.remove('hide');
            }
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
            HasAired: false,
            Limit: limit,
            IsMovie: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo,PrimaryImageAspectRatio",
            EnableImageTypes: "Primary,Thumb"

        }));

        promises.push(apiClient.getLiveTvRecommendedPrograms({

            userId: apiClient.getCurrentUserId(),
            HasAired: false,
            Limit: limit,
            IsSports: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo,PrimaryImageAspectRatio",
            EnableImageTypes: "Primary,Thumb"

        }));

        promises.push(apiClient.getLiveTvRecommendedPrograms({

            userId: apiClient.getCurrentUserId(),
            HasAired: false,
            Limit: limit,
            IsKids: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo,PrimaryImageAspectRatio",
            EnableImageTypes: "Primary,Thumb"

        }));

        promises.push(apiClient.getLiveTvRecommendedPrograms({

            userId: apiClient.getCurrentUserId(),
            HasAired: false,
            Limit: limit,
            IsNews: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo,PrimaryImageAspectRatio",
            EnableImageTypes: "Primary,Thumb"

        }));

        this.promises = promises;
    };

    function getBackdropShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    LiveTvSuggestionsTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        promises[0].then(function (result) {
            renderItems(view, result.Items, 'activePrograms', 'play');
            return Promise.resolve();
        });

        promises[1].then(function (result) {
            renderItems(view, result.Items, 'upcomingEpisodes');
            return Promise.resolve();
        });

        promises[2].then(function (result) {
            renderItems(view, result.Items, 'upcomingTvMovies', null, {
                shape: getPortraitShape(),
                preferThumb: null,
                lines: 2
            });
            return Promise.resolve();
        });

        promises[3].then(function (result) {
            renderItems(view, result.Items, 'upcomingSports');
            return Promise.resolve();
        });

        promises[4].then(function (result) {
            renderItems(view, result.Items, 'upcomingKids');
            return Promise.resolve();
        });

        promises[5].then(function (result) {
            renderItems(view, result.Items, 'upcomingNews', {
                lines: 2
            });
            return Promise.resolve();
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
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