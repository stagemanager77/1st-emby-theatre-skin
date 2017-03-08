define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager) {
    'use strict';

    function AlbumsTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function renderAlbums(view, items) {

        var container = view.querySelector('.itemsContainer');

        cardBuilder.buildCards(items, {
            itemsContainer: container,
            items: items,
            shape: "square",
            showTitle: true,
            overlayText: true,
            overlayMoreButton: !layoutManager.tv
        });
    }

    AlbumsTab.prototype.onBeforeShow = function (options) {

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
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,SortName,ItemCounts,BasicSyncInfo",
            StartIndex: 0,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb"
        };

        var promise = this.mode === 'albumartists' ?
           apiClient.getAlbumArtists(apiClient.getCurrentUserId(), query) :
           apiClient.getArtists(apiClient.getCurrentUserId(), query);

        promises.push(promise);

        this.promises = promises;
    };

    AlbumsTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        promises[0].then(function (result) {
            renderAlbums(view, result.Items);
            return Promise.resolve();
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    AlbumsTab.prototype.onHide = function () {

    };

    AlbumsTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return AlbumsTab;
});