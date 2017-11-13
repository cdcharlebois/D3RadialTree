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
    //"DThreeRadialTree/"

    "dojo/text!DThreeRadialTree/widget/template/DThreeRadialTree.html"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, widgetTemplate) {
    "use strict";

    return declare("DThreeRadialTree.widget.DThreeRadialTree", [_WidgetBase, _TemplatedMixin], {

        templateString: widgetTemplate,

        widgetBase: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,

        //dummy 
        __jsonTestData: [{
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
            this._updateRendering(callback);
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
