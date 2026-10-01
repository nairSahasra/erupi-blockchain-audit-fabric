/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const sinon = require('sinon');

class MockContext {
    constructor() {
        this.state = {};
        this.history = {};

        this.stub = {
            getTxID: sinon.stub().returns('mock-txid-12345'),
            getTxTimestamp: sinon.stub().returns({ seconds: { low: 1775034000 } }), // approx 2026-04
            getState: sinon.stub().callsFake(async (key) => {
                const val = this.state[key];
                return val ? Buffer.from(val) : Buffer.from('');
            }),
            putState: sinon.stub().callsFake(async (key, value) => {
                const strVal = value.toString('utf8');
                this.state[key] = strVal;
                if (!this.history[key]) {
                    this.history[key] = [];
                }
                this.history[key].push({
                    txId: this.stub.getTxID(),
                    timestamp: this.stub.getTxTimestamp(),
                    isDelete: false,
                    value: Buffer.from(strVal)
                });
            }),
            getHistoryForKey: sinon.stub().callsFake(async (key) => {
                const records = this.history[key] || [];
                let idx = 0;
                return {
                    next: async () => {
                        if (idx < records.length) {
                            return { value: records[idx++], done: false };
                        }
                        return { value: null, done: true };
                    },
                    close: async () => {}
                };
            }),
            getQueryResult: sinon.stub().callsFake(async () => {
                const records = Object.values(this.state);
                let idx = 0;
                return {
                    next: async () => {
                        if (idx < records.length) {
                            return { value: { value: Buffer.from(records[idx++]) }, done: false };
                        }
                        return { value: null, done: true };
                    },
                    close: async () => {}
                };
            })
        };
    }
}

module.exports = MockContext;
