odoo.define('pos_quotation_order.product_screen', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    var rpc = require('web.rpc');
    var core = require('web.core');
    var gui = require('point_of_sale.Gui');
    var QWeb = core.qweb;

    class QuotationButton extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('click', this.onClick);
        }
        async onClick() {
            this.showPopup('QuotationPopup', {

            });
        }
    }
    QuotationButton.template = 'QuotationButton';
    ProductScreen.addControlButton({
        component: QuotationButton,
        condition: function () {
            return true;
        },
        position: ['before', 'SetPricelistButton'],
    });
    Registries.Component.add(QuotationButton);

    // class ReporteReservasButton extends PosComponent {
    //     constructor() {
    //         super(...arguments);
    //         useListener('click', this.onClick);
    //     }
    //     async onClick() {
    //         this.get_reservations('web');
    //         // if (!this.env.pos.config.iface_print_via_proxy) {
                
    //         // } else {
    //         //     this.print_xml();
    //         // }
    //     }

    //     get_reservations(print_type) {
    //         var self = this;
    //         rpc.query({
    //             model: 'report.point_of_sale.report_reservations',
    //             method: 'get_pos_quot_details',
    //             args: [self.env.pos.config.id],
    //         }).then(function (result) {
    //             var env = {
    //                 quotations: result,
    //                 date: (new Date()).toLocaleString(),
    //             };
    //             // console.log(result);
    //             if (print_type == 'posbox') {
    //                 for (let i = 0; i < result.length; i++) {
    //                     var env_ind = {
    //                         q: result[i],
    //                         date: (new Date()).toLocaleString(),
    //                     }
    //                     var report = QWeb.render('ResumenReservasInd', env_ind);
    //                     self.pos.proxy.print_receipt(report);
    //                 }

    //             } else {
    //                 self.showScreen('ReceiptScreen', {
    //                     reservas: true,
    //                     reservations: result.length > 0 ? result : false,
    //                     date: (new Date()).toLocaleString(),
    //                 });
    //             }
                

    //         });
    //     }
    //     print_xml() {
    //         this.get_reservations('posbox');
            
    //     }
    // }
    // ReporteReservasButton.template = 'ReporteReservasButton';
    // ProductScreen.addControlButton({
    //     component: ReporteReservasButton,
    //     condition: function () {
    //         return true;
    //     },
    //     position: ['before', 'SetPricelistButton'],
    // });
    // Registries.Component.add(ReporteReservasButton);

    

    return QuotationButton;
});
