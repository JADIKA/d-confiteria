# -*- coding: utf-8 -*-

import logging
import psycopg2
from functools import partial
from odoo import models, fields, api, tools, _
from odoo.exceptions import UserError
from datetime import datetime
import requests
import json

_logger = logging.getLogger(__name__)

class PosSession(models.Model):
    _inherit = 'pos.session'

    printed_reservas = fields.Boolean('Reservas Impresas')
    printed_despachos = fields.Boolean ('Despachos Imporesos')

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    state = fields.Selection(selection_add=[('pos_quotation', 'Reserva')])
    quot_id = fields.Many2one('pos.quotation', string='Reserva')

    def get_quot_date_order(self, date_str):
        date_st = date_str.split(':')[1].split(' ')[1]

        return datetime.strptime(date_st, '%d/%m/%Y').date()
    
    def get_quot_time_order(self, time_str):
        hour = time_str.split(':')[1].split(' ')[2]
        minutes = time_str.split(':')[2]

        return '{}:{}'.format(hour, minutes)
    
    def get_quot_state(self, website_order_state):
        state = 'draft'
        if website_order_state == 'sale':
            state = 'confirmed'
        return state
    
    def get_data_delivery(self, delivery_str):
        retiro, entrega, pueblito = False, False, False
        delivery_opt = delivery_str.split(':')[1][1:]
        if delivery_opt == 'Retiro Local':
            retiro = True
        elif delivery_opt == 'Retiro Pueblito Artesanal':
            pueblito = True
        elif delivery_opt == 'Despacho':
            entrega = True
        
        return retiro, entrega, pueblito
    
    def get_line_note(self, line_name):
        note_arr = line_name.split(':')
        if len(note_arr) > 4:
            opt_1 = note_arr[1].split('\n')[0][1:]
            opt_2 = note_arr[2].split('\n')[0][1:]
            opt_3 = note_arr[3].split('\n')[0][1:]
            opt_4 = note_arr[4].split('\n')[0][1:]
            return 'Opción Frutilla 1: {} / Opción Frutilla2: {} / Metalizadas: {} / Rosas: {}'.format(opt_1, opt_2, opt_3, opt_4)
        return ''


    def _create_pos_quotation(self):
        domain = [
            ('state', 'not in', ['pos_quotation'])
        ]
        sale_orders = self.env['sale.order'].sudo().search(domain)
        tag_id = self.env['quotation.tag'].sudo().search([('name', '=', 'Web')])
        if not tag_id:
            tag_id = self.env['quotation.tag'].sudo().create({
                'name': 'Web'
            })
        for sale in sale_orders:
            sent_mail = self.env['mail.message'].sudo().search([('res_id', '=', sale.id)])
            data_reserva_list = []
            for mail in sent_mail:
                if mail.message_type == 'comment':
                    if 'Fecha y Hora' in mail.body:
                        # _logger.info('LOG -- mensaje enviado {}'.format(mail.body))
                        message = mail.body.replace('<p>', '').replace('</p>', '').replace('<br>', '&?').replace('\n', '')
                        data_reserva_list.append(message.split('&?'))
            data_reserva = data_reserva_list[0] if len(data_reserva_list) > 0 else False
            if data_reserva:
                quotation_values = {
                    'date_order': self.get_quot_date_order(data_reserva[0]),
                    'time_order': self.get_quot_time_order(data_reserva[0]),
                    'partner_id': sale.partner_id.id,
                    'state': self.get_quot_state(sale.state),
                    'note': data_reserva[2].split(':')[1][1:],
                    'retiro': self.get_data_delivery(data_reserva[1])[0],
                    'entrega': self.get_data_delivery(data_reserva[1])[1],
                    'artesanal': self.get_data_delivery(data_reserva[1])[2],
                    'tag_ids': [(6, 0, [tag_id.id])],
                    'amount_tax': sale.amount_tax,
                    'amount_total': sale.amount_total,
                    'lines': [(0, 0, {
                        'name': l.name,
                        'full_product_name': l.product_id.name,
                        'product_id': l.product_id.id,
                        'price_unit': l.price_unit,
                        'qty': l.product_uom_qty,
                        'tax_ids': [(4, t.id) for t in l.tax_id],
                        'price_subtotal': l.price_subtotal,
                        'price_subtotal_incl': l.price_total,
                        'note': self.get_line_note(l.name)
                    }) for l in sale.order_line],
                    'web_order_id': sale.id
                }
                quot_id = self.env['pos.quotation'].sudo().create(quotation_values)
                sale.update({
                    'state': 'pos_quotation',
                    'quot_id': quot_id.id
                })
                _logger.info('LOG: --> crear quotation de las orders {} result {}'.format(sale.name, quot_id.name))




