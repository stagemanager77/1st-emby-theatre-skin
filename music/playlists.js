define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager) {
    'use strict';

    function MusicPlaylistsTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function renderItems(view, items) {

        var container = view.querySelector('.itemsContainer');

        cardBuilder.buildCards(items, {
            itemsContainer: container,
            items: items,
            shape: "auto",
            context: 'music',
            showItemCounts: true,
            cardLayout: true,
            showTitle: true,
            vibrant: true
        });
    }

    MusicPlaylistsTab.prototype.onBeforeShow = function (options) {

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
            IncludeItemTypes: "Playlist",
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,CanDelete",
            StartIndex: 0,
            EnableTotalRecordCount: false
        }));

        this.promises = promises;
    };

    MusicPlaylistsTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        promises[0].then(function (result) {
            renderItems(view, result.Items);
            return Promise.resolve();
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    MusicPlaylistsTab.prototype.onHide = function () {

    };

    MusicPlaylistsTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return MusicPlaylistsTab;
});