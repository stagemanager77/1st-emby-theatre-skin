define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager) {
    'use strict';

    function StudiosTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function renderSeries(view, items, parentId) {

        var container = view.querySelector('.studioItems');

        cardBuilder.buildCards(items, {
            itemsContainer: container,
            items: items,
            shape: "backdrop",
            preferThumb: true,
            showTitle: true,
            scalable: true,
            centerText: true,
            overlayMoreButton: true,
            parentId: parentId
        });
    }

    StudiosTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];
        var parentId = this.params.parentId;

        promises.push(apiClient.getStudios(apiClient.getCurrentUserId(), {

            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "Series",
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo,SortName",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Thumb",
            ParentId: parentId
        }));

        this.promises = promises;
    };

    StudiosTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;

        var parentId = this.params.parentId;

        promises[0].then(function (result) {
            renderSeries(view, result.Items, parentId);
            return Promise.resolve();
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    StudiosTab.prototype.onHide = function () {

    };

    StudiosTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return StudiosTab;
});