odoo.define('pos_quotation_order.ReceiptReservas', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class ReceiptReservas extends PosComponent {
        constructor() {
            super(...arguments);
            // this._receiptEnv = this.props.order.getOrderReceiptEnv();
        }

        
    }
    ReceiptReservas.template = 'ReceiptReservas';

    Registries.Component.add(ReceiptReservas);

    class ReceiptDespachos extends PosComponent {
        constructor() {
            super(...arguments);
            // this._receiptEnv = this.props.order.getOrderReceiptEnv();
        }
    }
    ReceiptDespachos.template = 'ReceiptDespachos';

    Registries.Component.add(ReceiptDespachos);

    return ReceiptReservas, ReceiptDespachos;
});
