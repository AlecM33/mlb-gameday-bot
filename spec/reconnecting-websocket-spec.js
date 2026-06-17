const createReconnectingWebSocket = require('../modules/reconnecting-websocket');

class MockWebSocket {
    constructor (url) {
        this.url = url;
        this.readyState = MockWebSocket.CONNECTING;
        this._listeners = {};
        this._sent = [];
        MockWebSocket.instances.push(this);
    }

    static get CONNECTING () { return 0; }
    static get OPEN () { return 1; }
    static get CLOSING () { return 2; }
    static get CLOSED () { return 3; }

    on (event, fn) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
    }

    _emit (event, ...args) {
        (this._listeners[event] || []).forEach(fn => fn(...args));
    }

    send (data) { this._sent.push(data); }
    terminate () { this.readyState = MockWebSocket.CLOSED; this._emit('close'); }
    close () { this.readyState = MockWebSocket.CLOSED; this._emit('close'); }

    simulateOpen () { this.readyState = MockWebSocket.OPEN; this._emit('open'); }
    simulateMessage (data) { this._emit('message', data); }
    simulateError (err) { this._emit('error', err); }
    simulateClose () { this.readyState = MockWebSocket.CLOSED; this._emit('close'); }
}

const URL = 'wss://example.com/socket';
const BASE = { WebSocket: MockWebSocket, connectionTimeout: 10000, reconnectDelay: 3000 };