class PosOrder(models.Model):
    _inherit = 'pos.order'

    quot_ref = fields.Many2one('pos.quotation', string='Reserva')

    # @api.model
    # def create_from_ui(self, orders, draft=False):
    #     # Keep only new orders
    #     submitted_references = [o['data']['name'] for o in orders]
    #     pos_order = self.search([('pos_reference', 'in', submitted_references)])
    #     existing_orders = pos_order.read(['pos_reference'])
    #     existing_references = set([o['pos_reference'] for o in existing_orders])
    #     orders_to_save = [o for o in orders if o['data']['name'] not in existing_references]
    #     order_ids = []
    #     quot_ids = []

    #     for tmp_order in orders_to_save:
    #         to_invoice = tmp_order['to_invoice']
    #         order = tmp_order['data']
    #         if to_invoice:
    #             self._match_payment_to_invoice(order)
    #         pos_order = self._process_order(order)
    #         if pos_order.quot_ref:
    #             pos_order.quot_ref.write({'state': 'confirmed'})
    #             quot_ids.append(pos_order.quot_ref.id)
    #         order_ids.append(pos_order.id)

    #         try:
    #             pos_order.action_pos_order_paid()
    #         except psycopg2.OperationalError:
    #             # do not hide transactional errors, the order(s) won't be saved!
    #             raise
    #         except Exception as e:
    #             _logger.error('Could not fully process the POS Order: %s', tools.ustr(e))

    #         if to_invoice:
    #             pos_order.action_pos_order_invoice()
    #             pos_order.invoice_id.sudo().action_invoice_open()
    #             pos_order.account_move = pos_order.invoice_id.move_id
    #     return order_ids, quot_ids

    @api.model
    def _order_fields(self, ui_order):
        origin_values = super(PosOrder, self)._order_fields(ui_order)
        process_line = partial(self.env['pos.order.line']._order_line_fields)
        quot_id = False
        if 'quotation_ref' in ui_order:
            if ui_order['quotation_ref']:
                quot_id = ui_order['quotation_ref']['id']
        origin_values.update({
            'quot_ref': quot_id
        })
        return origin_values


