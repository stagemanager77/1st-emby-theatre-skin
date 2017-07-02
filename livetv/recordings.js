define(['cardBuilder', 'loading', 'connectionManager', 'apphost', 'datetime', 'layoutManager', 'scrollHelper', 'focusManager', 'pluginManager', './../skininfo', 'embyRouter', 'globalize', 'dom', 'emby-itemscontainer', 'emby-scroller'], function (cardBuilder, loading, connectionManager, appHost, datetime, layoutManager, scrollHelper, focusManager, pluginManager, skinInfo, embyRouter, globalize, dom) {
    'use strict';

    function enableScrollX() {
        return true;
    }

    function LiveTvRecordingsTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);

        initLayout(view);

        var moreButtons = view.querySelectorAll('.btnMore');
        for (var i = 0, length = moreButtons.length; i < length; i++) {
            moreButtons[i].setAttribute('data-serverid', params.serverId);
            moreButtons[i].addEventListener('click', onMoreClick);
        }

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

    function getBackdropShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    LiveTvRecordingsTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];

        promises.push(apiClient.getLiveTvRecordings({
            UserId: apiClient.getCurrentUserId(),
            IsInProgress: true,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            EnableImageTypes: "Primary,Thumb,Backdrop"
        }));

        promises.push(apiClient.getLiveTvRecordings({
            UserId: apiClient.getCurrentUserId(),
            Limit: enableScrollX() ? 12 : 8,
            IsInProgress: false,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            EnableImageTypes: "Primary,Thumb,Backdrop"
        }));

        promises.push(apiClient.getLiveTvRecordings({

            UserId: apiClient.getCurrentUserId(),
            Limit: enableScrollX() ? 12 : 8,
            IsInProgress: false,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            IsMovie: true
        }));

        promises.push(apiClient.getLiveTvRecordingSeries({
            UserId: apiClient.getCurrentUserId(),
            Limit: enableScrollX() ? 12 : 8,
            IsInProgress: false,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            IsSeries: true
        }));

        promises.push(apiClient.getLiveTvRecordings({
            UserId: apiClient.getCurrentUserId(),
            Limit: enableScrollX() ? 12 : 8,
            IsInProgress: false,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            IsSports: true
        }));

        promises.push(apiClient.getLiveTvRecordings({

            UserId: apiClient.getCurrentUserId(),
            Limit: enableScrollX() ? 12 : 8,
            IsInProgress: false,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            IsKids: true
        }));

        promises.push(apiClient.getLiveTvRecordingGroups({

            userId: apiClient.getCurrentUserId()
        }));

        this.promises = promises;
    };

    function renderRecordings(section, items, cardOptions) {

        var container = section.querySelector('.itemsContainer');
        var supportsImageAnalysis = appHost.supports('imageanalysis');
        supportsImageAnalysis = false;
        var cardLayout = supportsImageAnalysis;

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
            shape: (enableScrollX() ? 'autooverflow' : 'auto'),
            showTitle: true,
            showParentTitle: true,
            coverImage: true,
            lazy: true,
            cardLayout: cardLayout,
            vibrant: supportsImageAnalysis,
            allowBottomPadding: !enableScrollX(),
            preferThumb: 'auto',
            centerText: !cardLayout,
            overlayText: false,
            trailingButtons: trailingButtons

        }, cardOptions || {}));

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

    function renderActiveRecordings(context, items) {

        renderRecordings(context.querySelector('.activeRecordings'), items, {
            shape: getBackdropShape(),
            showParentTitle: false,
            showParentTitleOrTitle: true,
            showTitle: false,
            showAirTime: true,
            showAirEndTime: true,
            showChannelName: true,
            preferThumb: true,
            coverImage: true,
            overlayText: false
        });
    }

    function onMoreClick(e) {

        var type = this.getAttribute('data-type');
        var url;

        switch (type) {
            case 'latest':
                url = 'livetvitems.html?type=Recordings';
                break;
            case 'movies':
                url = 'livetvitems.html?type=Recordings&IsMovie=true';
                break;
            case 'episodes':
                url = 'livetvitems.html?type=RecordingSeries';
                break;
            case 'programs':
                url = 'livetvitems.html?type=Recordings&IsSeries=false&IsMovie=false';
                break;
            case 'kids':
                url = 'livetvitems.html?type=Recordings&IsKids=true';
                break;
            case 'sports':
                url = 'livetvitems.html?type=Recordings&IsSports=true';
                break;
            default:
                break;
        }

        url = 'livetv/' + url;

        url += '&serverId=' + this.getAttribute('data-serverid');

        embyRouter.show(pluginManager.mapRoute(skinInfo.id, url));
    }

    LiveTvRecordingsTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        promises[0].then(function (result) {
            renderActiveRecordings(view, result.Items);
            return Promise.resolve();
        });

        promises[1].then(function (result) {

            renderRecordings(view.querySelector('.latestRecordings'), result.Items, {
                shape: (enableScrollX() ? 'overflowBackdrop' : 'backdrop'),
                showYear: true,
                lines: 2
            });
            return Promise.resolve();
        });

        promises[2].then(function (result) {

            renderRecordings(view.querySelector('.movieRecordings'), result.Items, {
                showYear: true,
                showParentTitle: false
            });
            return Promise.resolve();
        });

        promises[3].then(function (result) {

            renderRecordings(view.querySelector('.episodeRecordings'), result.Items, {
                showSeriesYear: true,
                showParentTitle: false
            });
            return Promise.resolve();
        });

        promises[4].then(function (result) {

            renderRecordings(view.querySelector('.sportsRecordings'), result.Items, {
                showYear: true,
                showParentTitle: false
            });
            return Promise.resolve();
        });

        promises[5].then(function (result) {

            renderRecordings(view.querySelector('.kidsRecordings'), result.Items, {
                shape: (enableScrollX() ? 'overflowBackdrop' : 'backdrop'),
                showYear: true,
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

    LiveTvRecordingsTab.prototype.onHide = function () {

    };

    LiveTvRecordingsTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return LiveTvRecordingsTab;
});