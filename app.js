'use strict';
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var requestify = require('requestify');
var constants = require('./constants');
app.use(bodyParser.json());

var headers = {
    "X-PAYPAL-SECURITY-USERID" : constants.userId,
    "X-PAYPAL-SECURITY-PASSWORD": constants.password,
    "X-PAYPAL-SECURITY-SIGNATURE": constants.signature,
    "X-PAYPAL-REQUEST-DATA-FORMAT": "JSON",
    "X-PAYPAL-RESPONSE-DATA-FORMAT": "JSON",
    "X-PAYPAL-APPLICATION-ID": constants.appId
};

app.get('/', (req, res) => {
    res.send('Paypal server is online')
});

app.post('/setup-payment', (req, res ) => {
    var email = req.body.email.toLowerCase();
    var amount = req.body.price;
    amount = "" + amount.toFixed(2);
    var body = {
        "actionType":"PAY_PRIMARY",  // Payment action type
        "clientDetails": {
            "applicationId": constants.appId,
            "ipAddress": "127.0.0.1"
        },
        "currencyCode":"USD",  // Payment currency code
        "feesPayer": "EACHRECEIVER",
        "receiverList": {
            "receiver": [
                {
                    amount,  // Payment amount
                    "email": "qbee-facilitator@gmail.com", // Payment facilitator email address
                    "primary": true
                },
                {
                    amount,
                    email,  // Payment Receiver's email address
                    "primary": false
                }
            ]
        },
        "returnUrl": "http://google.com",  // Where to redirect the Sender following a successful payment approval
        "cancelUrl": "http://yandex.com",  // Where to redirect the Sender following a canceled payment
        "requestEnvelope": {
            "errorLanguage": "en_US",  // Language used to display errors
            "detailLevel": "ReturnAll"
        }
    };
    requestify.request('https://svcs.sandbox.paypal.com/AdaptivePayments/Pay', {
        method: 'POST',
        body,
        headers
    })
        .then(function(response) {
            var paypalRes = response.getBody();
            if(paypalRes.responseEnvelope.ack === 'Success'){
                res.json({
                    success: true,
                    payKey: paypalRes.payKey
                })
            } else {
                res.json({
                    success: false,
                    error: 'Payment setup failed'
                });
            }
        });
});

app.post('/check-status', (req, res) => {
    var payKey = req.body.payKey;
    var body = {
        "requestEnvelope":{
            "errorLanguage": "en_US",
            "detailLevel": "ReturnAll"
        },
        payKey
    };
    requestify.request('https://svcs.sandbox.paypal.com/AdaptivePayments/PaymentDetails', {
        method: "POST",
        body,
        headers
    })
        .then(function(response) {
            var paypalRes = response.getBody();
            if(paypalRes.responseEnvelope.ack === 'Success'){
                res.json({
                    success: true,
                    status: paypalRes.status
                })
            } else {
                res.json({
                    success: false,
                    error: 'Payment check status failed'
                });
            }
        });
});

app.post('/complete-payment', (req, res) => {
    var payKey = req.body.payKey;
    var body = {
        "requestEnvelope":{
            "errorLanguage": "en_US",
            "detailLevel": "ReturnAll"
        },
        payKey
    };
    requestify.request('https://svcs.sandbox.paypal.com/AdaptivePayments/ExecutePayment', {
        method: "POST",
        body,
        headers
    })
        .then(function(response) {
            var paypalRes = response.getBody();
            if(paypalRes.responseEnvelope.ack === 'Success'){
                res.json({
                    success: true,
                    status: paypalRes.paymentExecStatus
                })
            } else {
                res.json({
                    success: false,
                    error: 'Payment check status failed'
                });
            }
        });
});

app.listen(3000, function () {
    console.log('Paypal transaction server is listening on port 3000!');
});