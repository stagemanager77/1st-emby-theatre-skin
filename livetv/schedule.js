define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'datetime', 'layoutManager', 'scrollHelper', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, datetime, layoutManager, scrollHelper) {
    'use strict';

    function enableScrollX() {
        return layoutManager.mobile;
    }

    function LiveTvScheduleTab(view, params) {
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
                html = '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-framesize="matchgrandparent" data-centerfocus="card"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right"></div></div>';
            } else {
                html = '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap"></div>';
            }

            section.insertAdjacentHTML('beforeend', html);
        }
    }

    function getBackdropShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function getTimersHtml(timers) {

        var items = timers.map(function (t) {
            t.Type = 'Timer';
            return t;
        });

        var groups = [];

        var currentGroupName = '';
        var currentGroup = [];

        var i, length;

        for (i = 0, length = items.length; i < length; i++) {

            var item = items[i];

            var dateText = '';

            if (item.StartDate) {
                try {

                    var premiereDate = datetime.parseISO8601Date(item.StartDate, true);

                    dateText = datetime.toLocaleDateString(premiereDate, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    });

                } catch (err) {
                }
            }

            if (dateText !== currentGroupName) {

                if (currentGroup.length) {
                    groups.push({
                        name: currentGroupName,
                        items: currentGroup
                    });
                }

                currentGroupName = dateText;
                currentGroup = [item];
            } else {
                currentGroup.push(item);
            }
        }

        if (currentGroup.length) {
            groups.push({
                name: currentGroupName,
                items: currentGroup
            });
        }

        var html = '';

        for (i = 0, length = groups.length; i < length; i++) {

            var group = groups[i];

            html += '<div class="verticalSection">';

            html += '<h2 class="sectionTitle padded-left">' + group.name + '</h2>';

            if (enableScrollX()) {
                html += '<div is="emby-itemscontainer" class="itemsContainer hiddenScrollX padded-left padded-right padded-top-focusscale padded-bottom-focusscale">';
            } else {

                html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
            }

            var supportsImageAnalysis = appHost.supports('imageanalysis');
            var cardLayout = appHost.preferVisualCards || supportsImageAnalysis;

            html += cardBuilder.getCardsHtml({
                items: group.items,
                shape: getBackdropShape(),
                showParentTitleOrTitle: true,
                showAirTime: true,
                showAirEndTime: true,
                showChannelName: true,
                cardLayout: cardLayout,
                centerText: !cardLayout,
                vibrant: supportsImageAnalysis,
                action: 'edit',
                cardFooterAside: 'none',
                preferThumb: true,
                coverImage: true,
                overlayText: false

            });
            html += '</div>';

            html += '</div>';
        }

        return html;
    }

    LiveTvScheduleTab.prototype.onBeforeShow = function (options) {

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

        promises.push(apiClient.getLiveTvTimers({
            IsActive: false,
            IsScheduled: true
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
            vibrant: true,
            allowBottomPadding: !enableScrollX(),
            preferThumb: 'auto'
        }, cardOptions || {}));

        if (enableScrollX()) {
            section.querySelector('.emby-scroller').scrollToBeginning();
        }
    }

    function renderTimers(elem, items) {

        var html = getTimersHtml(items);

        if (html) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }

        elem.querySelector('.upcomingRecordings').innerHTML = html;

        imageLoader.lazyChildren(elem);
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
            vibrant: true,
            preferThumb: true,
            coverImage: true,
            overlayText: false
        });
    }

    LiveTvScheduleTab.prototype.onShow = function () {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        var view = this.view;

        promises[0].then(function (result) {
            renderActiveRecordings(view, result.Items);
        });

        promises[1].then(function (result) {
            renderTimers(view, result.Items);
        });

    };

    LiveTvScheduleTab.prototype.onHide = function () {

    };

    LiveTvScheduleTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return LiveTvScheduleTab;
});