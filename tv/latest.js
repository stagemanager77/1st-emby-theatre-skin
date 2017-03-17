define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager) {
    'use strict';

    function LatestTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function renderLatest(view, items) {

        var container = view.querySelector('.latestItems');
        var supportsImageAnalysis = appHost.supports('imageanalysis');
        var cardLayout = supportsImageAnalysis;

        cardBuilder.buildCards(items, {
            itemsContainer: container,
            items: items,
            shape: 'backdrop',
            preferThumb: true,
            showTitle: true,
            showSeriesYear: true,
            showParentTitle: true,
            overlayText: false,
            cardLayout: cardLayout,
            showUnplayedIndicator: false,
            showChildCountIndicator: true,
            centerText: !cardLayout,
            lazy: true,
            overlayPlayButton: true,
            vibrant: supportsImageAnalysis,
            lines: 2
        });
    }

    LatestTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];
        var parentId = this.params.parentId;

        promises.push(apiClient.getLatestItems({

            IncludeItemTypes: "Episode",
            Limit: 30,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"

        }));

        this.promises = promises;
    };

    LatestTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        var parentId = this.params.parentId;

        promises[0].then(function (result) {
            renderLatest(view, result);
            return Promise.resolve();
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    LatestTab.prototype.onHide = function () {

    };

    LatestTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return LatestTab;
});