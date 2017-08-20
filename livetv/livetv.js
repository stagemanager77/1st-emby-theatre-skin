define(['loading', 'mainTabsManager', 'backdrop', 'connectionManager', 'scroller', 'globalize', 'require', './../components/focushandler', 'emby-itemscontainer', 'emby-tabs', 'emby-button', 'emby-scroller', 'cardStyle'], function (loading, mainTabsManager, backdrop, connectionManager, scroller, globalize, require, focusHandler) {
    'use strict';

    function getTabs() {
        return [
            {
                name: globalize.translate('Programs')
            },
            {
                name: globalize.translate('Channels')
            },
            {
                name: globalize.translate('Recordings')
            },
            {
                name: globalize.translate('Schedule')
            },
            {
                name: globalize.translate('Series')
            }];
    }

    return function (view, params) {

        var self = this;

        var tabControllers = [];
        var currentTabController;

        function getTabController(page, index, callback) {

            var depends = [];

            switch (index) {

                case 0:
                    depends.push('./suggestions');
                    break;
                case 1:
                    depends.push('./channels');
                    break;
                case 2:
                    depends.push('./recordings');
                    break;
                case 3:
                    depends.push('./schedule');
                    break;
                case 4:
                    depends.push('./series');
                    break;
                default:
                    break;
            }

            require(depends, function (controllerFactory) {

                var controller = tabControllers[index];
                if (!controller) {
                    var tabContent = view.querySelector('.tabContent[data-index=\'' + index + '\']');
                    controller = new controllerFactory(tabContent, params, view);
                    tabControllers[index] = controller;
                }

                callback(controller);
            });
        }

        var currentTabIndex = parseInt(params.tab || '0');
        var initialTabIndex = currentTabIndex;
        var isViewRestored;

        function preLoadTab(index) {

            getTabController(view, index, function (controller) {
                if (controller.onBeforeShow) {

                    var refresh = isViewRestored !== true || !controller.refreshed;

                    controller.onBeforeShow({
                        refresh: refresh
                    });

                    controller.refreshed = true;
                }
            });
        }

        function loadTab(index) {

            getTabController(view, index, function (controller) {

                controller.onShow({
                    autoFocus: initialTabIndex != null
                });
                initialTabIndex = null;
                currentTabIndex = index;
                currentTabController = controller;
            });
        }

        function getTabContainers() {
            return view.querySelectorAll('.tabContent');
        }

        function onBeforeTabChange(e) {

            preLoadTab(parseInt(e.detail.selectedTabIndex));
        }

        function onTabChange(e) {
            var newIndex = parseInt(e.detail.selectedTabIndex);
            var previousTabController = tabControllers[newIndex];
            if (previousTabController && previousTabController.onHide) {
                previousTabController.onHide();
            }

            loadTab(newIndex);
        }

        view.addEventListener('viewbeforehide', function (e) {

            if (currentTabController && currentTabController.onHide) {
                currentTabController.onHide();
            }
        });

        view.addEventListener('viewbeforeshow', function (e) {

            isViewRestored = e.detail.isRestored;

            mainTabsManager.setTabs(view, currentTabIndex, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
        });

        view.addEventListener('viewshow', function (e) {

            isViewRestored = e.detail.isRestored;

            Emby.Page.setTitle('');
            backdrop.clear();

            if (!isViewRestored) {
                mainTabsManager.selectedTabIndex(initialTabIndex);
            }
        });

        view.addEventListener('viewdestroy', function (e) {

            tabControllers.forEach(function (t) {
                if (t.destroy) {
                    t.destroy();
                }
            });

            if (self.focusHandler) {
                self.focusHandler.destroy();
                self.focusHandler = null;
            }
        });
    };

});