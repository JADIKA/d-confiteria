odoo.define('bi_sync_pos_product.ProductsWidget', function(require) {
	"use strict";

	const Registries = require('point_of_sale.Registries');
	const ProductsWidget = require('point_of_sale.ProductsWidget');

	let prd_list_count = 0;

	const BiProductsWidget = (ProductsWidget) =>
		class extends ProductsWidget {
			mounted() {
				super.mounted();
				this.env.pos.on('change:is_sync', this.render, this);
			}
			willUnmount() {
				super.willUnmount();
				this.env.pos.off('change:is_sync', null, this);
			}
			get is_sync() {
				return this.env.pos.get('is_sync');
			}
			get productsToDisplay() {
				let self = this;
				let prods = super.productsToDisplay;
				let x_sync = self.env.pos.get("is_sync");
				self.env.pos.set("is_sync",false);
				return prods
			}
		};

	Registries.Component.extend(ProductsWidget, BiProductsWidget);

	return ProductsWidget;

});
