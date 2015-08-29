/**
 * @author Paweł Sierszeń
 */
/*global document*/

(function (document) {
    'use strict';

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
    }

    /**
     * Add an element to the series.
     * @param {number} element
     */
    Series.prototype.add = function (element) {
        this.data.push(element);
    };

    /**
     * Conversion to string.
     * @returns {string}
     */
    Series.prototype.toString = function () {
        return this.label;
    };


    /**
     * Extracts data from the element.
     * @param {HTMLTableElement} graph Graph element.
     * @return {object}
     */
    function getData(graph) {
        var labels = [], series = [];

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
        return {labels: labels, series: series};
    }

    /**
     * Transforms plain HTML into target markup.
     * @param {HTMLTableElement} graph Graph element.
     */
    function transform(graph) {
        var data = getData(graph);
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