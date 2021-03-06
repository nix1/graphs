/**
 * @author Paweł Sierszeń
 */
/*global document*/

(function (document) {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg',
        MARGIN = 30;

    /**
     * Helper for looping through collections.
     * @param {HTMLCollection} collection
     * @param {function} callback
     */
    function forEach(collection, callback) {
        return [].forEach.call(collection, callback);
    }

    /**
     * Series constructor.
     * @param {string} label
     * @constructor
     */
    function Series(label) {
        this.label = label;
        this.data = [];
        this.max = 0;
    }

    /**
     * Add an element to the series.
     * @param {number} element
     */
    Series.prototype.add = function (element) {
        this.max = Math.max(element, this.max);
        this.data.push(element);
    };

    /**
     * Conversion to string.
     * @return {string}
     */
    Series.prototype.toString = function () {
        return this.label;
    };

    /**
     * Returns a color for the series.
     * @param {number} index
     * @return {string}
     */
    Series.color = function (index) {
        var colors = ['#ED6E37', '#259E01', '#15A0C8'];
        return colors[index % 3];
    };

    /**
     * Simplifies creation of SVG lines.
     * @param {object} startPoint
     * @param endPoint
     * @param color
     * @return {SVGLineElement}
     * @constructor
     */
    function Line(startPoint, endPoint, color, width) {
       var line = document.createElementNS(SVG_NS, 'line');

       line.setAttributeNS(null, 'x1', startPoint.x + MARGIN);
       line.setAttributeNS(null, 'x2', endPoint.x + MARGIN);
       line.setAttributeNS(null, 'y1', startPoint.y + MARGIN);
       line.setAttributeNS(null, 'y2', endPoint.y + MARGIN);
       line.setAttributeNS(null, 'stroke', color);
       line.setAttributeNS(null, 'stroke-width', width || 4);
       return line;
    }

    /**
     * Simplifies creation of SVG text.
     * @param {object} point
     * @param endPoint
     * @param color
     * @return {SVGTextElement}
     * @constructor
     */
    function Text(point, content) {
        var text = document.createElementNS(SVG_NS, 'text');

        text.setAttributeNS(null, 'x', point.x + MARGIN);
        text.setAttributeNS(null, 'y', point.y + MARGIN);
        text.setAttributeNS(null, 'font-size', 10);
        text.setAttributeNS(null, 'text-anchor', 'end');
        text.textContent = content;
        return text;
    }

    /**
     * Simplifies creation of SVG circles.
     * @param {object} startPoint
     * @param {string} color
     * @return {SVGCircleElement}
     * @constructor
     */
    function Circle(centerPoint, color) {
        var circle = document.createElementNS(SVG_NS, 'circle');

        circle.setAttributeNS(null, 'cx', centerPoint.x + MARGIN);
        circle.setAttributeNS(null, 'cy', centerPoint.y + MARGIN);
        circle.setAttributeNS(null, 'r',  5);
        circle.setAttributeNS(null, 'fill', color);
        circle.setAttributeNS(null, 'stroke', 'white');
        circle.setAttributeNS(null, 'stroke-width', 3);
        return circle;
    }


    /**
     * Simplifies creation of SVG rectangles.
     * @param {object} point
     * @param {string} color
     * @param {number} offset
     * @return {SVGRectElement}
     * @constructor
     */
    function Rectangle(point, color, offset) {
        var rect = document.createElementNS(SVG_NS, 'rect');

        rect.setAttributeNS(null, 'x', point.x + MARGIN + offset * 7);
        rect.setAttributeNS(null, 'y', point.y + MARGIN);
        rect.setAttributeNS(null, 'width',  5);
        rect.setAttributeNS(null, 'height',  100 - point.y);
        rect.setAttributeNS(null, 'fill', color);
        return rect;
    }

    function BackgroundPolygon() {}
    BackgroundPolygon.prototype = [];
    /**
     *
     * @param {object} point
     * @return {SVGPolygonElement}
     */
    BackgroundPolygon.prototype.use = function (point) {
        var element,
            x = Math.round(point.x);

        if (!this[x]) {
            // Initialize the object at 'x'.
            this[x] = {
                top: point.y,
                bottom: point.y
            };
            return this;
        }

        element = this[x];
        element.top = Math.max(element.top, point.y);
        element.bottom = Math.min(element.bottom, point.y);
    };
    /**
     * Returns the SVG polygon element representing the polygon.
     * @return {SVGPolygonElement}
     */
    BackgroundPolygon.prototype.draw = function () {
        var polygon = document.createElementNS(SVG_NS, 'polygon'),
            points,
            topPoints = [],
            bottomPoints = [];

        for (var x in this) {
            if (!this.hasOwnProperty(x)) {
                continue;
            }
            // We'll first draw the top line from left to right,
            // then the bottom line from right to left.
            topPoints.push({x: x, y: this[x].top});
            bottomPoints.unshift({x: x, y: this[x].bottom});
        }

        // Concatenate and convert to the SVG format.
        points = topPoints
            .concat(bottomPoints)
            .map(function (point) {
                var x = parseFloat(point.x) + MARGIN,
                    y = parseFloat(point.y) + MARGIN;
                return x + ',' + y;
            })
            .join(' ');

        polygon.setAttributeNS(null, 'points', points);
        polygon.setAttributeNS(null, 'fill', '#E7F6FF');
        return polygon;
    };

    /**
     * Extracts data from the element.
     * @param {HTMLTableElement} graph Graph element.
     * @return {object}
     */
    function getData(graph) {
        var labels = [], series = [], max = 0;

        // Read headers.
        forEach(graph.querySelectorAll('thead th'), function (th, colIndex) {
            if (!colIndex) {
                // The first one is not useful.
                return;
            }
            series[colIndex - 1] = new Series(th.innerText);
        });
        // Read data.
        forEach(graph.querySelectorAll('tbody tr'), function (tr, rowIndex) {
            forEach(tr.getElementsByTagName('td'), function (td, colIndex) {
                if (!colIndex) {
                    // The first cell from the left is a row label.
                    labels[rowIndex] = td.innerText;
                    return;
                }
                // Extracting series data.
                // TODO: in a general case should not assume it already exists.
                series[colIndex - 1].add(parseFloat(td.innerText));
            });
        });
        series.forEach(function (series) {
            max = Math.max(max, series.max);
        });
        max = Math.pow(10, Math.floor(max).toString().length); // use proper scale
        return {labels: labels, series: series, max: max};
    }

    function getHeaderContent(caption) {
        var icon = '',
            captionHTML = caption.innerHTML;

        if (captionHTML.indexOf('Revenue') !== -1) {
            icon = '$';
        } else {
            icon = '<div>➡</div>';
        }

        return '<div class="icon">' + icon + '</div>' + captionHTML;
    }
    /**
     * Transforms plain HTML into target markup.
     * @param {HTMLTableElement} graph Graph element.
     */
    function transform(graph) {
        var data = getData(graph),
            container = document.createElement('div'),
            svg = document.createElementNS(SVG_NS, 'svg'),
            graphElements = [],
            backgroundPoly = new BackgroundPolygon(),
            isBarChart = graph.classList.contains('bar'),
            height = 100,
            width = 400;

        // Set svg size to graph size plus some margin.
        svg.setAttributeNS(null, 'height', height + 2*MARGIN);
        svg.setAttributeNS(null, 'width', width + MARGIN);

        // Draw data points and lines.
        data.series.forEach(function (series, seriesIndex) {
            var previousPoint, circles = [], lines = [];
            series.data.forEach(function (number, dataPointIndex) {
                var point = {
                        x: Math.round(60 * (dataPointIndex + 0.5)),
                        y: height - height * number / data.max
                    };

                // Initialize the previous point if not set.
                if (!previousPoint) {
                    previousPoint = {
                        x: 0, y: height - (height - point.y) / 2
                    };
                    // Handle the leftmost values for the polygon.
                    if (!isBarChart) {
                        backgroundPoly.use(previousPoint);
                    }
                }

                // Handle the current value for the polygon.
                if (isBarChart) {
                    graphElements.push(new Rectangle(point, Series.color(seriesIndex), seriesIndex));
                } else {
                    backgroundPoly.use(point);
                    lines.push(new Line(previousPoint, point, Series.color(seriesIndex)));
                    circles.push(new Circle(point, Series.color(seriesIndex)));
                }
                previousPoint = point;
            }); // end foreach data point

            lines.forEach(function (line) {
                graphElements.push(line);
            });
            // Circles will be added later, as need to stay on top of the lines.
            circles.forEach(function (circle) {
                graphElements.push(circle);
            });
        }); // end foreach series

        // Draw the axis
        for (var i = 0; i < 3; i++) {
            svg.appendChild(new Line({x: 0, y: i*height/2}, {x: 60*5, y: i*height/2}, 'black', 1));
            svg.appendChild(new Text({x: -2, y: i*height/2 + 3}, i*data.max/2));
        }

        // Draw the background.
        if (!isBarChart) {
            svg.appendChild(backgroundPoly.draw());
        }

        // Show the legend for data points.
        data.labels.forEach(function (label, i) {
            var x = 60 * (i + 0.5),
                y = height;
            // Label
            svg.appendChild(new Text({x: x - 2, y: y + 15 }, label));
            // Show the exact point
            svg.appendChild(new Line({ x: x, y: y}, { x: x, y: y + 15}, 'black', 1));
        });


        // Add graph elements into the svg.
        graphElements.forEach(function (element) {
            svg.appendChild(element);
        });

        // Show the summary.
        svg.appendChild(new Text({ x: 60*5, y: -10 }, graph.getAttribute('summary')));

        // Set the container class.
        container.className = 'graph';

        container.appendChild(document.createElement('h1'));
        container.appendChild(graph.querySelector('span'));
        container.appendChild(graph.querySelector('button'));
        container.firstChild.innerHTML = getHeaderContent(graph.querySelector('caption'));

        // Add the SVG into the container.
        container.appendChild(svg);

        // Show the legend for series.
        var ul = document.createElement('ul');
        data.series.forEach(function (series, index) {
            var li = document.createElement('li'),
                disc = document.createElement('span');
            disc.innerText = '● ';
            disc.style.color = Series.color(index);
            li.appendChild(disc);
            li.appendChild(document.createTextNode(series.label));
            ul.appendChild(li);
        });
        container.appendChild(ul);

        // Insert the new container just before the old element.
        graph.parentNode.insertBefore(container, graph);

        // Hide the old element.
        graph.style.display = 'none';
    }

    /**
     * Script initialization.
     */
    function init() {
        var graphs = document.querySelectorAll('table.graph');
        forEach(graphs, function (graph) {
            transform(graph);
        });
    }

    // Initialization must wait for DOM.
    document.addEventListener('DOMContentLoaded', init);
})(document);