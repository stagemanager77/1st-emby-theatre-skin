define(['loading', 'backdrop', 'connectionManager', 'scroller', 'globalize', 'require', './../components/focushandler', 'emby-itemscontainer', 'emby-tabs', 'emby-button', 'emby-scroller', 'cardStyle'], function (loading, backdrop, connectionManager, scroller, globalize, require, focusHandler) {
    'use strict';

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
                    depends.push('./suggestions');
                    break;
                case 2:
                    depends.push('./channels');
                    break;
                case 3:
                    depends.push('./recordings');
                    break;
                case 4:
                    depends.push('./schedule');
                    break;
                case 5:
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

        var viewTabs = view.querySelector('.viewTabs');
        var initialTabIndex = parseInt(params.tab || '0');
        var isViewRestored;

        function preLoadTab(page, index) {

            getTabController(page, index, function (controller) {
                if (controller.onBeforeShow) {

                    var refresh = isViewRestored !== true || !controller.refreshed;

                    controller.onBeforeShow({
                        refresh: refresh
                    });

                    controller.refreshed = true;
                }
            });
        }

        function loadTab(page, index) {

            getTabController(page, index, function (controller) {

                controller.onShow({
                    autoFocus: initialTabIndex != null
                });
                initialTabIndex = null;
                currentTabController = controller;
            });
        }

        viewTabs.addEventListener('beforetabchange', function (e) {
            preLoadTab(view, parseInt(e.detail.selectedTabIndex));
        });

        viewTabs.addEventListener('tabchange', function (e) {

            var previousTabController = tabControllers[parseInt(e.detail.previousIndex)];
            if (previousTabController && previousTabController.onHide) {
                previousTabController.onHide();
            }

            loadTab(view, parseInt(e.detail.selectedTabIndex));
        });

        view.addEventListener('viewbeforehide', function (e) {

            if (currentTabController && currentTabController.onHide) {
                currentTabController.onHide();
            }
        });

        view.addEventListener('viewbeforeshow', function (e) {
            isViewRestored = e.detail.isRestored;

            if (initialTabIndex == null) {
                viewTabs.triggerBeforeTabChange();
            }
        });

        view.addEventListener('viewshow', function (e) {

            isViewRestored = e.detail.isRestored;

            Emby.Page.setTitle('');
            backdrop.clear();

            if (initialTabIndex != null) {
                viewTabs.selectedIndex(initialTabIndex);
            } else {
                viewTabs.triggerTabChange();
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