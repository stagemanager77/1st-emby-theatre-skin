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
            context: 'music',
            showTitle: true,
            coverImage: true,
            showParentTitle: true,
            centerText: true
        });
    }

    AlbumsTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];
        var parentId = this.params.parentid;

        promises.push(apiClient.getItems(apiClient.getCurrentUserId(), {

            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "MusicAlbum",
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo,SortName",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary",
            StartIndex: 0,
            parentId: parentId
        }));

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