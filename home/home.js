define(['loading', 'backdrop', 'mainTabsManager', 'connectionManager', 'scroller', 'globalize', 'require', 'emby-itemscontainer', 'emby-tabs', 'emby-button', 'emby-scroller'], function (loading, backdrop, mainTabsManager, connectionManager, scroller, globalize, require) {
    'use strict';

    function getTabs() {
        return [
            {
                name: globalize.translate('Home')
            }];
    }

    return function (view, params) {

        var self = this;

        var tabControllers = [];
        var currentTabController;

        function getTabController(index, callback) {

            if (index == null) {
                throw new Error('index cannot be null');
            }

            var depends = [];

            switch (index) {

                case 0:
                    depends.push('./hometab');
                    break;
                case 1:
                    depends.push('./hometab');
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


        self.scroller = view.querySelector('.scrollFrameY');

        var currentTabIndex = parseInt(params.tab || '0');
        var initialTabIndex = currentTabIndex;
        var isViewRestored;

        function preLoadTab(index) {

            getTabController(index, function (controller) {
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

            getTabController(index, function (controller) {

                controller.onShow({
                    autoFocus: initialTabIndex != null
                });
                initialTabIndex = null;
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

            Emby.Page.setTitle(null);
            isViewRestored = e.detail.isRestored;

            mainTabsManager.setTabs(view, currentTabIndex, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
        });

        view.addEventListener('viewshow', function (e) {

            isViewRestored = e.detail.isRestored;

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

            self.scroller = null;
        });
    };

});