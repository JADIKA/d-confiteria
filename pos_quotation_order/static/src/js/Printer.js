/* global html2canvas */
odoo.define('pos_quotation_order.Printer', function (require) {
    "use strict";

    var Printers = require('point_of_sale.Printer');

    Printers.PrinterMixin = Printers.PrinterMixin.extend({
        print_receipt: async function (receipt) {
            // console.log('vamos a imprimirt');
            if (receipt) {
                this.receipt_queue.push(receipt);
            }
            let image, sendPrintResult;
            while (this.receipt_queue.length > 0) {
                receipt = this.receipt_queue.shift();
                image = await this.htmlToImg(receipt);
                try {
                    sendPrintResult = await this.send_printing_job(image);
                } catch (error) {
                    // Error in communicating to the IoT box.
                    this.receipt_queue.length = 0;
                    return this.printResultGenerator.IoTActionError();
                }
                // rpc call is okay but printing failed because
                // IoT box can't find a printer.
                if (!sendPrintResult || sendPrintResult.result === false) {
                    this.receipt_queue.length = 0;
                    return this.printResultGenerator.IoTResultError();
                }
            }
            return this.printResultGenerator.Successful();
        },
    })

    // return {
    //     PrinterMixin: PrinterMixin,
    // }

})