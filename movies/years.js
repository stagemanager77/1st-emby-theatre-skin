define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager) {
    'use strict';

    function MoviesTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function enableScrollX() {
        return !layoutManager.desktop;
    }

    function getPortraitShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function renderMovies(view, items) {

        var groups = [];

        var currentGroupName = '';
        var currentGroup = [];

        var i, length;

        for (i = 0, length = items.length; i < length; i++) {

            var item = items[i];

            var dateText = item.ProductionYear;

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
            html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + group.name + '</h2>';

            var allowBottomPadding = true;

            if (enableScrollX()) {
                allowBottomPadding = false;
                html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="card" data-horizontal="true">';
                html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x padded-left padded-right">';
            } else {
                html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right focuscontainer-x">';
            }

            var supportsImageAnalysis = appHost.supports('imageanalysis');

            html += cardBuilder.getCardsHtml({
                items: group.items,
                shape: getPortraitShape(),
                overlayText: true,
                allowBottomPadding: allowBottomPadding,
                //showTitle: true,
                //showParentTitle: true,
                centerText: true

            });

            if (enableScrollX()) {
                html += '</div>';
            }

            html += '</div>';

            html += '</div>';
        }

        view.innerHTML = html;
        imageLoader.lazyChildren(view);
    }

    MoviesTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];
        var parentId = this.params.parentId;

        var query = {
            SortBy: "ProductionYear,SortName",
            SortOrder: "Descending",
            IncludeItemTypes: "Movie",
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo,SortName",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            StartIndex: 0,
            parentId: parentId
        };

        promises.push(apiClient.getItems(apiClient.getCurrentUserId(), query));

        this.promises = promises;
    };

    MoviesTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        promises[0].then(function (result) {
            renderMovies(view, result.Items);
            return Promise.resolve();
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    MoviesTab.prototype.onHide = function () {

    };

    MoviesTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return MoviesTab;
});