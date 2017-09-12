define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager) {
    'use strict';

    function TvFavoritesTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function renderSeries(view, items) {

        cardBuilder.buildCards(items, {
            parentContainer: view.querySelector('.favoriteSeriesSection'),
            itemsContainer: view.querySelector('.seriesItems'),
            items: items,
            shape: "portrait",
            centerText: true,
            overlayMoreButton: !layoutManager.tv,
            showTitle: true
        });
    }

    function renderEpisodes(view, items) {

        cardBuilder.buildCards(items, {
            parentContainer: view.querySelector('.favoriteEpisodesSection'),
            itemsContainer: view.querySelector('.episodeItems'),
            items: items,
            shape: "backdrop",
            showTitle: true,
            showParentTitle: true,
            overlayText: false,
            centerText: true,
            coverImage: true,
            overlayMoreButton: !layoutManager.tv
        });
    }

    TvFavoritesTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];
        var parentId = this.params.parentId;

        promises.push(apiClient.getItems(apiClient.getCurrentUserId(), {

            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "Series",
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            StartIndex: 0,
            parentId: parentId,
            IsFavorite: true
        }));

        promises.push(apiClient.getItems(apiClient.getCurrentUserId(), {

            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "Episode",
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            StartIndex: 0,
            parentId: parentId,
            IsFavorite: true
        }));

        this.promises = promises;
    };

    TvFavoritesTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        promises[0].then(function (result) {
            renderSeries(view, result.Items);
            return Promise.resolve();
        });

        promises[1].then(function (result) {
            renderEpisodes(view, result.Items);
            return Promise.resolve();
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    TvFavoritesTab.prototype.onHide = function () {

    };

    TvFavoritesTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return TvFavoritesTab;
});