# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class PosConfig(models.Model):
    _inherit = "pos.config"

    allow_sync_product = fields.Boolean(string="Allow Sync Product")


class ProductInherit(models.Model):
    _inherit = 'product.product'

    @api.model
    def sync_product(self, product):
        pos_configs = self.env['pos.config'].sudo().search([('allow_sync_product', '=', True)])
        notifications = []
        for config in pos_configs:
            notifications.append(
                ((self._cr.dbname, 'pos.sync.product', config.current_user_id.id), {'product': product}))
        if len(notifications) > 0:
            self.env['bus.bus'].sendmany(notifications)
        return True

    @api.model
    def create(self, vals):
        res = super(ProductInherit, self).create(vals)
        prod = self.with_context(display_default_code=False).search_read([('id', '=', res.id)],['type','display_name', 'lst_price', 'standard_price', 'categ_id', 'pos_categ_id', 'taxes_id',
                 'barcode', 'default_code', 'to_weight', 'uom_id', 'description_sale', 'description',
                 'product_tmpl_id','tracking', 'product_template_attribute_value_ids','name','write_date', 'available_in_pos', 'attribute_line_ids'])
        self.sync_product(prod)
        return res

    def write(self, vals):
        res = super(ProductInherit, self).write(vals)
        prod = self.with_context(display_default_code=False).search_read([('id', '=', self.id)],['type','display_name', 'lst_price', 'standard_price', 'categ_id', 'pos_categ_id', 'taxes_id',
                 'barcode', 'default_code', 'to_weight', 'uom_id', 'description_sale', 'description',
                 'product_tmpl_id','tracking', 'product_template_attribute_value_ids','name','write_date', 'available_in_pos', 'attribute_line_ids'])
        if (prod):
            self.sync_product(prod)
        return res
