odoo.define('pos_quotation_order.ReceiptScreen', function (require) {
    'use strict';

    const ReceiptScreen = require('point_of_sale.ReceiptScreen');
    const Registries = require('point_of_sale.Registries');
    var core = require('web.core');
    var rpc = require('web.rpc');
    var QWeb = core.qweb;
    const { is_email } = require('web.utils');
    const { useRef, useContext } = owl.hooks;
    const { useErrorHandlers, onChangeOrder } = require('point_of_sale.custom_hooks');
    const ReservaReceiptScreen = (ReceiptScreen) =>
        class extends ReceiptScreen {
            constructor() {
                console.log(this.orderUiState)
                super(...arguments);
                
                this._receiptEnv = this.props;
                this.quotReceipt = useRef('order-receipt');
                console.log(this.orderUiState)
                // onChangeOrder(null, (newOrder) => newOrder && this.render());
                // this.orderReceipt = useRef('order-receipt');
                const order = this.currentOrder; 
                const client = {
                    email: null
                };
                if (this.currentOrder) {
                    client = order.get_client();

                }
                
                
                // this.orderUiState = useContext(order.uiState.ReceiptScreen);
                this.orderUiState.inputEmail = this.orderUiState.inputEmail || (client && client.email) || '';
                // this.is_email = is_email;
                // this.orderReceipt = useRef('order-receipt');
            }
            mounted() {
                // console.log('props', this.props)
                setTimeout(async () => await this.handleAutoPrint(), 0);
            }


            get receiptEnv() {
                return this._receiptEnv;
            }
            get reservationData() {
                // console.log('actualizar props', this.props)
                return this.props;
            }

            mark_as_printed(reservation_id) {
                rpc.query({
                    model: 'pos.quotation',
                    method: 'mark_as_printed',
                    args: [[], reservation_id],
                }).then(function (result) {
                    console.log('marcado como impreso', result)
                });

            }

            async printQuotationReport() {
                // console.log('print in posbox', $('div.button.print'));
                if ($('div.button.print').hasClass('disabled')) {
                    console.log('button disabled');
                    this.showPopup('ErrorPopup', {
                        title: this.env._t('Validación'),
                        body: _.str.sprintf(
                            this.env._t('El reporte ya fue impreso, por favor consultar con administrador')
                        ),
                    });
                    
                } else {
                    var printers = this.env.pos.printers;
                    let isPrintSuccessful = true;
                    for (var i = 0; i < printers.length; i++) {
                        var selector = $('.pos-receipt').find('div.quotation');
                        for (let s = 0; s < selector.length; s++) {
                            const element = selector[s];
                            var quot_id = $(element).attr('quot-id');
                            var lines = [];
                            var quot_lines = $(element).find('div.quot_line');
                            // console.log(quot_lines);
                            for (let l = 0; l < quot_lines.length; l++) {
                                const line = quot_lines[l];
                                // console.log('cada', line);
                                var details = $(line).attr('details').split('/');
                                lines.push({
                                    qty: $(line).attr('qty'),
                                    name: $(line).attr('name'),
                                    detail: details
                                })
                            }
                            // console.log('lines', lines)
                            var quotation = {
                                reservas: true,
                                dispatch: false,
                                id: quot_id,
                                lines: lines,
                                name: $(element).attr('quot-name'),
                                time: $(element).attr('time'),
                                nota: $(element).attr('nota'),
                                retiro: $(element).attr('retiro'),
                                entrega: $(element).attr('entrega'),
                                artesanal: $(element).attr('artesanal')

                            }
                            var receipt = QWeb.render('ReservaReceiptById', { quotation: quotation });
                            const result = await printers[i].print_receipt(receipt);
                            if (result.successful) {
                                // console.log('printeo correctamente', parseInt(quot_id));
                                // this.mark_as_printed(element.reservation_id);

                            }
                            // const result = await printers[i].print_receipt(this.quotReceipt);
                            // if (result.successful) {
                            //     console.log('se rpinteo', parseInt($(element).attr('quot-id')));
                            //     // this.mark_as_printed(element.reservation_id);

                            //     isPrintSuccessful = false;
                            // }
                        }

                    }
                    if (isPrintSuccessful) {
                        $('div.button.print').addClass('disabled')
                    }

                }
                
            }

        }
    Registries.Component.extend(ReceiptScreen, ReservaReceiptScreen);
    return ReservaReceiptScreen;

})
