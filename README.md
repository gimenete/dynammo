# dynammo

A simple wrapper library that simplifies using dynamoDB from Node.js.

Note: any `run()` method supports both callbacks and **promises**. If you don't pass a callback it will return a promise.

You write

```javascript
new ammo.UpdateItem('movies')
  .key({
    year: 2015,
    title: 'The Force Awakens'
  })
  .update('remove info.actors[0]')
  .condition('size(info.actors) > :num', { ':num': 3 })
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
    ":num": {
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
var ammo = require('dynammo')(dynamo, 'optional_prefix_')

// Available objects and methods:

new ammo.PutItem('table_name')...run(callback)
new ammo.UpdateItem('table_name')...run(callback)
new ammo.DeleteItem('table_name')...run(callback)
new ammo.GetItem('table_name')...run(callback)
new ammo.Query('table_name')...run(callback)
new ammo.Scan('table_name')...run(callback)
```

The optional prefix will be used in all table and index names. This is useful if you have multiple apps using the same AWS account. This way you can use a prefix per app and you don't have naming collisions.

### Expression values and names

Some methods allow you to specify an expression like this:

```javascript
query.condition('#y = :year and title = :title',
  { ':year': 2015, ':title': 'The Force Awakens' },
  { '#y': 'year' }
)
```

In this case we are querying items with a given `year` and `title` value. To pass the values we need to use a placeholder in the expression (`:year` and `:title`) and specify the values for these placeholders in the second parameter of the method `condition()`. In this case:

```javascript
{ ':year': 2015, ':title': 'The Force Awakens' }
```

But we are passing also third argument. Why? Because our condition should have been `year = :year and title = :title` but `year` is a reserved keyword so we cannot use `year` directly in the expression. Instead we use the `#y` placeholder and in the third parameter we specify the actual name of that attribute. In the example:

```javascript
{ '#y': 'year' }
```

### PutItem

Example:

```javascript
new ammo.PutItem('table_name')
  .item({
    year: 2015,
    title: 'The Force Awakens',
    genre: 'Science fiction',
    score: 8,
  })
  .returnConsumedCapacity('indexes')
  .returnItemCollectionMetrics('size')
  .returnValues('none')
  .run(function(err, res) {
    // res.raw contains the raw AWS response
    // res.attributes will be defined depending on returnValues()
  })
```

Methods

- `item(object)` (required) allows you to set all the attributes for the object. Both keys and non-keys attributes
- `returnConsumedCapacity(string)` allowed values are `INDEXES`, `TOTAL` or `NONE` (case insensitive)
- `returnItemCollectionMetrics(string)` allowed values are `SIZE` or `NONE` (case insensitive)
- `returnValues(string)` allowed values are `NONE`, `ALL_OLD`, `UPDATED_OLD`, `ALL_NEW`, `UPDATED_NEW` (case insensitive)
- `condition(condition[, values[, names]])`
- `params()` returns the `params` object that would be passed to the AWS SDK
- `run(callback)` invokes the `putItem()` method in the AWS SDK

### UpdateItem

Example:

```javascript
new ammo.UpdateItem('table_name')
  .key({
    year: 2015,
    title: 'The Force Awakens'
  })
  .update('set score = :score', { ':score': 10 })
  .condition('score = :num', { ':num': 3 })
  .returnConsumedCapacity('indexes')
  .returnItemCollectionMetrics('size')
  .returnValues('updated_new')
  .run(function(err, res) {
    // res.raw contains the raw AWS response
    // res.attributes will be defined depending on returnValues()
  })
```

Methods

- `key(object)` (required) allows you to specify the key attributes of the object to be updated
- `update(expression[, values[, names]])` allows you to specify the attributes to be updated
- `returnConsumedCapacity(string)` allowed values are `INDEXES`, `TOTAL` or `NONE` (case insensitive)
- `returnItemCollectionMetrics(string)` allowed values are `SIZE` or `NONE` (case insensitive)
- `returnValues(string)` allowed values are `NONE`, `ALL_OLD`, `UPDATED_OLD`, `ALL_NEW`, `UPDATED_NEW` (case insensitive)
- `condition(condition[, values[, names]])` allows you to specify a condition. If the condition is evaluated to true amazon won't update the object
- `params()` returns the `params` object that would be passed to the AWS SDK
- `run(callback)` invokes the `updateItem()` method in the AWS SDK

### DeleteItem

Example:

```javascript
new ammo.DeleteItem('table_name')
  .key({
    year: 2015,
    title: 'The Force Awakens',
  })
  .returnConsumedCapacity('indexes')
  .returnItemCollectionMetrics('size')
  .returnValues('none')
  .condition('score = :score', { ':score': 3 })
  .run(function(err, res) {
    // res.raw contains the raw AWS response
    // res.attributes will be defined depending on returnValues()
  })
```

