exports.handler = async function(event) {
  const response = { 
    items: [
      { 
        item: "grapes",
        category: "fruit",  
        price: 3.99, 
        unit: "lb"
      }, 
      { 
        item: "grape juice",
        category: "beverage",  
        price: 5.99, 
        unit: "qt"
      }
    ]
  }
  return { 
    "isBase64Encoded": false,
    "statusCode": 200,
    "headers": {
        "Content-Type": "application/json", 
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Origin": "*"
    }, 
    "body": JSON.stringify(response)
  };
}