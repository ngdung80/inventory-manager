// Strategy pattern for receipts (tax/discount). Easily extendable.

class TaxStrategy {
    calculate(total, items) {
        // Example: VAT 10%
        return total * 0.10;
    }
}

class DiscountStrategy {
    calculate(total, items, customer) {
        // Example: Loyalty discount 5% for certain customers
        if (customer && customer.isLoyal) return total * 0.05;
        return 0;
    }
}

module.exports = {
    TaxStrategy,
    DiscountStrategy,
};