describe('reconnecting-websocket', () => {
    beforeEach(() => {
        MockWebSocket.instances = [];
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should connect immediately on creation', () => {
        createReconnectingWebSocket(URL, BASE);
        expect(MockWebSocket.instances.length).toBe(1);
        expect(MockWebSocket.instances[0].url).toBe(URL);
    });

    it('should fire open listeners when the socket opens', () => {
        const ws = createReconnectingWebSocket(URL, BASE);
        const spy = jasmine.createSpy('open');
        ws.addEventListener('open', spy);
        MockWebSocket.instances[0].simulateOpen();
        expect(spy).toHaveBeenCalledWith({});
    });

    it('should fire message listeners with the stringified payload', () => {
        const ws = createReconnectingWebSocket(URL, BASE);
        const spy = jasmine.createSpy('message');
        ws.addEventListener('message', spy);
        MockWebSocket.instances[0].simulateOpen();
        MockWebSocket.instances[0].simulateMessage({ toString: () => 'hello' });
        expect(spy).toHaveBeenCalledWith({ data: 'hello' });
    });

    it('should fire error listeners', () => {
        const ws = createReconnectingWebSocket(URL, BASE);
        const spy = jasmine.createSpy('error');
        ws.addEventListener('error', spy);
        const err = new Error('oops');
        MockWebSocket.instances[0].simulateError(err);
        expect(spy).toHaveBeenCalledWith(err);
    });

    it('should fire close listeners when the socket closes', () => {
        const ws = createReconnectingWebSocket(URL, BASE);
        const spy = jasmine.createSpy('close');
        ws.addEventListener('close', spy);
        MockWebSocket.instances[0].simulateOpen();
        MockWebSocket.instances[0].simulateClose();
        expect(spy).toHaveBeenCalledWith({});
    });

    it('should silently ignore addEventListener calls for unknown events', () => {
        const ws = createReconnectingWebSocket(URL, BASE);
        expect(() => ws.addEventListener('unknown', () => {})).not.toThrow();
    });

    it('should reconnect after a server-initiated close', () => {
        createReconnectingWebSocket(URL, BASE);
        MockWebSocket.instances[0].simulateOpen();
        MockWebSocket.instances[0].simulateClose();
        expect(MockWebSocket.instances.length).toBe(1);
        jasmine.clock().tick(3000);
        expect(MockWebSocket.instances.length).toBe(2);
        expect(MockWebSocket.instances[1].url).toBe(URL);
    });

    it('should NOT reconnect when close() is called intentionally', () => {
        const ws = createReconnectingWebSocket(URL, BASE);
        MockWebSocket.instances[0].simulateOpen();
        ws.close();
        jasmine.clock().tick(3000);
        expect(MockWebSocket.instances.length).toBe(1);
    });

    it('should terminate and retry on connection timeout', () => {
        createReconnectingWebSocket(URL, BASE);
        expect(MockWebSocket.instances.length).toBe(1);
        jasmine.clock().tick(10000);
        jasmine.clock().tick(3000);
        expect(MockWebSocket.instances.length).toBe(2);
    });

    it('should deliver messages through shared listeners after reconnection', () => {
        const ws = createReconnectingWebSocket(URL, BASE);
        const spy = jasmine.createSpy('message');
        ws.addEventListener('message', spy);
        MockWebSocket.instances[0].simulateOpen();
        MockWebSocket.instances[0].simulateClose();
        jasmine.clock().tick(3000);
        MockWebSocket.instances[1].simulateOpen();
        MockWebSocket.instances[1].simulateMessage({ toString: () => 'hello after reconnect' });
        expect(spy).toHaveBeenCalledWith({ data: 'hello after reconnect' });
    });

    it('should send a message when the socket is open', () => {
        const ws = createReconnectingWebSocket(URL, BASE);
        MockWebSocket.instances[0].simulateOpen();
        ws.send('hello');
        expect(MockWebSocket.instances[0]._sent).toContain('hello');
    });

    it('should not send when the socket is not yet open', () => {
        const ws = createReconnectingWebSocket(URL, BASE);
        // socket is still in CONNECTING state
        ws.send('hello');
        expect(MockWebSocket.instances[0]._sent.length).toBe(0);
    });

    it('should send heartbeats at the configured interval while open', () => {
        createReconnectingWebSocket(URL, { ...BASE, heartbeatMessage: 'ping', heartbeatInterval: 5000 });
        MockWebSocket.instances[0].simulateOpen();
        expect(MockWebSocket.instances[0]._sent.length).toBe(0);
        jasmine.clock().tick(5000);
        expect(MockWebSocket.instances[0]._sent).toEqual(['ping']);
        jasmine.clock().tick(5000);
        expect(MockWebSocket.instances[0]._sent).toEqual(['ping', 'ping']);
    });

    it('should stop heartbeats when close() is called', () => {
        const ws = createReconnectingWebSocket(URL, { ...BASE, heartbeatMessage: 'ping', heartbeatInterval: 5000 });
        MockWebSocket.instances[0].simulateOpen();
        jasmine.clock().tick(5000);
        expect(MockWebSocket.instances[0]._sent.length).toBe(1);
        ws.close();
        jasmine.clock().tick(5000);
        expect(MockWebSocket.instances[0]._sent.length).toBe(1);
    });

    it('should stop heartbeats after a server-side close and resume them on the new socket', () => {
        createReconnectingWebSocket(URL, { ...BASE, heartbeatMessage: 'ping', heartbeatInterval: 5000 });
        MockWebSocket.instances[0].simulateOpen();
        jasmine.clock().tick(5000);
        expect(MockWebSocket.instances[0]._sent).toEqual(['ping']);

        MockWebSocket.instances[0].simulateClose();
        jasmine.clock().tick(3000);
        MockWebSocket.instances[1].simulateOpen();
        jasmine.clock().tick(5000);

        expect(MockWebSocket.instances[1]._sent).toEqual(['ping']);
        expect(MockWebSocket.instances[0]._sent.length).toBe(1);
    });

    it('should not start heartbeats when no heartbeatMessage is configured', () => {
        createReconnectingWebSocket(URL, BASE); // no heartbeatMessage
        MockWebSocket.instances[0].simulateOpen();
        jasmine.clock().tick(10000);
        expect(MockWebSocket.instances[0]._sent.length).toBe(0);
    });
});
