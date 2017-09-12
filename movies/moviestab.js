define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager) {
    'use strict';

    function MoviesTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function renderMovies(view, items, mode) {

        var container = view.querySelector('.movieItems');

        cardBuilder.buildCards(items, {
            itemsContainer: container,
            items: items,
            shape: "portrait",
            centerText: true,
            overlayMoreButton: !layoutManager.tv,
            showTitle: true,
            showYear: mode === 'unwatched' || mode === 'favorites'
        });
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
            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "Movie",
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo,SortName",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            StartIndex: 0,
            parentId: parentId
        };

        if (this.mode === 'unwatched') {
            query.Filters = "IsUnplayed";
        }
        else if (this.mode === 'favorites') {
            query.Filters = "IsFavorite";
        }

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
        var mode = this.mode;

        promises[0].then(function (result) {
            renderMovies(view, result.Items, mode);
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