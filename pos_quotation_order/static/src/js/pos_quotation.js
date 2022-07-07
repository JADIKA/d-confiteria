/* odoo.define('point_of_sale.pos_quotation_order', function (require) {
    "use strict";

    var screens = require('point_of_sale.PaymentScreen');
    var gui = require('point_of_sale.Gui');
    var core = require('web.core');
    var _t = core._t;

    var QuotationButton = screens.ActionButtonWidget.extend({
        template: 'QuotationButton',
        button_click: function () {
            var order_lines = this.pos.get_order().get_orderlines();
            var flag_negative = false;
            for (var line in order_lines) {
                if (order_lines[line].quantity < 0) {
                    flag_negative = true;
                }
            }
            if (this.pos.get_order().get_orderlines().length > 0 && flag_negative == false && this.pos.get_order().get_total_with_tax() > 0) {
                this.gui.show_popup('pos_quot');
            }
            else if (flag_negative == true) {
                this.gui.show_popup('pos_quot_result', {
                    'body': _t('Orden Invalida: Cantidades negativas no estan permitidas'),
                });
            }
            else if (this.pos.get_order().get_orderlines().length == 0 || this.pos.get_order().get_total_with_tax() <= 0) {
                this.gui.show_popup('pos_quot_result', {
                    'body': _t('Orden Invalida : Por favor agrega algunas lineas'),
                });
            }
        },
    });

    screens.define_action_button({
        'name': 'pos_quotation_order',
        'widget': QuotationButton,
        'condition': function () {
            return this.pos.config.enable_quotation;
        }
    });

});
 */
