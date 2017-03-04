define(['cardBuilder', 'imageLoader', 'loading', 'connectionManager', 'apphost', 'layoutManager', 'scrollHelper', 'focusManager', 'lazyLoader', 'emby-itemscontainer', 'emby-scroller'], function (cardBuilder, imageLoader, loading, connectionManager, appHost, layoutManager, scrollHelper, focusManager, lazyLoader) {
    'use strict';

    function MovieGenresTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.getApiClient(params.serverId);
    }

    function enableScrollX() {
        return !layoutManager.desktop;
    }

    function getThumbShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function getPortraitShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function renderGenres(instance, view, items) {

        var html = '';

        for (var i = 0, length = items.length; i < length; i++) {

            var item = items[i];

            html += '<div class="verticalSection">';

            html += '<div>';
            html += '<h2 class="sectionTitle padded-left padded-right">';
            html += item.Name;
            html += '</h2>';
            //html += '<button is="emby-button" type="button" class="raised more mini hide btnMoreFromGenre btnMoreFromGenre' + item.Id + '" data-id="' + item.Id + '">';
            //html += '<span>' + globalize.translate('ButtonMore') + '</span>';
            //html += '</button>';
            html += '</div>';

            if (enableScrollX()) {
                html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="card" data-horizontal="true">';
                html += '<div is="emby-itemscontainer" class="itemsContainer lazy scrollSlider focuscontainer-x padded-left padded-right" data-id="' + item.Id + '">';
                html += '</div>';
            } else {
                html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap lazy padded-left padded-right focuscontainer-x" data-id="' + item.Id + '">';
            }
            html += '</div>';

            html += '</div>';
        }

        view.innerHTML = html;

        lazyLoader.lazyChildren(view, fillItemsContainer.bind(instance));
    }

    function fillItemsContainer(elem) {

        var id = elem.getAttribute('data-id');

        var viewStyle = 'Poster';

        var limit = viewStyle === 'Thumb' || viewStyle === 'ThumbCard' ?
            5 :
            8;

        if (enableScrollX()) {
            limit = 10;
        }

        var enableImageTypes = viewStyle === 'Thumb' || viewStyle === 'ThumbCard' ?
          "Primary,Backdrop,Thumb" :
          "Primary";

        var query = {
            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "Movie",
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo",
            ImageTypeLimit: 1,
            EnableImageTypes: enableImageTypes,
            Limit: limit,
            GenreIds: id,
            EnableTotalRecordCount: false,
            ParentId: this.params.parentId
        };

        var apiClient = this.apiClient;

        apiClient.getItems(apiClient.getCurrentUserId(), query).then(function (result) {

            var supportsImageAnalysis = appHost.supports('imageanalysis');

            if (viewStyle === "Thumb") {
                cardBuilder.buildCards(result.Items, {
                    itemsContainer: elem,
                    shape: getThumbShape(),
                    preferThumb: true,
                    showTitle: true,
                    scalable: true,
                    centerText: true,
                    overlayMoreButton: true,
                    allowBottomPadding: false
                });
            }
            else if (viewStyle === "ThumbCard") {

                cardBuilder.buildCards(result.Items, {
                    itemsContainer: elem,
                    shape: getThumbShape(),
                    preferThumb: true,
                    showTitle: true,
                    scalable: true,
                    centerText: false,
                    cardLayout: true,
                    vibrant: supportsImageAnalysis,
                    showYear: true
                });
            }
            else if (viewStyle === "PosterCard") {
                cardBuilder.buildCards(result.Items, {
                    itemsContainer: elem,
                    shape: getPortraitShape(),
                    showTitle: true,
                    scalable: true,
                    centerText: false,
                    cardLayout: true,
                    vibrant: supportsImageAnalysis,
                    showYear: true
                });
            }
            else if (viewStyle === "Poster") {
                cardBuilder.buildCards(result.Items, {
                    itemsContainer: elem,
                    shape: getPortraitShape(),
                    scalable: true,
                    overlayMoreButton: true,
                    allowBottomPadding: !enableScrollX()
                });
            }

            if (result.Items.length >= query.Limit) {
                //tabContent.querySelector('.btnMoreFromGenre' + id).classList.remove('hide');
            }
        });
    }

    MovieGenresTab.prototype.onBeforeShow = function (options) {

        var apiClient = this.apiClient;

        if (!options.refresh) {
            this.promises = null;
            return;
        }

        var promises = [];
        var parentId = this.params.parentId;

        promises.push(apiClient.getGenres(apiClient.getCurrentUserId(), {

            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "Movie",
            Recursive: true,
            EnableTotalRecordCount: false,
            EnableImages: false,
            parentId: parentId
        }));

        this.promises = promises;
    };

    MovieGenresTab.prototype.onShow = function (options) {

        var promises = this.promises;
        if (!promises) {
            return;
        }

        this.promises = [];

        var view = this.view;
        var instance = this;

        promises[0].then(function (result) {
            return renderGenres(instance, view, result.Items);
        });

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    MovieGenresTab.prototype.onHide = function () {

    };

    MovieGenresTab.prototype.destroy = function () {

        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.promises = null;
    };

    return MovieGenresTab;
});