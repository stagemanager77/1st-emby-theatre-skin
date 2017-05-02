define(['globalize', './spotlight', 'imageLoader', 'focusManager', 'pluginManager', 'cardBuilder', './../skininfo', 'emby-itemscontainer'], function (globalize, spotlight, imageLoader, focusManager, pluginManager, cardbuilder, skinInfo) {
    'use strict';

    function loadResume(element, parentId) {

        var options = {

            Limit: 6,
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return Emby.Models.resumable(options).then(function (result) {

            var section = element.querySelector('.resumeSection');

            cardbuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdrop',
                rows: 3,
                preferThumb: true,
                scalable: false
            });
        });
    }

    function loadLatest(element, parentId) {

        var options = {

            IncludeItemTypes: "Movie",
            Limit: 12,
            ParentId: parentId,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return Emby.Models.latestItems(options).then(function (result) {

            var section = element.querySelector('.latestSection');

            cardbuilder.buildCards(result, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'portrait',
                rows: 2,
                scalable: false
            });
        });
    }

    function loadSpotlight(instance, element, parentId) {

        var options = {

            SortBy: "Random",
            IncludeItemTypes: "Movie",
            Limit: 20,
            Recursive: true,
            ParentId: parentId,
            EnableImageTypes: "Backdrop",
            ImageTypes: "Backdrop",
            Fields: "Taglines"
        };

        return Emby.Models.items(options).then(function (result) {

            var card = element.querySelector('.wideSpotlightCard');

            instance.spotlight = new spotlight(card, result.Items, 767);
        });
    }

    function loadRecommendations(element, apiClient, parentId) {

        return apiClient.getMovieRecommendations({

            categoryLimit: 4,
            ItemLimit: 8,
            UserId: apiClient.getCurrentUserId(),
            ImageTypeLimit: 1,
            Fields: "PrimaryImageAspectRatio"

        }).then(function (recommendations) {

            var values = recommendations.map(getRecommendationHtml);

            var recs = element.querySelector('.recommendations');

            if (recs) {
                recs.innerHTML = '<div class="horizontalSectionsContainer">' + values.join('') + '</div>';

                imageLoader.lazyChildren(recs);
            }
        });
    }

    function getRecommendationHtml(recommendation) {

        var cardsHtml = cardbuilder.getCardsHtml(recommendation.Items, {
            shape: 'portrait',
            rows: 2,
            scalable: false
        });

        var html = '';

        var title = '';

        switch (recommendation.RecommendationType) {

            case 'SimilarToRecentlyPlayed':
                title = globalize.translate('RecommendationBecauseYouWatched').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'SimilarToLikedItem':
                title = globalize.translate('RecommendationBecauseYouLike').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'HasDirectorFromRecentlyPlayed':
            case 'HasLikedDirector':
                title = globalize.translate('RecommendationDirectedBy').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'HasActorFromRecentlyPlayed':
            case 'HasLikedActor':
                title = globalize.translate('RecommendationStarring').replace("{0}", recommendation.BaselineItemName);
                break;
        }

        html += '<div class="horizontalSection">';
        html += '<div class="sectionTitle">' + title + '</div>';

        html += '<div is="emby-itemscontainer" class="itemsContainer">';

        html += cardsHtml;

        html += '</div>';
        html += '</div>';

        return html;
    }

    function loadImages(element, parentId) {

        return Emby.Models.items({

            SortBy: "IsFavoriteOrLiked,Random",
            IncludeItemTypes: "Movie",
            Limit: 2,
            Recursive: true,
            ParentId: parentId,
            EnableImageTypes: "Backdrop",
            ImageTypes: "Backdrop"

        }).then(function (result) {

            var items = result.Items;
            var imgOptions = {
                maxWidth: 600
            };

            if (items.length > 0) {
                element.querySelector('.movieFavoritesCard .cardImage').style.backgroundImage = "url('" + Emby.Models.backdropImageUrl(items[0], imgOptions) + "')";
            }

            if (items.length > 1) {
                element.querySelector('.allMoviesCard .cardImage').style.backgroundImage = "url('" + Emby.Models.backdropImageUrl(items[1], imgOptions) + "')";
            }
        });
    }

    function view(element, apiClient, parentId, autoFocus) {

        var self = this;

        if (autoFocus) {
            focusManager.autoFocus(element);
        }

        self.loadData = function (isRefresh) {

            var promises = [
                loadResume(element, parentId),
                loadLatest(element, parentId)
            ];

            if (!isRefresh) {
                promises.push(loadRecommendations(element, apiClient, parentId));
            }

            return Promise.all(promises);
        };
        loadSpotlight(self, element, parentId);
        loadImages(element, parentId);

        element.querySelector('.allMoviesCard').addEventListener('click', function () {
            Emby.Page.show(pluginManager.mapRoute(skinInfo.id, 'movies/movies.html?serverId=' + apiClient.serverId() + '&tab=0&parentId=' + parentId));
        });

        element.querySelector('.movieCollectionsCard').addEventListener('click', function () {
            Emby.Page.show(pluginManager.mapRoute(skinInfo.id, 'movies/movies.html?serverId=' + apiClient.serverId() + '&tab=4&parentId=' + parentId));
        });

        element.querySelector('.movieFavoritesCard').addEventListener('click', function () {
            Emby.Page.show(pluginManager.mapRoute(skinInfo.id, 'movies/movies.html?serverId=' + apiClient.serverId() + '&tab=3&parentId=' + parentId));
        });

        self.destroy = function () {
            if (self.spotlight) {
                self.spotlight.destroy();
                self.spotlight = null;
            }
        };
    }

    return view;

});