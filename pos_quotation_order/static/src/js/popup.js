odoo.define('pos_quotation_order.popup', function (require) {
    'use strict';
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');
    var rpc = require('web.rpc');
    var gui = require('point_of_sale.Gui');

    class QuotationPopup extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            this.message = null;
        }

        date_validate() {
            var v = $(".order_date").val();
            if (v.match(/^\d{4}$/) !== null) {
                $(".order_date").val(v + '/');
            }
            else if (v.match(/^\d{4}\/\d{2}$/) !== null) {
                $(".order_date").val(v + '/');
            }
        }

        confirm_quotation() {
            var self = this;
            var new_quotation = [];
            var fields = _.find(this.env.pos.models, function (model) { return model.model === 'pos.quotation'; }).fields;
            //var line_fields = _.find(this.env.pos.models, function (model) { return model.model === 'pos.quotation.line'; }).fields;
            var today = new Date().toJSON().slice(0, 10);
            var order = this.env.pos.get_order();
            var order_to_save = order.export_as_JSON();
            var line_fields = this.env.pos.get_order().get_orderlines();
            var order_date = $('.order_date').val();
            var order_time = $('.order_time').val();
            var order_note = $('.order_note').val();
            var retiro = $('#retiro').prop('checked');
            if (retiro == true) {
                var retiro = true
            }
            else {
                var retiro = false
            };
            var artesanal = $('#artesanal').prop('checked');
            if (artesanal == true) {
                var artesanal = true
            }
            else {
                var artesanal = false
            };
            var entrega = $('#entrega').prop('checked');
            if (entrega == true) {
                var entrega = true
            }
            else {
                var entrega = false
            };
            var recibe = $('#recibe').val();
            var dir_entrega = $('#dir_entrega').val();
            var tel_entrega = $('#tel_entrega').val();
            var valid_date = true;
            var validatePattern = /^(\d{4})([/|-])(\d{1,2})([/|-])(\d{1,2})$/;
            if (order_date) {
                var dateValues = order_date.match(validatePattern);
                if (dateValues == null) {
                    valid_date = false;
                }
                else {
                    var orderYear = dateValues[1];
                    var orderMonth = dateValues[3];
                    var orderDate = dateValues[5];
                    if ((orderMonth < 1) || (orderMonth > 12)) {
                        valid_date = false;
                    }
                    else if ((orderDate < 1) || (orderDate > 31)) {
                        valid_date = false;
                    }
                    else if ((orderMonth == 4 || orderMonth == 6 || orderMonth == 9 || orderMonth == 11) && orderDate == 31) {
                        valid_date = false;
                    }
                    else if (orderMonth == 2) {
                        var isleap = (orderYear % 4 == 0 && (orderYear % 100 != 0 || orderYear % 400 == 0));
                        if (orderDate > 29 || (orderDate == 29 && !isleap)) {
                            valid_date = false;
                        }
                    }
                    var dates = [orderYear, orderMonth, orderDate];
                    console.log(dates);
                    order_date = dates.join('-');
                }
            }
            $('.alert_msg').text("");
            if (order_date && order_date < today || valid_date == false || !order_date) {
                $('.alert_msg').text("Selecciona una fecha válida!");
            }
            else {
                $('.alert_msg').text("");
                if (order_date) {
                    order_to_save.date_order = order_date;
                }
                order_to_save.time_order = order_time;
                order_to_save.retiro = retiro;
                order_to_save.entrega = entrega;
                order_to_save.recibe = recibe;
                order_to_save.artesanal = artesanal;
                order_to_save.dir_entrega = dir_entrega;
                order_to_save.tel_entrega = tel_entrega;
                order_to_save.note = order_note;
                console.log('Order', order_to_save);
                rpc.query({
                    model: 'pos.quotation',
                    method: 'create_from_ui',
                    args: [order_to_save],
                })
                    .then(function (order) {
                        //self.env.pos.quotations.push(order);
                        self.env.pos.delete_current_order();
                        self.showPopup('QuotationResultPopUp', {
                        });
                        // gui.close_popup();
                        // self.env.pos.delete_current_order();
                        // gui.show_popup('QuotationResultPopUp', {
                        //     'body': _t('Reserva : ') + order['name'],
                        // });
                    });
            }
        }
    }
    QuotationPopup.template = 'QuotationPopup';
    QuotationPopup.defaultProps = {
        confirmText: 'Aceptar',
        title: 'Reserva',
        body: '',
        message: ''
    };
    Registries.Component.add(QuotationPopup);

    class QuotationResultPopUp extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            this.message = null;
        }


    }
    QuotationResultPopUp.template = 'QuotationResultPopUp';
    QuotationResultPopUp.defaultProps = {
        confirmText: 'Aceptar',
        title: 'Reserva',
        body: '',
        message: ''
    };
    Registries.Component.add(QuotationResultPopUp);

    return QuotationPopup, QuotationResultPopUp;
})