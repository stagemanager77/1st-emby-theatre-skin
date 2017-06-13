define(['globalize', 'loading', 'scroller', 'playbackManager', 'connectionManager', 'cardBuilder', 'focusManager', 'emby-itemscontainer', 'emby-scroller'], function (globalize, loading, scroller, playbackManager, connectionManager, cardBuilder, focusManager) {
    'use strict';

    function setTitleInternal(title) {
        Emby.Page.setTitle(title);
    }

    function setTitle(params) {

        if (params.type === 'Recordings') {

            if (params.IsMovie === 'true') {
                setTitleInternal(globalize.translate('Movies'));
            } else if (params.IsSports === 'true') {
                setTitleInternal(globalize.translate('Sports'));
            } else if (params.IsKids === 'true') {
                setTitleInternal(globalize.translate('HeaderForKids'));
            } else {
                setTitleInternal(globalize.translate('Recordings'));
            }

        } else if (params.type === 'RecordingSeries') {

            setTitleInternal(globalize.translate('Shows'));
        } else {

            if (params.IsMovie === 'true') {
                setTitleInternal(globalize.translate('Movies'));
            } else if (params.IsSports === 'true') {
                setTitleInternal(globalize.translate('Sports'));
            } else if (params.IsKids === 'true') {
                setTitleInternal(globalize.translate('HeaderForKids'));
            } else if (params.IsAiring === 'true') {
                setTitleInternal(globalize.translate('HeaderOnNow'));
            } else if (params.IsSeries === 'true') {
                setTitleInternal(globalize.translate('Shows'));
            } else {
                setTitleInternal(globalize.translate('Programs'));
            }
        }

    }

    function getPromise(query, params) {

        var apiClient = connectionManager.getApiClient(params.serverId);

        var promise = params.type === 'Recordings' ?
            apiClient.getLiveTvRecordings(query) :
            params.type === 'RecordingSeries' ?
            apiClient.getLiveTvRecordingSeries(query) :
            params.IsAiring === 'true' ?
            apiClient.getLiveTvRecommendedPrograms(query) :
            apiClient.getLiveTvPrograms(query);

        return promise;
    }

    function getInitialQuery(params) {

        var query = {
            UserId: connectionManager.getApiClient(params.serverId).getCurrentUserId(),
            StartIndex: 0,
            Fields: "ChannelInfo,PrimaryImageAspectRatio",
            Limit: 300
        };

        if (params.type === 'Recordings') {
            query.IsInProgress = false;

            if (params.groupid) {
                query.GroupId = params.groupid;
            }

        } else if (params.type === 'RecordingSeries') {
            query.SortOrder = 'SortName';
            query.SortOrder = 'Ascending';
        } else {
            query.HasAired = false;
            query.SortBy = 'StartDate,SortName';
            query.SortOrder = 'Ascending';
        }

        if (params.IsMovie === 'true') {
            query.IsMovie = true;
        }
        else if (params.IsMovie === 'false') {
            query.IsMovie = false;
        }
        if (params.IsSeries === 'true') {
            query.IsSeries = true;
        }
        else if (params.IsSeries === 'false') {
            query.IsSeries = false;
        }
        if (params.IsNews === 'true') {
            query.IsNews = true;
        }
        else if (params.IsNews === 'false') {
            query.IsNews = false;
        }
        if (params.IsSports === 'true') {
            query.IsSports = true;
        }
        else if (params.IsSports === 'false') {
            query.IsSports = false;
        }
        if (params.IsKids === 'true') {
            query.IsKids = true;
        }
        else if (params.IsKids === 'false') {
            query.IsKids = false;
        }
        if (params.IsAiring === 'true') {
            query.IsAiring = true;
        }
        else if (params.IsAiring === 'false') {
            query.IsAiring = false;
        }

        return query;
    }

    return function (view, params) {

        var self = this;
        var query = getInitialQuery(params);

        var dataPromise;

        view.addEventListener('viewbeforeshow', function () {
            setTitle(params);

            dataPromise = getPromise(query, params);
        });

        function finishDataLoad() {

            dataPromise.then(function (result) {

                var itemsContainer = view.querySelector('.itemsContainer');

                cardBuilder.buildCards(result.Items, {
                    itemsContainer: itemsContainer,
                    shape: query.IsMovie || params.type === 'RecordingSeries' ? 'portrait' : "auto",
                    preferThumb: query.IsMovie || params.type === 'RecordingSeries' ? false : "auto",
                    defaultShape: query.IsMovie || params.type === 'RecordingSeries' ? 'portrait' : "backdrop",
                    inheritThumb: params.type === 'Recordings',
                    context: 'livetv',
                    centerText: true,
                    overlayText: false,
                    showTitle: true,
                    showParentTitle: !query.IsMovie,
                    showAirTime: params.type !== 'Recordings' && params.type !== 'RecordingSeries',
                    showAirDateTime: params.type !== 'Recordings' && params.type !== 'RecordingSeries',
                    //showChannelName: params.type !== 'Recordings' && params.type != 'RecordingSeries',
                    overlayMoreButton: true,
                    showYear: query.IsMovie && params.type === 'Recordings',
                    showSeriesYear: params.type === 'RecordingSeries',
                    coverImage: true
                });

                focusManager.autoFocus(itemsContainer);
            });
        }

        view.addEventListener('viewshow', function () {
            finishDataLoad();
        });
    };

});