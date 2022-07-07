odoo.define('pos_quotation_order.Screens', function (require) {
    "use strict";

    var core = require('web.core');
    var QWeb = core.qweb;
    var rpc = require('web.rpc');
    var _t = require('web.core')._t;
    var session = require('web.session');
    const ControlButtonsMixin = require('point_of_sale.ControlButtonsMixin');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const { onChangeOrder, useBarcodeReader } = require('point_of_sale.custom_hooks');
    const { useState, useRef } = owl.hooks;
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require('web.custom_hooks');
    const OrderManagementScreen = require('point_of_sale.OrderManagementScreen');
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const { posbus } = require('point_of_sale.utils');
    const { Gui } = require('point_of_sale.Gui');





    class ReservaReceipt extends IndependentToOrderScreen {
        constructor() {
            super(...arguments);
        }
        mounted() {
            this.render();
        }

        back() {
            this.close();
        }
        click_next() {
            this.gui.show_screen('products');
        }
        click_back() {
            this.gui.show_screen('products');
        }
        render_receipt() {
            self = this;
            rpc.query({
                model: 'report.point_of_sale.report_saledetails',
                method: 'get_pos_quot_details',
                args: [false, false, self.pos.config.id],
            }).then(function (result) {
                var env = {
                    widget: self,
                    company: self.pos.company,
                    pos: self.pos,
                    quotations: result.quotations,
                    products: result.products,
                    payments: result.payments,
                    taxes: result.taxes,
                    total_paid: result.total_paid,
                    date: (new Date()).toLocaleString(),
                    pos_name: result.pos_name,
                    cashier_name: result.cashier_name,
                    session_start: result.session_start,
                    session_end: result.session_end
                };
                var report = QWeb.render('XMLSaleDetailsReport', env);
                self.$('.pos-receipt-container').html(report);
            });
        }
        print_web() {
            window.print();
        }



    }
    ReservaReceipt.template = 'SessionReceiptScreenWidget';

    Registries.Component.add(ReservaReceipt);

    return ReservaReceipt;

});