class PosQuotation(models.Model):
    _name = 'pos.quotation'
    _description = 'POS Quotation'

    def get_legacy_quotations(self):
        headers = {}
        data = {
            'limit': 100
        }
        url = 'https://choco.pudutech.cl/quotations'
        response = requests.request('GET', url, headers=headers, data=data)
        resp_obj = json.loads(response.text)
        return True

    @api.model
    def _amount_line_tax(self, line, fiscal_position_id):
        taxes = line.tax_ids.filtered(lambda t: t.company_id.id == line.order_id.company_id.id)
        if fiscal_position_id:
            taxes = fiscal_position_id.map_tax(taxes, line.product_id, line.order_id.partner_id)
        price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
        currency_id = line.order_id.pricelist_id.currency_id
        if not currency_id:
            currency_id = self.env.user.company_id.currency_id
        taxes = taxes.compute_all(price, currency_id, line.qty, product=line.product_id, partner=line.order_id.partner_id or False)['taxes']
        return sum(tax.get('amount', 0.0) for tax in taxes)
    


    @api.model
    def _order_fields(self, ui_order):
        process_line = partial(self.env['pos.quotation.line']._order_line_fields)
        return {
            'lines': [process_line(l) for l in ui_order['lines']] if ui_order['lines'] else False,
            'partner_id': ui_order['partner_id'] or False,
            'date_order': ui_order['date_order'],
            'time_order': ui_order['time_order'],
            'retiro': ui_order['retiro'],
            'entrega': ui_order['entrega'],
            'recibe': ui_order['recibe'],
            'dir_entrega': ui_order['dir_entrega'],
            'tel_entrega': ui_order['tel_entrega'],
            'artesanal': ui_order['artesanal'],
            'note': ui_order['note'] or '',
        }

    def _default_session(self):
        return self.env['pos.session'].search([('state', '=', 'opened'), ('user_id', '=', self.env.uid)], limit=1)

    def _default_pricelist(self):
        return self._default_session().config_id.pricelist_id

    name = fields.Char(string='Ref. Reserva', required=True, readonly=True, copy=False, default='/')
    company_id = fields.Many2one('res.company', string='Compañía', required=True, readonly=True,default=lambda self: self.env.user.company_id)
    date_quotation = fields.Datetime(string='Fecha Presupuesto', readonly=True, index=True, default=fields.Datetime.now)
    date_order = fields.Date(string='Fecha de Orden', readonly=True, index=True)
    time_order = fields.Char(string='Hora de Orden', readonly=True)
    amount_tax = fields.Float(string='Taxes', digits=0)
    amount_total = fields.Float(string='Total', digits=0)
    lines = fields.One2many('pos.quotation.line', 'order_id', string='Order Lines', copy=True)
    pricelist_id = fields.Many2one('product.pricelist', string='Tarifa', default=_default_pricelist)
    partner_id = fields.Many2one('res.partner', string='Cliente', change_default=True, index=True)
    state = fields.Selection([('draft', 'Pago Pendiente'), ('confirmed', 'Pagada')], 'Status', readonly=True, copy=False, default='draft')
    note = fields.Text(string='Notas Internas')
    fiscal_position_id = fields.Many2one('account.fiscal.position', string='Posicion Fiscal')
    ean13 = fields.Char('Ean13')
    retiro = fields.Boolean('Retiro Local')
    entrega = fields.Boolean('Entrega')
    recibe = fields.Char('Quien Recibe?')
    dir_entrega = fields.Char('Dirección de Entrega')
    tel_entrega = fields.Char('Télefono de Entrega')
    is_done = fields.Boolean('Entregado')
    artesanal = fields.Boolean('Pueblito Artesanal')
    printed = fields.Boolean('Impreso?')
    printed_disp = fields.Boolean('Impreso Despacho')
    web_order_id = fields.Many2one('sale.order', string='Orden Web')
    tag_ids = fields.Many2many('quotation.tag', string='Origen')

    def _get_order(self):
        self.order_id = self.env['pos.order'].search([('quot_ref', '=', self.name)], limit=1)

    order_id = fields.Many2one('pos.order', string='Orden', compute=_get_order)

    @api.model
    def get_quotation_lines(self):
        result = []
        orders = self.search([])
        for order in orders:
            for o in order:
                lines = [{
                    'id': l.id, 
                    'product_id': l.product_id.id,
                    'price_unit': l.price_unit,
                    'qty': l.qty,
                    'price_subtotal': l.price_subtotal,
                    'price_subtotal_incl': l.price_subtotal_incl,
                    'discount': l.discount,
                    'order_id': order.id

                    } for l in o.lines]
                for l in lines:
                    result.append(l)
        return result

    @api.depends('lines.price_subtotal_incl', 'lines.discount')
    def _compute_amount_all(self):
        for order in self:
            order.amount_tax = 0.0
            currency = order.pricelist_id.currency_id
            order.amount_tax = currency.round(sum(self._amount_line_tax(line, order.fiscal_position_id) for line in order.lines))
            amount_untaxed = currency.round(sum(line.price_subtotal for line in order.lines))
            order.amount_total = order.amount_tax + amount_untaxed

    @api.model
    def create_from_ui(self, orders):
        order_id = self.create(self._order_fields(orders))
        order = {
            'id': order_id.id,
            'name': order_id.name
            }
        return order

    @api.model
    def create(self, vals):
        if vals.get('name', '/') == '/':
            vals['name'] = self.env['ir.sequence'].next_by_code('pos.quotation') or '/'
        return super(PosQuotation, self).create(vals)

    # @api.multi
    def do_done(self):
        for order in self:
            order.is_done = not order.is_done
        return True

    def mark_quotation_as_printed(self, args):
        quotation = self.browse(int(args.get('quotation_id')))
        printed_reserva, printed_despacho = False, False
        if args.get('report_type') == 'reserva':
            printed_reserva = True
            quotation.update({
                'printed': printed_reserva,
            })
        else:
            printed_despacho = True
            quotation.update({
                'printed_disp': printed_despacho
            })
    
    def mark_as_printed_by_session(self, args):
        session  = self.env['pos.session'].browse(int(args.get('session_id')))
        if session:
            if args.get('report_type') == 'reserva':
                session.update({
                    'printed_reservas': True
                })
            else:
                session.update({
                    'printed_despachos': True
                })
            return True
        return False
    
    def get_quotations(self):
        domain = [
            ('state', '=', 'draft')
        ]
        quots = self.search(domain)
        res = []
        for quot in quots:
            res.append({
                'name': quot.name,
                'date_order': quot.date_order,
                'time_order': quot.time_order,
                'amount_total': quot.amount_total,
                'lines': [{
                    'name': line.name,
                    'product_id': line.product_id.id,
                    'price_unit': line.price_unit,
                    'qty': line.qty,
                    'description': line.description,
                    'note': line.note
                } for line in quot.lines],
                'ean13': quot.ean13,
                'web_order_id': quot.web_order_id.id,
                'tag_ids': [tag.name for tag in quot.tag_ids]

            })
        return res



