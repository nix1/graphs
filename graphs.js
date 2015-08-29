/**
 * @author Paweł Sierszeń
 */
/*global document*/

(function (document) {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg';

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
     * @returns {string}
     */
    Series.prototype.toString = function () {
        return this.label;
    };

    Series.color = function (index) {
        var colors = ['#ED6E37', '#259E01', '#15A0C8'];
        return colors[index % 3];
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
        return {labels: labels, series: series, max: max};
    }

    /**
     * Transforms plain HTML into target markup.
     * @param {HTMLTableElement} graph Graph element.
     */
    function transform(graph) {
        var data = getData(graph),
            container = document.createElement('div'),
            svg = document.createElementNS(SVG_NS, 'svg'),
            height = 100,
            margin = 50,
            width = 400;

        // Set svg size to graph size plus some margin.
        svg.setAttributeNS(null, 'height', height + margin);
        svg.setAttributeNS(null, 'width', width + margin);

        // Draw data points and lines.
        data.series.forEach(function (series, seriesIndex) {
            var previousPoint, circles = [];
            series.data.forEach(function (number, dataPointIndex) {
                var circle = document.createElementNS(SVG_NS, 'circle'),
                    line = document.createElementNS(SVG_NS, 'line'),
                    point = {
                        x: 60 * (dataPointIndex + 0.5),
                        y: height - height * number / data.max
                    };

                // Initialize the previous point if not set.
                previousPoint = previousPoint || {
                    x: 0, y: height - (height - point.y) / 2
                    };

                line.setAttributeNS(null, 'x1', previousPoint.x + margin);
                line.setAttributeNS(null, 'x2', point.x + margin);
                line.setAttributeNS(null, 'y1', previousPoint.y + margin);
                line.setAttributeNS(null, 'y2', point.y + margin);
                line.setAttributeNS(null, 'stroke', Series.color(seriesIndex));
                line.setAttributeNS(null, 'stroke-width', 4);

                svg.appendChild(line);

                circle.setAttributeNS(null, 'cx', point.x + margin);
                circle.setAttributeNS(null, 'cy', point.y + margin);
                circle.setAttributeNS(null, 'r',  5);
                circle.setAttributeNS(null, 'fill', Series.color(seriesIndex));
                circle.setAttributeNS(null, 'stroke', 'white');
                circle.setAttributeNS(null, 'stroke-width', 3);
                circles.push(circle);
                previousPoint = point;
            });
            // Adding circles must be delayed, as they need
            // to stay on top of the lines.
            circles.forEach(function (circle) {
                svg.appendChild(circle);
            });
        });

        // Set the container class.
        container.className = 'graph';

        // Add the SVG into the container.
        container.appendChild(svg);

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