# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

{
    'name': 'POS Product Auto Sync',
    'version': '14.0.0.0',
    'category': 'Point of Sale',
    'summary': 'POS Product Auto Sync Odoo App helps user to easily sync POS product without refreshing POS screen. Under point of sale configuration user can tick allow sync product checkbox when user create/edit POS product that product will be automatically sync without refreshing POS screen.',
    'description': """

            POS Sync Product in odoo,
            POS Product Auto Sync in odoo,
            Configure Allow Sync Product in odoo,
            Update product without refreshing page in odoo,
            creating product without refreshing page in odoo,
            Automatically Sync POS Product in odoo,

      """,
    'author': 'BrowseInfo',
    "price": 00,
    "currency": 'EUR',
    'website': 'https://www.browseinfo.in',
    'depends': ['base', 'point_of_sale'],
    'data': [
        'views/point_of_sale.xml',
        'views/pos_assets_common.xml',
    ],
    'qweb': [],
    'installable': True,
    'auto_install': False,
    'live_test_url': 'https://youtu.be/Xu1BEMlRoys',
    "images":['static/description/Banner.png'],
}
