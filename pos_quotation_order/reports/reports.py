import logging
import psycopg2
from functools import partial
from odoo import models, fields, api, tools, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

class ReportSaleDetails(models.AbstractModel):
    _name = 'report.point_of_sale.report_reservations'
    _description = 'Reservation Reports'
    
    @api.model 
    def sort_quot_by_time(self, quots): 
            return quots.sorted(key='time_order') 

    @api.model
    def get_pos_quot_details(self, session_id):
        today = fields.Datetime.from_string(fields.Date.context_today(self))
        quot_domain = [
            ('date_order', '=', today.date()),
            ('printed', '=', False)]
        
        quots = self.env['pos.quotation'].search(quot_domain)
        quots_res = []
        ids = quots.ids
        res = {}
        for quot in self.sort_quot_by_time(quots):
            quot_lines = []
            for line in quot.lines:
                # details = line.name.split(':')
                quot_lines.append({
                    'name': line.product_id.name,
                    'qty': line.qty,
                    'details': line.note
                    })
                res = {'id': quot.name,
                       'time': quot.time_order,
                       'lines': [],
                       'retiro': quot.retiro,
                       'entrega': quot.entrega,
                       'nota': quot.note,
                       'artesanal': quot.artesanal,
                       'reservation_id': quot.id
                       }
                res['lines'] = quot_lines
            quots_res.append(res)

        # record_ids = self.env['pos.quotation'].search([('id', 'in', ids)])
        return quots_res

    @api.model
    def get_pos_quot_disp_details(self, session_id):
        today = fields.Datetime.from_string(fields.Date.context_today(self))
        quots = self.env['pos.quotation'].search([
            ('date_order', '=', today.date()),
            ('printed_disp', '=', False),
            ('entrega', '=', True)])
        quots_res = []
        ids = quots.ids
        res = {}
        for quot in self.sort_quot_by_time(quots):
            quot_lines = []
            for line in quot.lines:
                quot_lines.append({
                    'name': line.product_id.name,
                    'qty': line.qty,
                    'details': line.note
                    })
                res = {'id': quot.name,
                       'time': quot.time_order,
                       'lines': [],
                       'retiro': quot.retiro,
                       'entrega': quot.entrega,
                       'dir_entrega': quot.dir_entrega,
                       'recibe': quot.recibe,
                       'tel_entrega': quot.tel_entrega,
                       'nota': quot.note,
                       'reservation_id': quot.id
                       }
                res['lines'] = quot_lines
            quots_res.append(res)

        # record_ids = self.env['pos.quotation'].search([('id', 'in', ids)])
        # for record in record_ids:
        #     record.write({
        #         'printed_disp': True
        #     })

        return quots_res