Methods

- `key(object)` (required) allows you to specify the key attributes of the object to be deleted
- `returnConsumedCapacity(string)` allowed values are `INDEXES`, `TOTAL` or `NONE` (case insensitive)
- `returnItemCollectionMetrics(string)` allowed values are `SIZE` or `NONE` (case insensitive)
- `returnValues(string)` allowed values are `NONE`, `ALL_OLD`, `UPDATED_OLD`, `ALL_NEW`, `UPDATED_NEW` (case insensitive)
- `condition(condition[, values[, names]])` allows you to specify a condition. If the condition is evaluated to true amazon won't delete the object
- `params()` returns the `params` object that would be passed to the AWS SDK
- `run(callback)` invokes the `deleteItem()` method in the AWS SDK

### GetItem

Example:

```javascript
new ammo.GetItem(tableName)
  .key({
    year: 2015,
    title: 'The Force Awakens',
  })
  .returnConsumedCapacity('indexes')
  .consistentRead(true)
  .run(function(err, res) {
    // res.raw contains the raw AWS response
    // res.item contains the desired item
  })
```

Methods

- `select(string)` (required) allows you to specify the key attributes of the object to be read
- `consistentRead(boolean)` allows you to specify the consistent read constraint
- `returnConsumedCapacity(string)` allowed values are `INDEXES`, `TOTAL` or `NONE` (case insensitive)
- `params()` returns the `params` object that would be passed to the AWS SDK
- `run(callback)` invokes the `getItem()` method in the AWS SDK

### Query

Example:

```javascript
new ammo.Query('table_name')
  .select('*')
  .consistentRead(false)
  .condition('#y = :year and title = :title',
    { ':year': 2015, ':title': 'The Force Awakens' },
    { '#y': 'year' }
  )
  .returnConsumedCapacity('indexes')
  .run(function(err, res) {
    // res.raw contains the raw AWS response
    // res.items contains the items found
  })
```

Methods

- `select(string)` (required) allowed values are `ALL_ATTRIBUTES`, `ALL_PROJECTED_ATTRIBUTES`, `SPECIFIC_ATTRIBUTES`, `COUNT` (case insensitive). `*` is an alias of `ALL_ATTRIBUTES`
- `condition(condition[, values[, names]])` (required) specifies the condition of the query
- `exclusiveStartKey(object)` for paginated results it allows you to specify the key of the last object read in the previous page
- `indexName(string)` allows you to specify the index to use
- `filter(expression)` filters the returned values matching that expression
- `limit(number)` specifies the maximum number of objects to return
- `forward(boolean)` specifies the ordering
- `consistentRead(boolean)` allows you to specify the consistent read constraint
- `returnConsumedCapacity(string)` allowed values are `INDEXES`, `TOTAL` or `NONE` (case insensitive)
- `params()` returns the `params` object that would be passed to the AWS SDK
- `run(callback)` invokes the `getItem()` method in the AWS SDK

### Scan

Example:

```javascript
new ammo.Scan('table_name')
  .select('*')
  .consistentRead(false)
  .returnConsumedCapacity('indexes')
  .run(function(err, res) {
    // res.raw contains the raw AWS response
    // res.items contains the items found
  })
```

Methods

- `select(string)` (required) allowed values are `ALL_ATTRIBUTES`, `ALL_PROJECTED_ATTRIBUTES`, `SPECIFIC_ATTRIBUTES`, `COUNT` (case insensitive). `*` is an alias of `ALL_ATTRIBUTES`
- `exclusiveStartKey(object)` for paginated results it allows you to specify the key of the last object read in the previous page
- `indexName(string)` allows you to specify the index to use
- `filter(expression)` filters the returned values matching that expression
- `limit(number)` specifies the maximum number of objects to return
- `segment(number)` specifies the segment to process
- `totalSegments(number)` specifies the total segments to be processed
- `forward(boolean)` specifies the ordering
- `consistentRead(boolean)` allows you to specify the consistent read constraint
- `returnConsumedCapacity(string)` allowed values are `INDEXES`, `TOTAL` or `NONE` (case insensitive)
- `params()` returns the `params` object that would be passed to the AWS SDK
- `run(callback)` invokes the `getItem()` method in the AWS SDK

## Testing

Tests expect to have [dynamodb running locally](https://aws.amazon.com/blogs/aws/dynamodb-local-for-desktop-development/) and will create and destroy a table called `dynammo_movies`.
