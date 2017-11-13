define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",

    "dojo/text!DThreeRadialTree/widget/template/DThreeRadialTree.html",
    "DThreeRadialTree/widget/lib/d3/d3"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, widgetTemplate, d3) {
    "use strict";

    return declare("DThreeRadialTree.widget.DThreeRadialTree", [_WidgetBase, _TemplatedMixin], {

        templateString: widgetTemplate,

        widgetBase: null,

        // modeler variables.
        dataEntity: null,
        ctxEntity: null,
        primaryKeyAttr: null,
        foreignKeyAttr: null,
        enumAttr: null,
        enumImageMapping: null,
        editForm: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,

        //dummy 
        __jsonTestData: [{
                "email": "company.com",
                "fullName": "company.com",
                "isCEO": true,
                "manager": "",
                "icon": "ok"
            }, {
                "email": "andreas.schultz@company.com",
                "fullName": "Andreas Schultz",
                "isCEO": true,
                "manager": "company.com",
                "icon": "ok"
            },
            {
                "email": "albert.li@company.com",
                "fullName": "Albert Li",
                "isCEO": false,
                "manager": "andreas.schultz@company.com",
                "icon": "ok"
            },
            {
                "email": "amy.jones@company.com",
                "fullName": "Amy Jones",
                "isCEO": false,
                "manager": "andreas.schultz@company.com",
                "icon": "ok"
            }
        ],

        constructor: function() {
            this._handles = [];
        },

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
        },

        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            this._contextObj = obj;
            this._gatherData()
                .then(lang.hitch(this, function(data) {
                    this.__drawGraph(data);
                    this._updateRendering(callback);
                }));

            // this.__drawGraph(this.__jsonTestData);

        },

        __drawGraph: function(__drawGraph) {

            var originalName;
            var originalEmal;
            var originalManagerEmail;
            var originalMessage;
            var nodeRadius = 4;
            var labelSize = 10;
            var textDistancePositive = 10;
            var textDistanceNegitive = -10;
            var treeSize = 680;
            var toolTipSize = '10px';
            var nodeSize = 16;
            var selectedNode;

            var margin = { top: 40, right: 100, bottom: 0, left: 100 },
                width = window.innerWidth - margin.left - margin.right,
                height = window.innerHeight - margin.top - margin.bottom;

            var tree = d3.tree()
                .size([2 * Math.PI, treeSize])
                .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

            var stratify = d3.stratify()
                .parentId((d) => { return d['manager'] })
                .id((d) => { return d['email'] })

            var root = tree(stratify(__drawGraph));

            var svg = d3.select(this.domNode).append('svg').attr('width', width).attr('height', height)
            var toolTip = d3.select('body').append('div');
            toolTip.attr('id', 'tooltip')

            var defs = svg.append("defs");
            var filter = defs.append("filter")
                .attr("id", "drop-shadow")
                .attr("height", "130%");

            filter.append("feGaussianBlur")
                .attr("in", "SourceAlpha")
                .attr("stdDeviation", 2)
                .attr("result", "blur");

            filter.append("feOffset")
                .attr("in", "blur")
                .attr("dx", 1)
                .attr("dy", 2)
                .attr("result", "offsetBlur");

            var feMerge = filter.append("feMerge");
            feMerge.append("feMergeNode")
                .attr("in", "offsetBlur")
            feMerge.append("feMergeNode")
                .attr("in", "SourceGraphic");

            // width = +svg.attr("width"),
            // height = +svg.attr("height"),
            // g = svg.append("g").attr("transform", "translate(" + (width / 2 + 40) + "," + (height / 2 + 90) + ")");
            var g = svg.append("g").attr("transform", "translate(" + (width / 2) + "," + (height / 2 + 5) + ")");

            var link = g.selectAll(".link")
                .data(root.links())
                .enter().append("path")
                .attr("class", "link")
                .attr("d", d3.linkRadial()
                    .angle(function(d) { return d.x; })
                    .radius(function(d) { return d.y; }));

            var node = g.selectAll(".node")
                .data(root.descendants())
                .enter().append("g")
                .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
                .attr("transform", function(d) { return "translate(" + radialPoint(d.x, d.y) + ")"; })
                .attr('cursor', 'pointer');

            node.append("circle")
                .attr("r", (d) => {
                    return nodeRadius;
                })
                .attr('fill', nodeColor)
                .attr('stroke', (d) => { return '#000000' })
                .attr("x", (d) => {
                    if (d.data['Message'] !== '') {
                        return -12;
                    } else {
                        return -8;
                    }

                })
                .attr("y", (d) => {
                    if (d.data['Message'] !== '') {
                        return -12;
                    } else {
                        return -8;
                    }
                })
                .attr("width", nodeSize)
                .attr("height", nodeSize)

            node.append("text")
                .attr("dy", "0.31em")
                .attr("x", function(d) { return d.x < Math.PI === !d.children ? textDistancePositive : textDistanceNegitive; })
                .attr("text-anchor", function(d) { return d.x < Math.PI === !d.children ? "start" : "end"; })
                .attr("transform", function(d) { return "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")"; })
                //.text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1); });
                .text(function(d) { return d.data['Full Name'] })
                .attr('visibility', 'hidden')
                .style('font-size', (d) => { return labelSize; })
                //.attr('fill', '#000000')
                .exit().remove();

            function radialPoint(x, y) {
                return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
            }

            function nodeColor(d) {

                switch (d.data['message']) {
                    case 'Do not participate':
                        return '#D8D8D8';
                        break;
                    case 'Warning':
                        return '#E87408';
                        break;
                    default:
                        return '#000000';
                }
                if (d.data['message']) {
                    return '#FADF0A';
                }
            }
        },

        /**
         * Gather Data (ASYNC)
         * ---
         * Gathers the needed data to render the tree.
         * @return {Promise} - Resolve with an array of JSON objects containing the data for the hierarchy
         */
        _gatherData: function() {
            return new Promise(lang.hitch(this, function(resolve, reject) {
                // 1. Fetch the entities to be used as the nodes
                this._fetchEntities()
                    .then(lang.hitch(this, function(mxObjects) {
                        var includedNodes = this._cleanUpData(mxObjects),
                            chartObjs = this._mapToChartObjects(includedNodes);
                        resolve(chartObjs)
                    }))
            }));
        },

        _cleanUpData: function(mxObjects) {
            // return new Promise(lang.hitch(this, function(resolve) {
            this._setCEOAsRoot(mxObjects);
            var sortedMxObjects = this._sortMxObjects(mxObjects, "OrgLayer"),
                include = this._getValidMxObjects(sortedMxObjects);
            return (include);
            // }));
        },

        /**
         * Fetch Entities
         * ---
         * @returns {Promise} - Resolves with a list of MxObjects
         */
        _fetchEntities: function() {
            return new Promise(lang.hitch(this, function(resolve, reject) {
                var entity = this.dataEntity,
                    assn = this.ctxEntity.split("/")[0];
                mx.data.get({
                    xpath: "//" + entity + "[" + assn + "=" + this._contextObj.getGuid() + "]",
                    callback: function(res) {
                        resolve(res);
                    },
                    error: function(err) {
                        reject(err);
                    }
                });
            }));
        },

        /**
         * Map to Chart Objects
         * ---
         * @returns {Array: Objects} - the objects for the D3 Tree
         */
        _mapToChartObjects: function(mxObjects) {
            // return new Promise(lang.hitch(this, function(resolve, reject) {
            // 3. map to chart objects
            return mxObjects.map(lang.hitch(this, function(mxobj) {
                return {
                    "email": mxobj.get(this.primaryKeyAttr),
                    "fullName": mxobj.get("FullName"),
                    // "isCEO": false,
                    "manager": mxobj.get(this.foreignKeyAttr),
                    "icon": "ok",
                    "orgLayer": mxobj.get("OrgLayer")
                }
            }));
            // }));
        },

        /**
         * Get Valid Mx Objects
         * ---
         * Checks to see if `OrgLayer`, `Orphan` are set
         * Checks to see if the new object is a duplicate
         * @param {Array} mxObjects - list of mxobjects, sorted by ascending org layer.
         * @returns {Array : MxObject} - list of mxObjects to include in the tree.
         */
        _getValidMxObjects: function(mxObjects) {
            // 2b. Check only include nodes with parents
            var include = [];
            mxObjects.forEach(lang.hitch(this, function(mxObj) {
                // is `mxObj` valid?
                if (!mxObj.get("OrgLayer") || mxObj.get("Orphan") || this._isDuplicate(mxObj, include)) return;
                // does the parent of `mxObj` exist?
                var parent = include.find(lang.hitch(this, function(parentObj) {
                    return (parentObj.get("OrgLayer") * 1 === mxObj.get("OrgLayer") * 1 - 1) &&
                        parentObj.get(this.primaryKeyAttr) === mxObj.get(this.foreignKeyAttr)
                }))
                if (parent || mxObj.get("OrgLayer") * 1 === 0) {
                    include.push(mxObj);
                }
            }));
            return include;
        },

        /**
         * Sort MxObjects
         * ---
         * @param {Array::MxObjects} mxObjects - The Obejcts to sort
         * @param {String} field - the name of the field on which to sort
         */
        _sortMxObjects: function(mxObjects, field) {
            // 2a. sort in ascending org layer order
            return mxObjects.sort(function(a, b) {
                if (a.get(field) < b.get(field)) {
                    return -1
                } else if (a.get(field) > b.get(field)) {
                    return 1
                } else {
                    return 0;
                }
            });
        },

        /**
         * Set CEO as Root
         * ---
         * @param {Array::MxObject} mxObjects - Array of Objects, with one CEO to set as root.
         * @todo Error Handling - if more than one CEO
         */
        _setCEOAsRoot: function(mxObjects) {
            // 1. Set the CEO to not have a manager
            var ceo = mxObjects.find(lang.hitch(this, function(mxobj) {
                return mxobj.get("CEO")
            }));
            ceo.set(this.foreignKeyAttr, "");
        },

        /**
         * Check to see if this Node exists already
         * @param {MxObject} mxObj - the mxobj to check for
         * @param {Array::MxObject} includedObjs - the list to check int
         * @return {Boolean} - if the node would be a duplicate
         */
        _isDuplicate: function(mxObj, includedObjs) {
            var existing = includedObjs.find(lang.hitch(this, function(obj) {
                return obj.get(this.primaryKeyAttr) === mxObj.get(this.primaryKeyAttr)
            }))
            return !!existing;
        },

        resize: function(box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function() {
            logger.debug(this.id + ".uninitialize");
        },

        _updateRendering: function(callback) {
            logger.debug(this.id + "._updateRendering");

            if (this._contextObj !== null) {
                dojoStyle.set(this.domNode, "display", "block");
            } else {
                dojoStyle.set(this.domNode, "display", "none");
            }

            this._executeCallback(callback);
        },

        _executeCallback: function(cb) {
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["DThreeRadialTree/widget/DThreeRadialTree"]);
