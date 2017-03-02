define(['loading', 'backdrop', 'connectionManager', 'scroller', 'globalize', 'alphaPicker', 'require', './../components/focushandler', 'emby-itemscontainer', 'emby-tabs', 'emby-button'], function (loading, backdrop, connectionManager, scroller, globalize, alphaPicker, require, focusHandler) {
    'use strict';

    function createVerticalScroller(instance, view) {

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

        instance.focusHandler = new focusHandler({
            parent: view.querySelector('.scrollSlider'),
            scroller: instance.scroller,
            enableBackdrops: false
        });
    }

    function trySelectValue(instance, view, value) {

        var card;

        // If it's the symbol just pick the first card
        if (value === '#') {

            card = view.querySelector('.card');

            if (card) {
                instance.scroller.toCenter(card, false);
                return;
            }
        }

        card = view.querySelector('.card[data-prefix^=\'' + value + '\']');

        if (card) {
            instance.scroller.toCenter(card, false);
            return;
        }

        // go to the previous letter
        var values = instance.alphaPicker.values();
        var index = values.indexOf(value);

        if (index < values.length - 2) {
            trySelectValue(instance, view, values[index + 1]);
        } else {
            var all = view.querySelectorAll('.card');
            card = all.length ? all[all.length - 1] : null;

            if (card) {
                instance.scroller.toCenter(card, false);
            }
        }
    }

    function initAlphaPicker(instance, view) {

        var seriesItemsContainer = view.querySelector('.seriesItems');

        instance.alphaPicker = new alphaPicker({
            element: view.querySelector('.alphaPicker'),
            itemsContainer: seriesItemsContainer,
            itemClass: 'card'
        });

        instance.alphaPicker.on('alphavaluechanged', function () {
            var value = instance.alphaPicker.value();
            trySelectValue(instance, seriesItemsContainer, value);
        });
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
                    depends.push('./series');
                    break;
                case 2:
                    depends.push('./upcoming');
                    break;
                case 3:
                    depends.push('./favorites');
                    break;
                case 4:
                    depends.push('./genres');
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

        createVerticalScroller(self, view);

        var alphaPickerContainer = view.querySelector('.alphaPickerContainer');
        var viewTabs = view.querySelector('.viewTabs');
        var initialTabIndex = parseInt(params.tab || '0');
        var isViewRestored;

        function preLoadTab(page, index) {

            if (index === 1) {
                alphaPickerContainer.classList.remove('hide');
            } else {
                alphaPickerContainer.classList.add('hide');
            }

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

        initAlphaPicker(this, view);

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

            if (self.scroller) {
                self.scroller.destroy();
                self.scroller = null;
            }

            if (self.alphaPicker) {
                self.alphaPicker.destroy();
                self.alphaPicker = null;
            }
        });
    };

});