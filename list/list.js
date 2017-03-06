define(['loading', 'scroller', 'playbackManager', 'alphaPicker', './../components/itemslist', 'emby-itemscontainer'], function (loading, scroller, playbackManager, alphaPicker, itemsList) {
    'use strict';

    function createVerticalScroller(instance, view, item, loading) {

        var scrollFrame = view.querySelector('.scrollFrame');

        var options = {
            horizontal: 0,
            slidee: view.querySelector('.scrollSlider'),
            scrollBy: 200,
            speed: 270,
            scrollWidth: 50000,
            immediateSpeed: 160
        };

        instance.scroller = new scroller(scrollFrame, options);
        instance.scroller.init();
        loadChildren(instance, view, item, loading);
    }

    function getItems(params, item, startIndex, limit) {

        if (params.type === 'collections') {

            return Emby.Models.collections({
                ParentId: item.Id,
                EnableImageTypes: "Primary,Backdrop,Thumb",
                StartIndex: startIndex,
                Limit: limit,
                Fields: 'PrimaryImageAspectRatio,SortName',
                SortBy: 'SortName'
            });
        }

        if (params.type === 'favoritemovies') {

            return Emby.Models.items({
                ParentId: item.Id,
                EnableImageTypes: "Primary,Backdrop,Thumb",
                StartIndex: startIndex,
                Limit: limit,
                Fields: 'PrimaryImageAspectRatio,SortName',
                SortBy: 'SortName',
                IncludeItemTypes: 'Movie',
                Recursive: true,
                Filters: "IsFavorite"
            });
        }

        if (item.Type === 'Genre' || item.Type === 'GameGenre' || item.Type === 'MusicGenre') {

            return Emby.Models.items({
                StartIndex: startIndex,
                Limit: limit,
                Fields: 'PrimaryImageAspectRatio,SortName',
                SortBy: 'SortName',
                Recursive: true,
                GenreIds: item.Id,
                IncludeItemTypes: item.CollectionType === 'tvshows' ? 'Series' : (item.CollectionType === 'movies' ? 'Movie' : 'MusicAlbum')
            });

        }
        return Emby.Models.children(item, {
            StartIndex: startIndex,
            Limit: limit,
            Fields: 'PrimaryImageAspectRatio,SortName'
        });
    }

    function loadChildren(instance, view, item, loading) {

        instance.listController = new itemsList({

            itemsContainer: view.querySelector('.itemsContainer'),
            getItemsMethod: function (startIndex, limit) {

                return getItems(instance.params, item, startIndex, limit);
            },
            scroller: instance.scroller,
            cardOptions: {
                coverImage: true,
                shape: 'autoVertical',
                showTitle: item.Type !== 'PhotoAlbum',
                showYear: item.Type !== 'PhotoAlbum',
                centerText: true
            }
        });

        instance.listController.render();
    }

    return function (view, params) {

        var self = this;
        self.params = params;
        var currentItem;

        var contentScrollSlider = view.querySelector('.scrollSlider');

        view.addEventListener('viewshow', function (e) {

            var isRestored = e.detail.isRestored;

            if (!isRestored) {
                loading.show();
            }

            Emby.Models.item(params.parentid).then(function (item) {

                setTitle(item);
                currentItem = item;

                if (!isRestored) {
                    createVerticalScroller(self, view, item, loading);

                    if (item.Type !== 'PhotoAlbum') {
                        initAlphaPicker();
                    }
                }

                if (item.Type === 'MusicGenre') {
                    view.querySelector('.listPageButtons').classList.remove('hide');
                } else {
                    view.querySelector('.listPageButtons').classList.add('hide');
                }

                if (playbackManager.canQueue(item)) {
                    view.querySelector('.btnQueue').classList.remove('hide');
                } else {
                    view.querySelector('.btnQueue').classList.add('hide');
                }
            });

            if (!isRestored) {
                view.querySelector('.btnPlay').addEventListener('click', play);
                view.querySelector('.btnQueue').addEventListener('click', queue);
                view.querySelector('.btnInstantMix').addEventListener('click', instantMix);
                view.querySelector('.btnShuffle').addEventListener('click', shuffle);
            }

        });

        function initAlphaPicker() {
            self.alphaPicker = new alphaPicker({
                element: view.querySelector('.alphaPicker'),
                itemsContainer: view.querySelector('.scrollSlider'),
                itemClass: 'card'
            });

            self.alphaPicker.on('alphavaluechanged', onAlphaPickerValueChanged);
        }

        function onAlphaPickerValueChanged() {

            var value = self.alphaPicker.value();

            trySelectValue(value);
        }

        function trySelectValue(value) {

            var card;

            // If it's the symbol just pick the first card
            if (value === '#') {

                card = contentScrollSlider.querySelector('.card');

                if (card) {
                    self.scroller.toStart(card, false);
                    return;
                }
            }

            card = contentScrollSlider.querySelector('.card[data-prefix^=\'' + value + '\']');

            if (card) {
                self.scroller.toStart(card, false);
                return;
            }

            // go to the previous letter
            var values = self.alphaPicker.values();
            var index = values.indexOf(value);

            if (index < values.length - 2) {
                trySelectValue(values[index + 1]);
            } else {
                var all = contentScrollSlider.querySelectorAll('.card');
                card = all.length ? all[all.length - 1] : null;

                if (card) {
                    self.scroller.toStart(card, false);
                }
            }
        }

        function setTitle(item) {

            if (params.type === 'collections') {
                Emby.Page.setTitle(Globalize.translate('Collections'));
            } else if (params.type === 'favoritemovies') {
                Emby.Page.setTitle(Globalize.translate('FavoriteMovies'));
            } else {
                Emby.Page.setTitle(item.Name);
            }
        }

        function play() {

            playbackManager.play({
                items: [currentItem]
            });
        }

        function queue() {

            playbackManager.queue({
                items: [currentItem]
            });
        }

        function instantMix() {
            playbackManager.instantMix(currentItem);
        }

        function shuffle() {
            playbackManager.shuffle(currentItem);
        }

        view.addEventListener('viewdestroy', function () {

            if (self.scroller) {
                self.scroller.destroy();
            }
            if (self.listController) {
                self.listController.destroy();
            }
            if (self.alphaPicker) {
                self.alphaPicker.off('alphavaluechanged', onAlphaPickerValueChanged);
                self.alphaPicker.destroy();
            }
        });
    };

});