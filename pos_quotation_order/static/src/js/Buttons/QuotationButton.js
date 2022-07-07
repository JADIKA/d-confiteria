odoo.define('pos_quotation_order.QuotationsButton', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { posbus } = require('point_of_sale.utils');

    class QuotationsButton extends PosComponent {
        onClick() {
            if (this.props.isTicketScreenShown) {
                posbus.trigger('ticket-button-clicked');
            } else {
                this.showScreen('QuotationScreen');
            }
        }
        willPatch() {
            posbus.off('order-deleted', this);
        }
        patched() {
            posbus.on('order-deleted', this, this.render);
        }
        mounted() {
            posbus.on('order-deleted', this, this.render);
        }
        willUnmount() {
            posbus.off('order-deleted', this);
        }
        get count() {
            if (this.env.pos && this.env.pos.sale_ticket_orders) {
                return this.env.pos.sale_ticket_orders.length;
            } else {
                return 0;
            }
        }
    }
    QuotationsButton.template = 'QuotationsButton';

    Registries.Component.add(QuotationsButton);

    return QuotationsButton;
});
