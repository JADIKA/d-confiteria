odoo.define('pos_quotation_order.ReservaReceipt', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class ReservaReceipt extends PosComponent {
        constructor() {
            super(...arguments);
            this._receiptEnv = this.props.ReservationData;
        }
        get receipt() {
            return this.receiptEnv;
        }
        get receiptEnv() {
            // console.log(this._receiptEnv);
            return this._receiptEnv;
        }
    }
    ReservaReceipt.template = 'ReservaReceipt';

    Registries.Component.add(ReservaReceipt);

    return ReservaReceipt;
});