class PosQuotationLine(models.Model):
    _name = "pos.quotation.line"
    _description = "Lines of Point of Sale"
    _rec_name = "product_id"

    def _order_line_fields(self, line):
        if '(' in line[2]['full_product_name'] and ')' in line[2]['full_product_name']:
            list_variants = line[2]['full_product_name'].split('(')[1].replace(')', '').split(',')
            if len(list_variants) == 4:
                line[2]['note'] = 'Opción Frutilla 1: {} / Opción Frutilla2: {} / Metalizadas: {} / Rosas: {}'.format(list_variants[0], list_variants[1], list_variants[2], list_variants[3])
        if line and 'tax_ids' not in line[2]:
            product = self.env['product.product'].browse(line[2]['product_id'])
            line[2]['tax_ids'] = [(6, 0, [x.id for x in product.taxes_id])]
        return line

    company_id = fields.Many2one('res.company', string='Company', required=True, default=lambda self: self.env.user.company_id)
    name = fields.Char(string='Line No')
    full_product_name = fields.Char(string='Product Name')
    notice = fields.Char(string='Discount Notice')
    product_id = fields.Many2one('product.product', string='Producto', domain=[('sale_ok', '=', True)], required=True, change_default=True)
    price_unit = fields.Float(string='Precio Unitario', digits=0)
    price_extra = fields.Float(string='Precio Extra', digits=0)
    qty = fields.Float('Cantidad', default=1)
    price_subtotal = fields.Float(digits=0, string='Subtotal Neto')
    price_subtotal_incl = fields.Float(digits=0, string='Subtotal')
    discount = fields.Float(string='Descuento (%)', digits=0, default=0.0)
    order_id = fields.Many2one('pos.quotation', string='Ref. Reserva', ondelete='cascade')
    create_date = fields.Datetime(string='Fecha de Creacion', readonly=True)
    tax_ids = fields.Many2many('account.tax', string='Impuestos', readonly=True)
    # tax_ids_after_fiscal_position = fields.Many2many('account.tax',string='Impuestos')
    pack_lot_ids = fields.One2many('pos.pack.operation.lot', 'pos_order_line_id', string='Numero de Serie')
    description = fields.Char('Descripción')
    mp_skip = fields.Boolean()
    mp_dirty = fields.Boolean()
    note = fields.Char('Detalles')

    @api.depends('price_unit', 'tax_ids', 'qty', 'discount', 'product_id')
    def _compute_amount_line_all(self):
        for line in self:
            currency = line.order_id.pricelist_id.currency_id
            taxes = line.tax_ids.filtered(lambda tax: tax.company_id.id == line.order_id.company_id.id)
            fiscal_position_id = line.order_id.fiscal_position_id
            if fiscal_position_id:
                taxes = fiscal_position_id.map_tax(taxes, line.product_id, line.order_id.partner_id)
            price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
            line.price_subtotal = line.price_subtotal_incl = price * line.qty
            if taxes:
                taxes = taxes.compute_all(price, currency, line.qty, product=line.product_id,
                                          partner=line.order_id.partner_id or False)
                line.price_subtotal = taxes['total_excluded']
                line.price_subtotal_incl = taxes['total_included']

            line.price_subtotal = currency.round(line.price_subtotal)
            line.price_subtotal_incl = currency.round(line.price_subtotal_incl)

    @api.onchange('product_id')
    def _onchange_product_id(self):
        if self.product_id:
            if not self.order_id.pricelist_id:
                raise UserError(
                    _('You have to select a pricelist in the sale form !\n'
                      'Please set one before choosing a product.'))
            price = self.order_id.pricelist_id.get_product_price(
                self.product_id, self.qty or 1.0, self.order_id.partner_id)
            self._onchange_qty()
            self.price_unit = price
            self.tax_ids = self.product_id.taxes_id

    @api.onchange('qty', 'discount', 'price_unit', 'tax_ids')
    def _onchange_qty(self):
        if self.product_id:
            if not self.order_id.pricelist_id:
                raise UserError(_('You have to select a pricelist in the sale form !'))
            price = self.price_unit * (1 - (self.discount or 0.0) / 100.0)
            self.price_subtotal = self.price_subtotal_incl = price * self.qty
            if self.product_id.taxes_id:
                taxes = self.product_id.taxes_id.compute_all(price, self.order_id.pricelist_id.currency_id, self.qty,
                                                             product=self.product_id, partner=False)
                self.price_subtotal = taxes['total_excluded']
                self.price_subtotal_incl = taxes['total_included']


class PosConfig(models.Model):
    _inherit = 'pos.config'

    enable_quotation = fields.Boolean('Enable Quotation')

class QuotationTag(models.Model):
    _name = 'quotation.tag'
    _description = 'Tag from origin of Quotation'

    name = fields.Char('Nombre')
