// Observer pattern for real-time inventory/activity changes
defaultEmitter = null;

function attachEmitter(ioInstance) {
    defaultEmitter = ioInstance;
}

function emitStockEvent(event, payload) {
    if (defaultEmitter) {
        defaultEmitter.emit(event, payload);
    }
}

module.exports = {
    attachEmitter,
    emitStockEvent,
};
