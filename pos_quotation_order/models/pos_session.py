# -*- coding: utf-8 -*-

import logging
import psycopg2
from functools import partial
from odoo import models, fields, api, tools, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

class PosSession(models.Model):
    _inherit = 'pos.session'

    allow_session_receipt = fields.Boolean('Allow Session Receipt', default=True)

