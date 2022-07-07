odoo.define('pos_quotation_order.product_screen', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');

    class QuotationButton extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('click', this.onClick);
        }
        get client() {
            return this.env.pos.get_client();
        }

        get currentOrder() {
            return this.env.pos.get_order();
        }

        async onClick() {
            var self = this;
            const {
                confirmed,
                payload,
                print
            } = await this.showPopup('QuotationPopup', {
                customer: self.client,
            });
            if (confirmed) {
                if (!this.currentOrder.export_as_JSON().lines.length) {
                    this.showPopup('QuotationPopUpAlert', {
                        title: this.env._t('Warning'),
                        body: this.env._t('At least one product is required to create the quotation'),
                    })
                    return;
                }
                if (print) {
                    self.showScreen("ReceiptScreen");
                }
                const val = this.formatCurrentOrder(payload, quotation_number);
                try {
                    this.rpc({
                        model: 'pos.quotation',
                        method: 'create_quotation',
                        args: [val],
                        kwargs: {
                            context: this.env.session.user_context
                        },
                    }).then((result) => {
                        if (result) {
                            self.env.pos.quotation_number = result[1];
                            let counter = self.currentOrder.orderlines.length
                            for (let i = 0; i < counter; i++) {
                                self.currentOrder.remove_orderline(self.currentOrder.orderlines.models[0])
                            }
                            self.env.pos.db.add_quotations(result[0]);
                        }
                    });
                } catch (error) {
                    this.showPopup('QuotationPopUpAlert', {
                        title: this.env._t('Error'),
                        body: this.env._t("Could not reach the server. Please check that you have an active internet connection, the server address you entered is valid, and the server is online."),
                    })
                    return;
                }
                this.showPopup('QuotationPopUpAlert', {
                    title: this.env._t('Success'),
                    body: this.env._t(quotation_number + ' Created Successfully'),
                })
            }
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

    return QuotationButton;
});
