// Central validation and business rule checks for inventory and sales flows
module.exports = {
    validateStockReceive({ supplierId, productId, quantity }) {
        if (!supplierId || !productId || !quantity || quantity <= 0) {
            throw new Error('Missing or invalid supplier/product/quantity');
        }
    },

    validateSaleItems(items) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('No sale items provided');
        }
        items.forEach(item => {
            if (!item.productId || !item.quantity || item.quantity <= 0 || !item.price) {
                throw new Error('Incorrect item info');
            }
        });
    },

    // Additional rules (unique check, format, etc) can be added
};
