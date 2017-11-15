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
        // data source
        dataEntity: null,
        ctxEntity: null,
        primaryKeyAttr: null,
        foreignKeyAttr: null,
        dataMicroflow: null,
        orgLayerRankAttr: null,
        // appearance
        enumAttr: null,
        enumImageMapping: null,
        nodeSize: null,
        nodeLabelAttr: null,
        nodeShowLabelAttr: null,
        nodeFocusAttr: null,
        nodeFocusClass: null,
        // behavior
        onClickMicroflow: null,
        editForm: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,
        _totalErrors: null,
        _errorState: null,
        _imageHelper: null,
        _scaleFactor: 1,

        constructor: function() {
            this._handles = [];
            this._totalErrors = {};
            this._imageHelper = {};
        },

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            // setup enumimagemapping
            console.log(this.enumImageMapping);
            this.enumImageMapping.forEach(lang.hitch(this, function(keyImagePair) {
                this._imageHelper[keyImagePair.enumKey] = mx.appUrl + keyImagePair.image;
            }));
        },

        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            this._errorState = null;
            this._contextObj = obj;
            this._gatherDataAndDrawGraph(callback);
        },

        /**
         * Get Image URL
         * ---
         * @param {String} key - the enum value that has been mapped to an image. Should be
         * the value of mxobj.get(this.enumAttr);
         * @returns {String} - the image URL
         */
        _getImageUrl: function(key) {
            return this._imageHelper[key];
        },

        /**
         * Gather Data and Graw Draph
         * ---
         * Where the magic happens
         * 1. Gather Data
         * 2. Draw the graph
         * 3. Finish the update (subscriptions and callback)
         */
        _gatherDataAndDrawGraph: function(callback) {
            this._totalErrors = {}; //reset
            this._gatherData()
                .then(lang.hitch(this, function(data) {
                    this._treeNodes = data;
                    this.__drawGraph();
                    console.debug("===== EXCLUSION SUMMARY =====");
                    var total = 0;
                    for (var key in this._totalErrors) {
                        console.debug("" + this._totalErrors[key] + " total exclusions because --> " + key);
                        total += this._totalErrors[key];
                    }
                    console.debug("== Total: " + total + " exclusions ==");
                    this._finishUpdate(callback);
                }))
                .catch(lang.hitch(this, function(err) {
                    console.error("ERROR OCCURRED: " + (this._errorState || err.message));
                    this._finishUpdate(callback);
                }));
        },

        /**
         * On Finally
         */
        _finishUpdate: function(callback) {
            this._resetSubscriptions();
            this._updateRendering(callback);
        },

        /**
         * Reset Subscriptions
         * ---
         * Subscribe to the Context object for changes
         */
        _resetSubscriptions: function() {
            this.unsubscribeAll();
            this.subscribe({
                guid: this._contextObj.getGuid(),
                callback: lang.hitch(this, function(guid) {
                    this._gatherDataAndDrawGraph();
                })
            });
        },

        __drawGraph: function() {
            var __drawGraph = this._treeNodes;
            // this.domNode.innerHTML = "";
            var theWidget = this;

            var imageSize = this.nodeSize;
            var nodeRadius = 4;
            var labelSize = 10;
            var textDistancePositive = Math.floor(this.nodeSize * 0.67);
            var textDistanceNegitive = Math.floor(this.nodeSize * -0.67);
            var treeSize = Math.floor((this.domNode.getBoundingClientRect().width / 3));
            var toolTipSize = '10px';
            var nodeSize = 16;
            var active = d3.select(null);
            var zoom = d3.zoom()
                .scaleExtent([0.5, 8])
                .on("zoom", lang.hitch(this, zoomed));

            var width = this.domNode.getBoundingClientRect().width,
                height = width;
            this._radius = width / 2;

            var tree = d3.tree()
                .size([2 * Math.PI, treeSize])
                .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

            var stratify = d3.stratify()
                .parentId(function(d) { return d['manager'] })
                .id(function(d) { return d['email'] })

            var root = tree(stratify(__drawGraph));

            // cache svg node
            this._svgNode = this._svgNode || d3.select(this.domNode).append("svg")
            var svg = this._svgNode.attr('width', width).attr('height', height);
            // cache g node
            this._gNode = this._gNode || svg.append("g");
            var g = this._gNode;

            // attach the zoom listener and move to center
            svg.call(zoom);
            svg.call(zoom.translateTo, 0, 0);
            // svg.call(zoom.translateBy, width / 4, height / 4);
            // not sure why both of these lines are equivalent

            // this function is called when the svg is moved, and it repositions the group
            function zoomed() {
                this._gNode.attr("transform", d3.event.transform); // updated for d3 v4
            };

            // D3 LIFECYCLE HERE
            /**
             * LINKS
             */
            //update
            var link = g.selectAll(".link")
                .data(root.links())

            link.transition()
                .duration(750)
                .ease(d3.easeCubicInOut)
                .style("stroke-opacity", "0.4")
                .attr("d", d3.linkRadial()
                    .angle(function(d) { return d.x; })
                    .radius(function(d) { return d.y; }));

            //enter
            link.enter()
                .append("path")
                .attr("class", "link")
                .style("stroke", "#555")
                .style("stroke-opacity", "0.0")
                .style("stroke-width", "1.5px")
                .style("fill", "none")
                .attr("d", d3.linkRadial()
                    .angle(function(d) { return d.x; })
                    .radius(function(d) { return d.y; }));

            link.enter().selectAll("path.link").transition()
                .duration(750)
                .ease(d3.easeCubicInOut)
                .style("stroke-opacity", "0.4")
                .attr("d", d3.linkRadial()
                    .angle(function(d) { return d.x; })
                    .radius(function(d) { return d.y; }));
            //exit
            link.exit().remove();

            /**
             * NODES
             */
            var node = g.selectAll(".node")
                .data(root.descendants());

            // helpers
            var radialPoint = function radialPoint(x, y) {
                return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
            };

            //update
            node.transition()
                .duration(750).ease(d3.easeCubicInOut)
                .attr("transform", function(d) { return "translate(" + radialPoint(d.x, d.y) + ")"; })
            node.select("text").transition()
                .duration(750).ease(d3.easeCubicInOut)
                .attr("x", function(d) { return d.x < Math.PI === !d.children ? textDistancePositive : textDistanceNegitive; })
                .attr("text-anchor", function(d) { return d.x < Math.PI === !d.children ? "start" : "end"; })
                .attr("transform", function(d) { return "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")"; })
                .text(function(d) { return d.data['fullName'] })
                .attr('class', function(d) { return "d3ChartLabel " + (d.data["focus"] || "") })
            node.select("image").transition()
                .duration(750).ease(d3.easeCubicInOut)
                .attr("xlink:href", function(d) {
                    return d.data.icon;
                })
            node.raise();

            //enter
            var g = node.enter()
                .append("g");
            g.attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
                .attr("transform", function(d) { return "translate(" + radialPoint(d.x, d.y) + ")"; })
                .attr('cursor', 'pointer')
                .attr("id", function(d) { return d.data.guid; });
            g.append("text")
                .attr("dy", "0.31em")
                .attr("x", function(d) { return d.x < Math.PI === !d.children ? textDistancePositive : textDistanceNegitive; })
                .attr("text-anchor", function(d) { return d.x < Math.PI === !d.children ? "start" : "end"; })
                .attr("transform", function(d) { return "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")"; })
                .text(function(d) { return d.data['fullName'] })
                //.attr('visibility', 'hidden')
                .style('font-size', (d) => { return labelSize; })
                .style('padding-left', '10px')
                .attr('class', function(d) { return "d3ChartLabel " + (d.data["focus"] || "") })
                .attr('fill', '#000000');
            g.append("image")
                .attr("xlink:href", function(d) {
                    return d.data.icon;
                })
                .attr('width', imageSize)
                .attr('height', imageSize)
                .attr("transform", function(d) { return "translate(" + (imageSize / -2) + "," + (imageSize / -2) + ")"; })
                .on('click', lang.hitch(theWidget, this._onNodeClick));

            //exit
            node.exit().remove();

        },

        /**
         * On Node Click
         * @param {D3Node} e - the node that was clicked
         */
        _onNodeClick: function(e) {
            // e.data.guid
            if (this.onClickMicroflow) {
                mx.data.action({
                    params: {
                        actionname: this.onClickMicroflow,
                        applyto: "selection",
                        guids: [e.data.guid]
                    },
                    origin: this.mxform,
                    callback: function() {
                        console.debug("microflow executed with GUID: " + e.data.guid)
                    }
                })
            } else {
                console.debug("No On-Click microflow defined. Check the widget properties.")
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
                this._fetchEntitiesFromMicroflow()
                    .then(lang.hitch(this, function(mxObjects) {
                        var includedNodes = this._cleanUpData(mxObjects);
                        if (this._errorState) {
                            reject();
                        } else {
                            var chartObjs = this._mapToChartObjects(includedNodes);
                            if (this._phantomRoot) {
                                chartObjs.unshift(this._phantomRoot);
                            }
                            resolve(chartObjs);
                        }
                    }))
            }));
        },

        /**
         * Clean Up Data
         * ---
         * Set the CEO as root, sort, and remove orphan objects
         * @returns {Array::MxObjects} - The MxObjects to be included in the chart
         */
        _cleanUpData: function(mxObjects) {
            this._setCEOAsRoot(mxObjects);
            if (this._errorState) {
                return;
            }
            var sortedMxObjects = this._sortMxObjects(mxObjects, this.orgLayerRankAttr),
                include = this._getValidMxObjects(sortedMxObjects);
            return (include);
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
         * Fetch Entities from Microflow
         * ---
         * Get the associate buffer objects from the specified microflow
         * @returns {Promise} - resolves with a list of MxObjects
         */
        _fetchEntitiesFromMicroflow: function(mfName) {
            return new Promise(lang.hitch(this, function(resolve, reject) {
                mx.data.action({
                    params: {
                        applyto: "selection",
                        actionname: this.dataMicroflow,
                        guids: [this._contextObj.getGuid()]
                    },
                    origin: this.mxform,
                    callback: lang.hitch(this, function(data) {
                        resolve(data);
                    }),
                    error: function(error) {
                        console.log(error);
                        reject(error);
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
                    "fullName": !this.nodeShowLabelAttr || mxobj.get(this.nodeShowLabelAttr) ? mxobj.get(this.nodeLabelAttr) : "",
                    "manager": mxobj.get(this.foreignKeyAttr),
                    "icon": this._getImageUrl(mxobj.get(this.enumAttr)),
                    "orgLayer": mxobj.get(this.orgLayerRankAttr),
                    "guid": mxobj.getGuid(),
                    "focus": this.nodeFocusAttr && mxobj.get(this.nodeFocusAttr) ? this.nodeFocusClass : null
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
                if (!mxObj.get(this.orgLayerRankAttr) || mxObj.get("Orphan") || this._isDuplicate(mxObj, include)) {
                    if (!mxObj.get(this.orgLayerRankAttr)) {
                        this._logExclusionMessage(mxObj, "attribute [Org Layer] is undefined");
                    } else if (mxObj.get("Orphan")) {
                        this._logExclusionMessage(mxObj, "attribute [Orphan] is true");
                    } else {
                        this._logExclusionMessage(mxObj, "there is already a node with this value for [" + this.primaryKeyAttr + "]");
                    }
                    return;
                }
                // does the parent of `mxObj` exist?
                var parent = include.find(lang.hitch(this, function(parentObj) {
                    return (parentObj.get(this.orgLayerRankAttr) * 1 === mxObj.get(this.orgLayerRankAttr) * 1 - 1) &&
                        parentObj.get(this.primaryKeyAttr) === mxObj.get(this.foreignKeyAttr)
                }))
                if (parent || mxObj.get(this.orgLayerRankAttr) * 1 === 0 || (this._phantomRoot && mxObj.get(this.foreignKeyAttr) == "root")) {
                    include.push(mxObj);
                } else {
                    this._logExclusionMessage(mxObj, "could not find a parent with [" + this.primaryKeyAttr + "=" + mxObj.get(this.foreignKeyAttr) + "]")
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
         * - The "CEO" is the object with the lowest value in org rank
         * - If there is more than one object with the lowest rank, then we need to add a "phantom" CEO
         */
        _setCEOAsRoot: function(mxObjects) {
            // 1. find the lowest orglayerrank
            var minRank = Math.min.apply(null, mxObjects.map(lang.hitch(this, function(mxobj) {
                return (mxobj.get(this.orgLayerRankAttr) ? mxobj.get(this.orgLayerRankAttr) * 1 : 999999);
            })));
            // 2. Get all the mxObjects with that rank
            var lowestList = mxObjects.filter(lang.hitch(this, function(mxobj) {
                return mxobj.get(this.orgLayerRankAttr) && mxobj.get(this.orgLayerRankAttr) * 1 === minRank;
            }));
            // 3a. if there's none, there's an error
            if (!lowestList) {
                this._errorState = "No CEO"
                console.error(">>>>> No CEO found in the dataset. The chart will fail.")
            }
            // 3b. If there's only one, it's the CEO
            else if (lowestList.length === 1) {
                this._phantomRoot = null;
                lowestList[0].set(this.foreignKeyAttr, "");
            }
            // 3c. If there's more than one, we need to add a phantom
            else {
                // add the root as the first object
                this._phantomRoot = {
                    "email": "root",
                    "fullName": "Company",
                    "manager": "",
                    "icon": "",
                    "orgLayer": minRank - 1,
                    "guid": ""
                };
                lowestList.forEach(lang.hitch(this, function(mxobj) {
                    mxobj.set(this.foreignKeyAttr, "root");
                }));
            }
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

        _logExclusionMessage: function(mxObj, message) {
            this._totalErrors[message] = this._totalErrors[message] + 1 || 1;
            var errorMessage = "Excluding node " + mxObj.get(this.primaryKeyAttr) + " because: " + message;
            console.debug(errorMessage);
        },

        resize: function(box) {
            logger.debug(this.id + ".resize");
            this.__drawGraph();
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