define(['loading', 'backdrop', 'connectionManager', 'scroller', 'globalize', 'alphaPicker', 'require', './../components/focushandler', 'emby-itemscontainer', 'emby-tabs', 'emby-button'], function (loading, backdrop, connectionManager, scroller, globalize, AlphaPicker, require, focusHandler) {
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
                instance.scroller.toStart(card, false);
                return;
            }
        }

        card = view.querySelector('.card[data-prefix^=\'' + value + '\']');

        if (card) {
            instance.scroller.toStart(card, false);
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
                instance.scroller.toStart(card, false);
            }
        }
    }

    function initAlphaPicker(instance, alphaPickerElement, itemsContainerElement) {

        var alphaPicker = new AlphaPicker({
            element: alphaPickerElement,
            itemsContainer: itemsContainerElement,
            itemClass: 'card'
        });

        alphaPicker.on('alphavaluechanged', function () {
            var value = alphaPicker.value();
            trySelectValue(instance, itemsContainerElement, value);
        });

        instance.alphaPickers.push(alphaPicker);
    }

    function initAlphaPickers(instance, view) {

        var pickers = view.querySelectorAll('.alphaPicker');
        instance.alphaPickers = [];

        for (var i = 0, length = pickers.length; i < length; i++) {

            var itemsContainer = view.querySelector('.tabContent[data-index="' + pickers[i].getAttribute('data-index') + '"] .itemsContainer');

            initAlphaPicker(instance, pickers[i], itemsContainer);
        }
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
                    depends.push('./albums');
                    break;
                case 2:
                    depends.push('./artists');
                    break;
                case 3:
                    depends.push('./artists');
                    break;
                case 4:
                    depends.push('./playlists');
                    break;
                case 5:
                    depends.push('./songs');
                    break;
                case 6:
                    depends.push('./genres');
                    break;
                default:
                    break;
            }

            require(depends, function (controllerFactory) {

                var controller = tabControllers[index];
                if (!controller) {
                    var tabContent = view.querySelector('.tabContent[data-index=\'' + index + '\']');
                    controller = new controllerFactory(tabContent, params, view);
                    if (index === 2) {
                        controller.mode = 'albumartists';
                    }
                    tabControllers[index] = controller;
                }

                callback(controller);
            });
        }

        createVerticalScroller(self, view);

        var alphaPickerContainers = view.querySelectorAll('.alphaPickerContainer');
        var viewTabs = view.querySelector('.viewTabs');
        var initialTabIndex = parseInt(params.tab || '0');
        var isViewRestored;

        function preLoadTab(page, index) {

            for (var i = 0, length = alphaPickerContainers.length; i < length; i++) {
                if (alphaPickerContainers[i].getAttribute('data-index') === index.toString()) {
                    alphaPickerContainers[i].classList.remove('hide');
                } else {
                    alphaPickerContainers[i].classList.add('hide');
                }
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

        initAlphaPickers(this, view);

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

            if (self.scroller) {
                self.scroller.destroy();
                self.scroller = null;
            }

            var alphaPickers = self.alphaPickers || [];
            for (var i = 0, length = alphaPickers.length; i < length; i++) {

                alphaPickers[i].destroy();
            }

            self.alphaPickers = null;
        });
    };

});