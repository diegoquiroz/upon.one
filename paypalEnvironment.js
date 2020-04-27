// 'use strict';

/**
 *
 * PayPal Node JS SDK dependency
 */
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

/**
 *
 * Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access.
 */






function client() {
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

/**
 *
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use LiveEnvironment.
 *
 */

//  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
// request.headers["prefer"] = "return=representation"; to do what it does

 
function environment() {//to do upload on heroku 

	let client_id = process.env.PAYPAL_CLIENT_ID 
	let client_secret = process.env.PAYPAL_CLIENT_SECRET

	if( process.env.PAYPAL_SANDBOXED === 'TRUE' ){
		
		client_id = process.env.PAYPAL_CLIENT_ID_SANDBOX
		client_secret = process.env.PAYPAL_CLIENT_SECRET_SANDBOX
		console.log('running paypal checkout in testing',client_id,client_secret)

	}

	console.log(process.env.PAYPAL_SANDBOXED,client_id,client_secret)

    //how to put to production
    return new checkoutNodeJssdk.core.SandboxEnvironment(
        client_id, client_secret
    );
}

async function prettyPrint(jsonData, pre=""){
    let pretty = "";
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
    for (let key in jsonData){
        if (jsonData.hasOwnProperty(key)){
            if (isNaN(key))
              pretty += pre + capitalize(key) + ": ";
            else
              pretty += pre + (parseInt(key) + 1) + ": ";
            if (typeof jsonData[key] === "object"){
                pretty += "\n";
                pretty += await prettyPrint(jsonData[key], pre + "    ");
            }
            else {
                pretty += jsonData[key] + "\n";
            }

        }
    }
    return pretty;
}

module.exports = {client: client, prettyPrint:prettyPrint};
