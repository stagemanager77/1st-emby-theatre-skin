define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper) {
    'use strict';

    function LiveTvSeriesTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function renderItems(view, items, sectionClass, overlayButton, cardOptions) {

        var supportsImageAnalysis = appHost.supports('imageanalysis');
        var cardLayout = appHost.preferVisualCards || supportsImageAnalysis;
        cardLayout = false;

        cardOptions = cardOptions || {};

        var html = cardBuilder.getCardsHtml(Object.assign({
            items: items,
            shape: 'auto',
            defaultShape: 'portrait',
            showTitle: true,
            cardLayout: cardLayout,
            preferThumb: 'auto',
            coverImage: true,
            overlayText: false,
            showSeriesTimerTime: true,
            showSeriesTimerChannel: true,
            centerText: !cardLayout,
            overlayMoreButton: !cardLayout,
            lines: 3

        }, cardOptions));

        var elem = view.querySelector('.' + sectionClass);

        elem.innerHTML = html;
        imageLoader.lazyChildren(elem);
    }

    LiveTvSeriesTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];

        promises.push(apiClient.getLiveTvSeriesTimers({

            SortBy: "SortName",
            SortOrder: "Ascending"
        }));

        this.promises = promises;
    };

    LiveTvSeriesTab.prototype.onShow = function () {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        promises[0].then(function (result) {
            renderItems(view, result.Items, 'itemsContainer');
        });

    };

    LiveTvSeriesTab.prototype.onHide = function () {

    };

    LiveTvSeriesTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return LiveTvSeriesTab;
});