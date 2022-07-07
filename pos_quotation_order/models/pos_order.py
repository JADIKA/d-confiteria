from odoo import fields, models, api
import logging
from datetime import datetime

_logger = logging.getLogger(__name__)


class PosOrder(models.Model):
    _inherit = 'pos.order'

    origin_quotation = fields.Many2one('pos.quotation', string='Reserva')

    @api.model      
    def create_from_ui(self, orders, draft=False):
        res = super(PosOrder, self).create_from_ui(orders, draft)
        for r in res:
            order = self.browse(r['id'])
            if order:
                origin_quot = self.env['pos.quotation'].sudo().browse(int(order.origin_quotation.id))
                if origin_quot:
                    origin_quot.update({
                        'state': 'confirmed'
                    })
        return res

    @api.model
    def _order_fields(self, ui_order):
        order_fields = super(PosOrder, self)._order_fields(ui_order)

        if ui_order.get('origin_quotation', False):
            order_fields.update({
                'origin_quotation': ui_order['origin_quotation']
            })
        return order_fields


    # @api.model
    # def set_to_done_pos(self, so_id):
    #     so_obj = self.env['sale.order'].search([('id', '=', so_id)])
    #     so_obj.update({'state': 'done_pos'})
    #     return True

    
    # def cron_deactivate_pos_orders(self):
    #     orders = self.search([('state', 'in', ['sale_ticket'])])
    #     for order in orders:
    #         if (datetime.now() - order.date_order).days >= order.config_id.sale_valid_days:
    #             order.update({
    #                 'state': 'overdue'
    #             })