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
        dataMicroflow: null,
        orgLayerRankAttr: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,
        _totalErrors: {},
        _errorState: null,

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
            this._errorState = null;
            this._contextObj = obj;
            this._gatherDataAndDrawGraph(callback);
            // this.__drawGraph(this.__jsonTestData);

        },

        _gatherDataAndDrawGraph: function(callback) {
            this._gatherData()
                .then(lang.hitch(this, function(data) {
                    this.__drawGraph(data);
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
                    console.error("ERROR OCCURRED: " + this._errorState);
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
            this.subscribe({
                guid: this._contextObj.getGuid(),
                callback: lang.hitch(this, function(guid) {
                    this._gatherDataAndDrawGraph();
                })
            });
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
            var treeSize = 880;
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
                .parentId(function(d){ return d['manager'] })
                .id(function(d){ return d['email'] })

                var root = tree(stratify(__drawGraph));
                
                var svg = d3.select(this.domNode).append("svg").attr('width', width).attr('height', height)
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
                    .attr("class", function(d) {  return "node" + (d.children ? " node--internal" : " node--leaf"); })
                    .attr("transform", function(d) { return "translate(" + radialPoint(d.x, d.y) + ")"; })
                    .attr('cursor', 'pointer');
                    node.append("circle")
                    .attr("r", (d) => {              
                      return nodeRadius;
                    })
                    .attr('fill', nodeColor)
                    .attr('stroke', (d) => { return '#000000'})
                    .on('click', nodeInfo)

        
                    function nodeColor(d){              
                        switch(d.data['Message']){
                          case 'Do not participate': return '#D8D8D8';
                            break;
                          case 'Warning':  return '#E87408';
                            break;
                          default:
                              return '#000000';                     
                        }
                        if (d.data['Message']){                         
                          return '#FADF0A';
                        } 
                    }

        function radialPoint(x, y) {
            return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
            }        
            //get data from node
            function nodeInfo(d) {
                if (d.data !== null) {
                    console.log(d);
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
                this._featchEntitiesFromMicroflow()
                    .then(lang.hitch(this, function(mxObjects) {
                        var includedNodes = this._cleanUpData(mxObjects);
                        if (this._errorState) {
                            reject();
                        } else {
                            var chartObjs = this._mapToChartObjects(includedNodes);
                            resolve(chartObjs);
                        }
                    }))
            }));
        },

        _cleanUpData: function(mxObjects) {
            // return new Promise(lang.hitch(this, function(resolve) {
            this._setCEOAsRoot(mxObjects);
            if (this._errorState) {
                return;
            }
            var sortedMxObjects = this._sortMxObjects(mxObjects, this.orgLayerRankAttr),
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

        _featchEntitiesFromMicroflow: function(mfName) {
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
                    "fullName": mxobj.get("FullName"),
                    // "isCEO": false,
                    "manager": mxobj.get(this.foreignKeyAttr),
                    "icon": "ok",
                    "orgLayer": mxobj.get(this.orgLayerRankAttr),
                    "guid": mxobj.getGuid()
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
                if (parent || mxObj.get(this.orgLayerRankAttr) * 1 === 0) {
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
         */
        _setCEOAsRoot: function(mxObjects) {
            // 1. Set the CEO to not have a manager
            var ceo = mxObjects.find(lang.hitch(this, function(mxobj) {
                return mxobj.get("CEO")
            }));
            if (ceo) {
                ceo.set(this.foreignKeyAttr, "");
            } else {
                this._errorState = "No CEO"
                console.error(">>>>> No CEO found in the dataset. The chart will fail.")
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