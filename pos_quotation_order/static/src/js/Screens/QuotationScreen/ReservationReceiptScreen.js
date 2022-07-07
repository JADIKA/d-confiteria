odoo.define('point_of_sale.ReservationReceiptScreen', function (require) {
    'use strict';

    const { Printer } = require('point_of_sale.Printer');
    // const { is_email } = require('web.utils');
    const { useListener, useAutofocus } = require('web.custom_hooks');
    // const { useErrorHandlers, onChangeOrder } = require('point_of_sale.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const AbstractReceiptScreen = require('point_of_sale.AbstractReceiptScreen');
    var core = require('web.core');
    var rpc = require('web.rpc');
    var QWeb = core.qweb;

    const ReservationReceiptScreen = (AbstractReceiptScreen) => {
        class ReservationReceiptScreen extends AbstractReceiptScreen {
            constructor() {
                super(...arguments);
                useListener('close-screen', this._onCloseScreen);
            }

            _onCloseScreen() {
                // console.log('cerrar')
                // const { name, props } = this.nextScreen;
                this.showScreen('FloorScreen');
            }
            mounted() {
                setTimeout(async () => await this.handleAutoPrint(), 0);
            }
            get reservationData() {
                return this.props;
            }

            getQuotById(arr, id) {
                var result = arr.filter(function (o) { return o.id == id; });

                return result ? result[0] : null; // or undefined

            }

            mark_as_printed(reservation_id) {
                console.log('props', this.props);
                // console.log('reservation_id', reservation_id);
                var quotation = this.getQuotById(this.env.pos.quotations, parseInt(reservation_id));
                // var quotation = this.env.pos.quotations.find(x => x.b === parseInt(reservation_id));
                // console.log(quotation);
                
                var report_type = 'none';
                if (this.props.reservas) {
                    console.log('es una reserva')
                    report_type = 'reserva'
                    quotation.printed = true
                } else {
                    console.log('es una despacho')
                    quotation.printed_disp = true
                }
                var args = {
                    quotation_id: parseInt(reservation_id),
                    session_id: this.env.pos.pos_session.id,
                    report_type: report_type
                }
                rpc.query({
                    model: 'pos.quotation',
                    method: 'mark_quotation_as_printed',
                    args: [[], args],
                }).then(function (result) {
                    console.log('marcado como impreso', result)
                });

            }

            get_not_printed(arr, type) {
                var result = arr.filter(function (o) { 
                    var validation_type = o.printed;
                    if (type == 'despacho') {
                        validation_type = o.printed_disp;
                    }
                    return validation_type == false; 
                });
                if (result) {
                    return result
                } else {
                    return []
                }

            }

            get_today_quotations(arr) {
                var result = arr.filter(function (o) { 
                    // var today_str;
                    var date = new Date();
                    var tz = 2 * (date.getTimezoneOffset() * 60000);
                    var time = date.getTime();
                    var time_cl = new Date(time - tz).toISOString().split('.')[0];
                    // console.log('hoyy', time_cl.split('T')[0]);
                    return o.date_order == time_cl.split('T')[0]; 
                });
                // console.log('result', result);
                if (result) {
                    return result
                } else {
                    return []
                }

            }

            async printQuotationReport() {
                var today_quotations = this.get_today_quotations(this.env.pos.quotations);
                // console.log('today quot', today_quotations);
                var not_printed = this.get_not_printed(today_quotations, 'reserva');
                var not_printed_disp = this.get_not_printed(today_quotations, 'despacho');
                // console.log('printed reserva status', not_printed, not_printed_disp);
                console.log('despachos', this.props.dispatch, not_printed_disp.length, not_printed_disp);
                if (this.props.reservas && not_printed.length == 0) {
                    // console.log('button disabled');
                    this.showPopup('ErrorPopup', {
                        title: this.env._t('Validación'),
                        body: _.str.sprintf(
                            this.env._t('No existen mas reservas por imprimir, por favor consultar con administrador')
                        ),
                    });

                } else if (this.props.dispatch && not_printed_disp.length == 0) {
                    this.showPopup('ErrorPopup', {
                        title: this.env._t('Validación'),
                        body: _.str.sprintf(
                            this.env._t('No existen mas despachos por imprimir, por favor consultar con administrador')
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
                            for (let l = 0; l < quot_lines.length; l++) {
                                const line = quot_lines[l];
                                // console.log($(line).attr('details'));
                                var details = $(line).attr('details').split('/');
                                lines.push({
                                    qty: $(line).attr('qty'),
                                    name: $(line).attr('name'),
                                    detail: details
                                })
                            }
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
                                isPrintSuccessful = true;
                                // console.log('element', $(element).attr('quot-id'))
                                this.mark_as_printed($(element).attr('quot-id'))
                                

                            }
                        }

                    }
                    if (isPrintSuccessful) {
                        // this.mark_as_printed();
                        this.env.pos.pos_session.printed_reservas = true;
                    }

                }

            }
            get nextScreen() {
                return { name: 'ProductScreen' };
            }
            whenClosing() {
                this.orderDone();
            }
            /**
             * This function is called outside the rendering call stack. This way,
             * we don't block the displaying of ReceiptScreen when it is mounted; additionally,
             * any error that can happen during the printing does not affect the rendering.
             */
            async handleAutoPrint() {
                if (this._shouldAutoPrint()) {
                    await this.printReceipt();
                    if (this.currentOrder._printed && this._shouldCloseImmediately()) {
                        this.whenClosing();
                    }
                }
            }
            orderDone() {
                // this.currentOrder.finalize();
                const { name, props } = this.nextScreen;
                this.showScreen('ProductScreen');
            }
            async printReceipt() {
                const isPrinted = await this._printReceipt();
                if (isPrinted) {
                    this.currentOrder._printed = true;
                }
            }
            _shouldAutoPrint() {
                return this.env.pos.config.iface_print_auto && !this.currentOrder._printed;
            }
            // _shouldCloseImmediately() {
            //     var invoiced_finalized = this.currentOrder.is_to_invoice() ? this.currentOrder.finalized : true;
            //     return this.env.pos.proxy.printer && this.env.pos.config.iface_print_skip_screen && invoiced_finalized;
            // }
            // async _sendReceiptToCustomer() {
            //     const printer = new Printer(null, this.env.pos);
            //     const receiptString = this.orderReceipt.comp.el.outerHTML;
            //     const ticketImage = await printer.htmlToImg(receiptString);
            //     const order = this.currentOrder;
            //     const client = order.get_client();
            //     const orderName = order.get_name();
            //     const orderClient = { email: this.orderUiState.inputEmail, name: client ? client.name : this.orderUiState.inputEmail };
            //     const order_server_id = this.env.pos.validated_orders_name_server_id_map[orderName];
            //     await this.rpc({
            //         model: 'pos.order',
            //         method: 'action_receipt_to_customer',
            //         args: [[order_server_id], orderName, orderClient, ticketImage],
            //     });
            // }
        }
        ReservationReceiptScreen.template = 'ReservationReceiptScreen';
        return ReservationReceiptScreen;
    };

    Registries.Component.addByExtending(ReservationReceiptScreen, AbstractReceiptScreen);

    return ReservationReceiptScreen;
});
