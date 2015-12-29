var assert = require('assert')
var _ = require('underscore')

var AWS = require('aws-sdk')
var dynamo = new AWS.DynamoDB({ endpoint: 'http://localhost:8000' })
var ammo = require('../')(dynamo)

describe('Should test', function() {

  it('#PutItem', function() {
    var params = new ammo.PutItem('users')
      .item({
        email: 'gimenete@gmail.com'
      })
      .returnConsumedCapacity('indexes')
      .returnItemCollectionMetrics('size')
      .returnValues('none')
      .condition('name = :name', { name: 'Alberto' })
      .params()

    assert.ok(_.isEqual(params, {
      "TableName": "users",
      "ExpressionAttributeValues": {
        "name": {
          "S": "Alberto"
        }
      },
      "Item": {
        "email": {
          "S": "gimenete@gmail.com"
        }
      },
      "ReturnConsumedCapacity": "INDEXES",
      "ReturnItemCollectionMetrics": "SIZE",
      "ReturnValues": "NONE",
      "ConditionExpression": "name = :name"
    }))
  })

  it('#UpdateItem', function() {
    var params = new ammo.UpdateItem('movies')
      .key({
        year: 2015,
        title: 'The Force Awakens'
      })
      .update('remove info.actors[0]')
      .condition('size(info.actors) > :num', { num: 3 })
      .returnConsumedCapacity('indexes')
      .returnItemCollectionMetrics('size')
      .returnValues('updated_new')
      .params()

    assert.ok(_.isEqual(params, {
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
    }))
  })

  it('#Query', function() {
    var params = new ammo.Query('users')
      .select('*')
      .consistentRead(true)
      .indexName('index_name')
      .exclusiveStartKey({ email: 'gimenete@gmail.com' })
      .condition('name = :name', { name: 'Alberto' })
      // .filter('name = :name', { name: 'Alberto' })
      .returnConsumedCapacity('indexes')
      .params()

    assert.ok(_.isEqual(params, {
      "TableName": "users",
      "ExpressionAttributeValues": {
        "name": {
          "S": "Alberto"
        }
      },
      "Select": "ALL_ATTRIBUTES",
      "ConsistentRead": true,
      "IndexName": "index_name",
      "ExclusiveStartKey": {
        "email": {
          "S": "gimenete@gmail.com"
        }
      },
      "KeyConditionExpression": "name = :name",
      "ReturnConsumedCapacity": "INDEXES"
    }))
  })

  it('#DeleteItem', function() {
    var params = new ammo.DeleteItem('users')
      .key({
        email: 'gimenete@gmail.com'
      })
      .returnConsumedCapacity('indexes')
      .returnItemCollectionMetrics('size')
      .returnValues('none')
      .condition('name = :name', { name: 'Alberto Gimeno' })
      .params()

    assert.ok(_.isEqual(params, {
      "TableName": "users",
      "ExpressionAttributeValues": {
        "name": {
          "S": "Alberto Gimeno"
        }
      },
      "Key": {
        "email": {
          "S": "gimenete@gmail.com"
        }
      },
      "ReturnConsumedCapacity": "INDEXES",
      "ReturnItemCollectionMetrics": "SIZE",
      "ReturnValues": "NONE",
      "ConditionExpression": "name = :name"
    }))
  })

  it('#GetItem', function() {
    var params = new ammo.GetItem('users')
      .key({
        email: 'gimenete@gmail.com'
      })
      .returnConsumedCapacity('indexes')
      .consistentRead(true)
      .params()

    assert.ok(_.isEqual(params, {
      "TableName": "users",
      "Key": {
        "email": {
          "S": "gimenete@gmail.com"
        }
      },
      "ReturnConsumedCapacity": "INDEXES",
      "ConsistentRead": true
    }))
  })

  it('#Scan', function() {
    var params = new ammo.Scan('users')
      .select('*')
      .consistentRead(true)
      .indexName('index_name')
      .exclusiveStartKey({ email: 'gimenete@gmail.com' })
      // .filter('name = :name', { name: 'Alberto' })
      .returnConsumedCapacity('indexes')
      .params()

    assert.ok(_.isEqual(params, {
      "TableName": "users",
      "ExpressionAttributeValues": {},
      "Select": "ALL_ATTRIBUTES",
      "ConsistentRead": true,
      "IndexName": "index_name",
      "ExclusiveStartKey": {
        "email": {
          "S": "gimenete@gmail.com"
        }
      },
      "ReturnConsumedCapacity": "INDEXES"
    }))
  })

})
