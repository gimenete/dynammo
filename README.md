# dynammo
A simple wrapper library that simplifies using dynamoDB from Node.js.

You write

```javascript
new ammo.UpdateItem('movies')
  .key({
    year: 2015,
    title: 'The Force Awakens'
  })
  .update('remove info.actors[0]')
  .condition('size(info.actors) > :num', { num: 3 })
  .returnConsumedCapacity('indexes')
  .returnItemCollectionMetrics('size')
  .returnValues('updated_new')
  .run(function(err, data) {
    if (err) {
      console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2))
    } else {
      console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2))
    }
  })
```

Instead of writing

```javascript
var params = {
  "TableName": "movies",
  "ExpressionAttributeValues": {
    "num": {
      "N": 3
    }
  },
  "Key": {
    "year": {
      "N": 2015
    },
    "title": {
      "S": "The Force Awakens"
    }
  },
  "UpdateExpression": "remove info.actors[0]",
  "ConditionExpression": "size(info.actors) > :num",
  "ReturnConsumedCapacity": "INDEXES",
  "ReturnItemCollectionMetrics": "SIZE",
  "ReturnValues": "UPDATED_NEW"
}
dynamo.updateItem(params, function(err, data) {
  if (err) {
    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2))
  } else {
    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2))
  }
});
```

## Installation

```
npm install dynammo --save
```

## Usage

```javascript
var AWS = require('aws-sdk')
var dynamo = new AWS.DynamoDB()
var ammo = require('dynammo')(dynamo)

// Available objects and methods:

new ammo.PutItem('table_name')...run(callback)
new ammo.UpdateItem('table_name')...run(callback)
new ammo.DeleteItem('table_name')...run(callback)
new ammo.GetItem('table_name')...run(callback)
new ammo.Query('table_name')...run(callback)
new ammo.Scan('table_name')...run(callback)
```

See the test file for more examples.
