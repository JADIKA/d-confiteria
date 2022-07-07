odoo.define('pos_quotation_order.models', function (require) {
    "use strict";

    var core = require('web.core');
    var rpc = require('web.rpc');
    var models = require('point_of_sale.models')
    var modules = models.PosModel.prototype.models;
    var session = require('web.session');
    var QWeb = core.qweb;
    var _t = core._t;
    var field_utils = require('web.field_utils');

    models.load_models({
        model: 'pos.quotation',
        fields: ['name', 'partner_id', 'date_order', 'amount_total', 'lines', 'state', 'time_order', 'retiro', 'entrega', 'dir_entrega', 'tel_entrega', 'ean13', 'recibe', 'artesanal', 'printed', 'printed_disp'],
        domain: [['state', '=', 'draft']],
        loaded: function (self, quotations) {

            rpc.query({
                model: 'pos.quotation',
                method: 'get_quotation_lines',
                args: []
            }).then((result) => {
                for (let o = 0; o < quotations.length; o++) {
                    const element = quotations[o];
                    element.lines = result.filter(obj => {
                        return obj.order_id === element.id
                    })
                }
            });
            quotations.sort((b, a) => a.date_order.localeCompare(b.date_order));
            self.quotations = quotations;
        }
    });


    var _super_Order = models.Order.prototype;
    models.Order = models.Order.extend({

        initialize_validation_date: function () {
            this.pos.quotations = this.pos.quotations.filter(item => item.id !== this.origin_quotation);
            this.validation_date = new Date();
            this.formatted_validation_date = field_utils.format.datetime(
                moment(this.validation_date), {}, { timezone: false });
        },

        initialize: function (attributes, options) {
            _super_Order.initialize.apply(this, arguments);
            this.origin_quotation = false;
        },
        export_as_JSON: function () {
            var json = _super_Order.export_as_JSON.apply(this, arguments);
            if (this.origin_quotation) {
                json.origin_quotation = this.origin_quotation;
            }
            return json;
        },
        init_from_JSON: function (json) {
            var res = _super_Order.init_from_JSON.apply(this, arguments);
            if (json.origin_quotation) {
                this.origin_quotation = json.origin_quotation;
            }
            return res;
        },
    });


});