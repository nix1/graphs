/**
 * @author Paweł Sierszeń
 */
/*global document*/

(function (document) {
    'use strict';

    /**
     * Transforms plain HTML into target markup.
     * @param {HTMLTableElement} graph Graph element.
     */
    function transform(graph) {
    }

    /**
     * Script initialization.
     */
    function init() {
        var graphs = document.querySelectorAll('table.graph');
        [].forEach.call(graphs, function (graph) {
            transform(graph);
        });
    }

    // Initialization must wait for DOM.
    document.addEventListener('DOMContentLoaded', init);
})(document);