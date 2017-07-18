define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'datetime', 'globalize', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager, datetime, globalize) {
    'use strict';

    function UpcomingTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function enableScrollX() {
        return layoutManager.mobile;
    }

    function getThumbShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function renderUpcoming(view, items) {

        var groups = [];

        var currentGroupName = '';
        var currentGroup = [];

        var i, length;

        for (i = 0, length = items.length; i < length; i++) {

            var item = items[i];

            var dateText = '';

            if (item.PremiereDate) {
                try {

                    var premiereDate = datetime.parseISO8601Date(item.PremiereDate, true);

                    if (datetime.isRelativeDay(premiereDate, -1)) {
                        dateText = globalize.translate('Yesterday');
                    } else {
                        dateText = datetime.toLocaleDateString(premiereDate, {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                        });
                    }

                } catch (err) {
                    dateText = item.PremiereDate;
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

        var html = '';

        for (i = 0, length = groups.length; i < length; i++) {

            var group = groups[i];

            html += '<div class="verticalSection">';
            html += '<h2 class="sectionTitle sectionTitle-cards">' + group.name + '</h2>';

            var allowBottomPadding = true;

            if (enableScrollX()) {
                allowBottomPadding = false;
                html += '<div is="emby-itemscontainer" class="itemsContainer hiddenScrollX focuscontainer-x">';
            } else {
                html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap focuscontainer-x">';
            }

            var supportsImageAnalysis = appHost.supports('imageanalysis');

            html += cardBuilder.getCardsHtml({
                items: group.items,
                showLocationTypeIndicator: false,
                shape: getThumbShape(),
                preferThumb: true,
                lazy: true,
                showDetailsMenu: true,
                overlayText: false,
                allowBottomPadding: allowBottomPadding,
                showParentTitle: true,
                showTitle: true,
                centerText: true

            });
            html += '</div>';

            html += '</div>';
        }

        view.innerHTML = html;
        imageLoader.lazyChildren(view);
    }

    UpcomingTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];
        var parentId = this.params.parentId;

        promises.push(apiClient.getUpcomingEpisodes({

            Limit: 60,
            UserId: apiClient.getCurrentUserId(),
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            EnableTotalRecordCount: false,
            parentId: parentId
        }));

        this.promises = promises;
    };

    UpcomingTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        promises[0].then(function (result) {
            renderUpcoming(view, result.Items);
            return Promise.resolve();
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    UpcomingTab.prototype.onHide = function () {

    };

    UpcomingTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return UpcomingTab;
});