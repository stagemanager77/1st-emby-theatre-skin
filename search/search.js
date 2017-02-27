define(['browser', 'loading', 'alphaPicker', 'scroller', './../components/focushandler', 'cardBuilder', 'connectionManager', 'emby-itemscontainer', 'emby-scroller'], function (browser, loading, alphaPicker, scroller, focusHandler, cardBuilder, connectionManager) {
    'use strict';

    function isWhitespace(userText) {
        userText = userText.replace(/^\s+/, '').replace(/\s+$/, '');
        if (userText === '') {
            return true;
        } else {
            // text has real content, now free of leading/trailing whitespace
            return false;
        }
    }

    return function (view, params) {

        var self = this;

        if (browser.tizen || browser.orsay) {
            view.querySelector('.txtSearch').readOnly = true;
        }

        function onAlphaValueClicked(e) {

            var value = e.detail.value;

            var txtSearch = view.querySelector('.txtSearch');

            if (value === 'backspace') {

                var val = txtSearch.value;
                txtSearch.value = val.length ? val.substring(0, val.length - 1) : '';

            } else {
                txtSearch.value += value;
            }

            search(txtSearch.value);
        }

        function search(value) {

            if (!value || isWhitespace(value)) {
                var emptyResult = {
                    SearchHints: []
                };
                populateResults(emptyResult, '.peopleResults');
                populateResults(emptyResult, '.programResults');
                populateResults(emptyResult, '.seriesResults');
                populateResults(emptyResult, '.episodeResults');
                populateResults(emptyResult, '.movieResults');
                populateResults(emptyResult, '.artistResults');
                populateResults(emptyResult, '.albumResults');
                populateResults(emptyResult, '.songResults');
                populateResults(emptyResult, '.bookResults');
                populateResults(emptyResult, '.audioBookResults');
                return;
            }

            searchType(value, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: "Movie"

            }, '.movieResults');

            searchType(value, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: "LiveTvProgram"

            }, '.programResults', {
                
                showTitle: true,
                showParentTitle: true,
                overlayText: false,
                centerText: true

            });

            searchType(value, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: "Series"

            }, '.seriesResults');

            searchType(value, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: "Episode"

            }, '.episodeResults', {

                coverImage: true,
                showTitle: true,
                showParentTitle: true
            });

            searchType(value, {
                searchTerm: value,
                IncludePeople: true,
                IncludeMedia: false,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false

            }, '.peopleResults', {

                coverImage: true,
                showTitle: true
            });

            searchType(value, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: false,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: true

            }, '.artistResults', {
                coverImage: true,
                showTitle: true
            });

            searchType(value, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: "MusicAlbum"

            }, '.albumResults');

            searchType(value, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: "Audio"

            }, '.songResults', {
                action: 'play'
            });

            searchType(value, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: "Book"

            }, '.bookResults');

            searchType(value, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: "AudioBook"

            }, '.audioBookResults');
        }

        function getSearchResults(options) {

            var apiClient = connectionManager.currentApiClient();

            options.UserId = apiClient.getCurrentUserId();

            return apiClient.getSearchHints(options);
        }

        function searchType(value, query, section, cardOptions) {

            query.Limit = 24;

            getSearchResults(query).then(function (result) {

                populateResults(result, section, cardOptions);

            });
        }

        function populateResults(result, section, cardOptions) {

            section = view.querySelector(section);

            var items = result.SearchHints;

            var itemsContainer = section.querySelector('.itemsContainer');

            cardBuilder.buildCards(items, Object.assign({
                
                itemsContainer: itemsContainer,
                parentContainer: section,
                shape: 'autooverflow',
                scalable: true,
                overlayText: true,
                widths: {
                    portrait: 340,
                    thumb: 500,
                    square: 340
                }

            }, cardOptions|| {}));

            section.querySelector('.emby-scroller').scrollToBeginning(true);
        }

        function initAlphaPicker(view) {

            var alphaPickerElement = view.querySelector('.alphaPicker');

            self.alphaPicker = new alphaPicker({
                element: alphaPickerElement,
                mode: 'keyboard'
            });

            alphaPickerElement.addEventListener('alphavalueclicked', onAlphaValueClicked);
        }

        function initFocusHandler(view) {

            self.focusHandler = new focusHandler({
                parent: view,
                enableBackdrops: false
            });
        }

        var searchTimeout;

        function searchOnTimeout() {

            if (searchTimeout) {
                clearTimeout(searchTimeout);
                searchTimeout = null;
            }

            searchTimeout = setTimeout(onSearchTimeout, 300);
        }

        function onSearchTimeout() {
            search(view.querySelector('.txtSearch').value);
        }

        var lastKeyDownValue = '';

        function onSearchKeyPress(e) {

            var value = e.target.value;

            if (value !== lastKeyDownValue) {
                lastKeyDownValue = value;
                searchOnTimeout();
            }
        }

        function getHeaderElement() {
            return document.querySelector('.skinHeader');
        }

        view.addEventListener('viewshow', function (e) {

            getHeaderElement().classList.add('searchHeader');

            Emby.Page.setTitle('');
            document.querySelector('.headerSearchButton').classList.add('hide');

            var isRestored = e.detail.isRestored;

            if (!isRestored) {
                initAlphaPicker(e.target);
                initFocusHandler(e.target);

                e.target.querySelector('.txtSearch').addEventListener('keyup', onSearchKeyPress);
            }
        });

        view.addEventListener('viewhide', function () {

            getHeaderElement().classList.remove('searchHeader');

            document.querySelector('.headerSearchButton').classList.remove('hide');
        });

        view.addEventListener('viewdestroy', function () {

            if (self.alphaPicker) {
                self.alphaPicker.destroy();
                self.alphaPicker = null;
            }
            if (self.focusHandler) {
                self.focusHandler.destroy();
                self.focusHandler = null;
            }
        });
    };

});