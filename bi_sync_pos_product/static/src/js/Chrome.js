odoo.define('bi_sync_pos_product.Chrome', function(require) {
	'use strict';

	const Chrome = require('point_of_sale.Chrome');
	const Registries = require('point_of_sale.Registries');
	var models = require('point_of_sale.models');
	var utils = require('web.utils');
	var round_pr = utils.round_precision;

	const BiPosChrome = (Chrome) =>
		class extends Chrome {
			mounted(){
			    let self = this;
                self.env.services.bus_service.updateOption('pos.sync.product',self.env.session.uid);
				self.env.services.bus_service.onNotification(self,self._onProductNotification);
				self.env.services.bus_service.startPolling();
			}
			_onProductNotification(notifications){
				let self = this;
				notifications.forEach(function (ntf) {
					ntf = JSON.parse(JSON.stringify(ntf))
					if(ntf && ntf[1]){
                        let prod = ntf[1].product[0];
                        let old_category_id = self.env.pos.db.product_by_id[prod.id];
                        let old_barcode = self.env.pos.db.product_by_id[prod.id];
                        let new_category_id = prod.pos_categ_id[0];
                        let new_barcode = prod.barcode;
                        let stored_categories = self.env.pos.db.product_by_category_id;

						prod.pos = self.env.pos;
						if(self.env.pos.db.product_by_id[prod.id]){
                            if(old_category_id.pos_categ_id){
                                stored_categories[old_category_id.pos_categ_id[0]] = stored_categories[old_category_id.pos_categ_id[0]].filter(function(item) {
                                    return item != prod.id;
                                });
                            }
                            if(new_barcode){
                            	var search_string = utils.unaccent(self.env.pos.db._product_search_string(prod));
                            	var categ_id = prod.pos_categ_id ? prod.pos_categ_id[0] : self.env.pos.db.root_category_id
                            	self.env.pos.db.category_search_string[categ_id] += search_string
                            }

                            if(stored_categories[new_category_id]){
                                stored_categories[new_category_id].push(prod.id);
                            }
							self.env.pos.db.product_by_id[prod.id] = new models.Product({}, prod);
						}else{
							self.env.pos.db.add_products(_.map( ntf[1].product, function (prd) {
								return new models.Product({}, prd);
							}));
						}
					}
				});
				self.env.pos.set('is_sync',true);
			}
		};

	Registries.Component.extend(Chrome, BiPosChrome);

	return Chrome;
});
