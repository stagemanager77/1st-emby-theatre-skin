define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager) {
    'use strict';

    function MoviesTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function renderMovies(view, items) {

        var container = view.querySelector('.movieItems');

        cardBuilder.buildCards(items, {
            itemsContainer: container,
            items: items,
            shape: "portrait",
            centerText: true,
            overlayMoreButton: !layoutManager.tv,
            showTitle: true,
            cardLayout: true
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
            IncludeItemTypes: "BoxSet",
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            StartIndex: 0
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