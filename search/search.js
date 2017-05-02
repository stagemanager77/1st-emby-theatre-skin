define(['loading', 'searchFields', 'searchResults', 'scroller', './../components/focushandler', 'cardBuilder', 'events', 'connectionManager', 'emby-itemscontainer', 'emby-scroller'], function (loading, SearchFields, SearchResults, scroller, focusHandler, cardBuilder, events, connectionManager) {
    'use strict';

    return function (view, params) {

        var self = this;

        function getHeaderElement() {
            return document.querySelector('.skinHeader');
        }

        self.searchFields = new SearchFields({
            element: view.querySelector('.searchFields')
        });

        self.searchResults = new SearchResults({
            element: view.querySelector('.searchResults'),
            serverId: connectionManager.currentApiClient().serverId()
        });

        events.on(self.searchFields, 'search', function (e, value) {
            self.searchResults.search(value);
        });

        view.addEventListener('viewshow', function (e) {

            getHeaderElement().classList.add('searchHeader');

            Emby.Page.setTitle('');
            document.querySelector('.headerSearchButton').classList.add('hide');
        });

        view.addEventListener('viewhide', function () {

            getHeaderElement().classList.remove('searchHeader');

            document.querySelector('.headerSearchButton').classList.remove('hide');
        });

        view.addEventListener('viewdestroy', function () {

            if (self.searchFields) {
                self.searchFields.destroy();
                self.searchFields = null;
            }
            if (self.searchResults) {
                self.searchResults.destroy();
                self.searchResults = null;
            }
        });
    };

});