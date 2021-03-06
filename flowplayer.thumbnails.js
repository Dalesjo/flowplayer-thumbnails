/*jslint browser: true, node: true */
/*global window */

/*!

   Thumbnail image plugin for Flowplayer HTML5

   Copyright (c) 2015-2017, Flowplayer Drive Oy

   Released under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   requires:
   - Flowplayer HTML5 version 6.x or greater
   revision: $GIT_ID$

*/
(function () {
    "use strict";
    var extension = function (flowplayer) {

        flowplayer(function (api, root) {
            var common = flowplayer.common,
                bean = flowplayer.bean,
                support = flowplayer.support,
                timeline = common.find('.fp-timeline', root)[0],
                timelineTooltip = common.find('.fp-time' + (flowplayer.version.indexOf('6.') === 0
                    ? 'line-tooltip'
                    : 'stamp'), root)[0];

            if (support.touch || !support.inlineVideo) {
                return;
            }

            api.on('ready', function (_ev, a, video) {
                // cleanup
                bean.off(root, '.thumbnails');
                common.css(timelineTooltip, {
                    width: '',
                    height: '',
                    'background-image': '',
                    'background-repeat': '',
                    'background-size': '',
                    'background-position': '',
                    'border': '',
                    'text-shadow': ''
                });

                var c = flowplayer.extend({}, a.conf.thumbnails, video.thumbnails);

                if (!c.template) {
                    return;
                }

                var height = c.height || 80,
                    interval = c.interval || 1,
                    template = c.template,
                    live = c.live || false,
                    timeframe = c.timeframe || 60,
                    time_format = c.time_format || function (t) {
                        return t;
                    },
                    startIndex = typeof c.startIndex === 'number'
                        ? c.startIndex
                        : 1,
                    thumb = c.lazyload !== false
                        ? new Image()
                        : null,
                    engine = common.find('.fp-engine', root)[0],
                    ratio = (video.height || common.height(engine)) / (video.width || common.width(engine)),
                    preloadImages = function (max, start) {
                        max = Math.floor(max / interval + start);
                        function load() {
                            if (start > max) {
                                return;
                            }
                            var img = new Image();
                            img.src = template.replace('{time}', time_format(start));
                            img.onload = function () {
                                start += 1;
                                load();
                            };
                        }
                        load();
                    };

                if (c.preload && c.live === false) {
                    preloadImages(video.duration, startIndex);
                }

                bean.on(root, 'mousemove.thumbnails', '.fp-timeline', function (ev) {
                    var x = ev.pageX || ev.clientX,
                        delta = x - common.offset(timeline).left,
                        percentage = delta / common.width(timeline),
                        seconds = Math.round(percentage * api.video.duration),
                        url,
                        displayThumb = function () {
                            common.css(timelineTooltip, {
                                width: (height / ratio) + 'px',
                                height: height + 'px',
                                'background-image': "url('" + url + "')",
                                'background-repeat': 'no-repeat',
                                'background-size': 'cover',
                                'background-position': 'center',
                                'border': '1px solid #333',
                                'text-shadow': '1px 1px #000'
                            });
                        };

                    // 2nd condition safeguards at out of range retrieval attempts
                    if (seconds < 0 || seconds > Math.round(api.video.duration)) {
                        return;
                    }

                    // enables greater interval than one second between thumbnails
                    seconds = Math.floor(seconds / interval);
                    seconds += startIndex;

                    if(c.live) {
                      seconds += (Date.now()/1000);
                      seconds -= api.video.duration;


                      var time = new Date(seconds*1000);
                      common.html(timelineTooltip,("0" + time.getHours()).slice(-2)   + ":" +
                                      ("0" + time.getMinutes()).slice(-2) + ":" +
                                      ("0" + time.getSeconds()).slice(-2));

                      seconds -= seconds % timeframe;
                    }

                    // {time} template expected to start at 1, video time/first frame starts at 0
                    url = template.replace('{time}', time_format(seconds));

                    if (c.lazyload !== false) {
                        thumb.src = url;
                        bean.on(thumb, 'load', displayThumb);
                    } else {
                        displayThumb();
                    }
                });
            });

        });
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = extension;
    } else if (window.flowplayer) {
        extension(window.flowplayer);
    }
}());
