var assert = require('assert')
var _ = require('underscore')

var AWS = require('aws-sdk')
var dynamo = new AWS.DynamoDB({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
})
var ammo = require('../')(dynamo)

describe('Should test', function() {

  var tableName = 'dynammo_movies'

  before(function(done) {
    dynamo.deleteTable({ TableName: tableName }, function(err) {
      if (err && err.code !== 'ResourceNotFoundException') return done(err)
      var params = {
        "AttributeDefinitions": [
          {
            "AttributeName": "title",
            "AttributeType": "S"
          },
          {
            "AttributeName": "year",
            "AttributeType": "N"
          },
          {
            "AttributeName": "genre",
            "AttributeType": "S"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": tableName+"_index_genre",
            "KeySchema": [
              {
                "AttributeName": "genre",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
              "ReadCapacityUnits": 2,
              "WriteCapacityUnits": 2
            }
          }
        ],
        "TableName": tableName,
        "KeySchema": [
          {
            "AttributeName": "title",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "year",
            "KeyType": "RANGE"
          }
        ],
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 1,
          "WriteCapacityUnits": 1
        }
      }
      dynamo.createTable(params, done)
    })
  })

  it('#PutItem', function(done) {
    var putItem = new ammo.PutItem(tableName)
      .item({
        year: 2015,
        title: 'The Force Awakens',
        genre: 'Science fiction',
        score: 8,
      })
      .returnConsumedCapacity('indexes')
      .returnItemCollectionMetrics('size')
      .returnValues('none')

    var params = putItem.params()
    assert.ok(_.isEqual(params, {
      "TableName": "dynammo_movies",
      "Item": {
        "year": {
          "N": "2015"
        },
        "title": {
          "S": "The Force Awakens"
        },
        "genre": {
          "S": "Science fiction"
        },
        "score": {
          "N": "8"
        }
      },
      "ReturnConsumedCapacity": "INDEXES",
      "ReturnItemCollectionMetrics": "SIZE",
      "ReturnValues": "NONE"
    }))
    putItem.run(function(err, res) {
      if (err) return done(err)
      assert.ok(_.isEqual(res, { raw: {} }))
      done()
    })
  })

  it('#UpdateItem', function(done) {
    var updateItem = new ammo.UpdateItem(tableName)
      .key({
        year: 2015,
        title: 'The Force Awakens'
      })
      .update('set score = :score', { ':score': 10 })
      // .condition('size(info.actors) > :num', { num: 3 })
      .returnConsumedCapacity('indexes')
      .returnItemCollectionMetrics('size')
      .returnValues('updated_new')

    var params = updateItem.params()
    assert.ok(_.isEqual(params, {
      "TableName": "dynammo_movies",
      "ExpressionAttributeValues": {
        ":score": {
          "N": "10"
        }
      },
      "Key": {
        "year": {
          "N": "2015"
        },
        "title": {
          "S": "The Force Awakens"
        }
      },
      "UpdateExpression": "set score = :score",
      "ReturnConsumedCapacity": "INDEXES",
      "ReturnItemCollectionMetrics": "SIZE",
      "ReturnValues": "UPDATED_NEW"
    }))
    updateItem.run(function(err, res) {
      if (err) return done(err)
      assert.ok(_.isEqual(res, {
        "raw": {
          "Attributes": {
            "score": {
              "N": "10"
            }
          }
        },
        "attributes": {
          "score": 10
        }
      }))
      done()
    })
  })

  it('#UpdateItem', function(done) {
    var updateItem = new ammo.UpdateItem(tableName)
      .key({
        year: 2015,
        title: 'The Force Awakens'
      })
      .update('set score = :score', { ':score': 10 })
      .condition('score = :num', { ':num': 3 })
      .returnConsumedCapacity('indexes')
      .returnItemCollectionMetrics('size')
      .returnValues('updated_new')

    var params = updateItem.params()
    assert.ok(_.isEqual(params, {
      "TableName": "dynammo_movies",
      "ExpressionAttributeValues": {
        ":score": {
          "N": "10"
        },
        ":num": {
          "N": "3"
        }
      },
      "Key": {
        "year": {
          "N": "2015"
        },
        "title": {
          "S": "The Force Awakens"
        }
      },
      "UpdateExpression": "set score = :score",
      "ConditionExpression": "score = :num",
      "ReturnConsumedCapacity": "INDEXES",
      "ReturnItemCollectionMetrics": "SIZE",
      "ReturnValues": "UPDATED_NEW"
    }))
    updateItem.run(function(err, res) {
      assert.ok(err && err.code === 'ConditionalCheckFailedException')
      done()
    })
  })

  it('#Query', function(done) {
    var query = new ammo.Query(tableName)
      .select('*')
      .consistentRead(false)
      // .exclusiveStartKey({ email: 'gimenete@gmail.com' })
      .condition('#y = :year and title = :title',
        { ':year': 2015, ':title': 'The Force Awakens' },
        { '#y': 'year' }
      )
      .returnConsumedCapacity('indexes')

    var params = query.params()
    assert.ok(_.isEqual(params, {
      "TableName": "dynammo_movies",
      "Select": "ALL_ATTRIBUTES",
      "ConsistentRead": false,
      "KeyConditionExpression": "#y = :year and title = :title",
      "ExpressionAttributeValues": {
        ":year": {
          "N": "2015"
        },
        ":title": {
          "S": "The Force Awakens"
        }
      },
      "ExpressionAttributeNames": {
        "#y": "year"
      },
      "ReturnConsumedCapacity": "INDEXES"
    }))
    query.run(function(err, res) {
      if (err) return done(err)
      assert.ok(_.isEqual(res, {
        "raw": {
          "Items": [
            {
              "genre": {
                "S": "Science fiction"
              },
              "score": {
                "N": "10"
              },
              "title": {
                "S": "The Force Awakens"
              },
              "year": {
                "N": "2015"
              }
            }
          ],
          "Count": 1,
          "ScannedCount": 1
        },
        "items": [
          {
            "genre": "Science fiction",
            "score": 10,
            "title": "The Force Awakens",
            "year": 2015
          }
        ]
      }))
      done()
    })
  })

  it('#Query', function(done) {
    var query = new ammo.Query(tableName)
      .select('*')
      .consistentRead(false)
      .indexName(tableName+'_index_genre')
      .condition('genre = :genre', { ':genre': 'Science fiction' })
      .returnConsumedCapacity('indexes')

    var params = query.params()
    assert.ok(_.isEqual(params, {
      "TableName": "dynammo_movies",
      "Select": "ALL_ATTRIBUTES",
      "ConsistentRead": false,
      "IndexName": "dynammo_movies_index_genre",
      "KeyConditionExpression": "genre = :genre",
      "ExpressionAttributeValues": {
        ":genre": {
          "S": "Science fiction"
        }
      },
      "ReturnConsumedCapacity": "INDEXES"
    }))
    query.run(function(err, res) {
      if (err) return done(err)
      assert.ok(_.isEqual(res, {
        "raw": {
          "Items": [
            {
              "genre": {
                "S": "Science fiction"
              },
              "score": {
                "N": "10"
              },
              "title": {
                "S": "The Force Awakens"
              },
              "year": {
                "N": "2015"
              }
            }
          ],
          "Count": 1,
          "ScannedCount": 1
        },
        "items": [
          {
            "genre": "Science fiction",
            "score": 10,
            "title": "The Force Awakens",
            "year": 2015
          }
        ]
      }))
      done()
    })
  })

  it('#Scan', function(done) {
    var scan = new ammo.Scan(tableName)
      .select('*')
      .consistentRead(false)
      .indexName(tableName+'_index_genre')
      .returnConsumedCapacity('indexes')

    var params = scan.params()
    assert.ok(_.isEqual(params, {
      "TableName": "dynammo_movies",
      "Select": "ALL_ATTRIBUTES",
      "ConsistentRead": false,
      "IndexName": "dynammo_movies_index_genre",
      "ReturnConsumedCapacity": "INDEXES",
    }))
    scan.run(function(err, res) {
      if (err) return done(err)
      assert.ok(_.isEqual(res, {
        "raw": {
          "Items": [
            {
              "genre": {
                "S": "Science fiction"
              },
              "score": {
                "N": "10"
              },
              "title": {
                "S": "The Force Awakens"
              },
              "year": {
                "N": "2015"
              }
            }
          ],
          "Count": 1,
          "ScannedCount": 1
        },
        "items": [
          {
            "genre": "Science fiction",
            "score": 10,
            "title": "The Force Awakens",
            "year": 2015
          }
        ]
      }))
      done()
    })
  })

  it('#GetItem', function(done) {
    var getItem = new ammo.GetItem(tableName)
      .key({
        year: 2015,
        title: 'The Force Awakens',
      })
      .returnConsumedCapacity('indexes')
      .consistentRead(true)

    var params = getItem.params()
    assert.ok(_.isEqual(params, {
      "TableName": "dynammo_movies",
      "Key": {
        "year": {
          "N": "2015"
        },
        "title": {
          "S": "The Force Awakens"
        }
      },
      "ReturnConsumedCapacity": "INDEXES",
      "ConsistentRead": true
    }))
    getItem.run(function(err, res) {
      if (err) return done(err)
      assert.ok(_.isEqual(res, {
        "raw": {
          "Item": {
            "genre": {
              "S": "Science fiction"
            },
            "score": {
              "N": "10"
            },
            "title": {
              "S": "The Force Awakens"
            },
            "year": {
              "N": "2015"
            }
          }
        },
        "item": {
          "genre": "Science fiction",
          "score": 10,
          "title": "The Force Awakens",
          "year": 2015
        }
      }))
      done()
    })
  })

  it('#DeleteItem', function(done) {
    var deleteItem = new ammo.DeleteItem(tableName)
      .key({
        year: 2015,
        title: 'The Force Awakens',
      })
      .returnConsumedCapacity('indexes')
      .returnItemCollectionMetrics('size')
      .returnValues('none')
      .condition('score = :score', { ':score': 3 })

    var params = deleteItem.params()
    assert.ok(_.isEqual(params, {
      "TableName": "dynammo_movies",
      "Key": {
        "year": {
          "N": "2015"
        },
        "title": {
          "S": "The Force Awakens"
        }
      },
      "ReturnConsumedCapacity": "INDEXES",
      "ReturnItemCollectionMetrics": "SIZE",
      "ReturnValues": "NONE",
      "ConditionExpression": "score = :score",
      "ExpressionAttributeValues": {
        ":score": {
          "N": "3"
        }
      }
    }))
    deleteItem.run(function(err, res) {
      assert.ok(err && err.code === 'ConditionalCheckFailedException')
      done()
    })
  })

  it('#DeleteItem', function(done) {
    var deleteItem = new ammo.DeleteItem(tableName)
      .key({
        year: 2015,
        title: 'The Force Awakens',
      })
      .returnConsumedCapacity('indexes')
      .returnItemCollectionMetrics('size')
      .returnValues('ALL_OLD')
      .condition('score = :score', { ':score': 10 })

    var params = deleteItem.params()
    assert.ok(_.isEqual(params, {
      "TableName": "dynammo_movies",
      "Key": {
        "year": {
          "N": "2015"
        },
        "title": {
          "S": "The Force Awakens"
        }
      },
      "ReturnConsumedCapacity": "INDEXES",
      "ReturnItemCollectionMetrics": "SIZE",
      "ReturnValues": "ALL_OLD",
      "ConditionExpression": "score = :score",
      "ExpressionAttributeValues": {
        ":score": {
          "N": "10"
        }
      }
    }))
    deleteItem.run(function(err, res) {
      if (err) return done(err)
      assert.ok(_.isEqual(res, {
        "raw": {
          "Attributes": {
            "genre": {
              "S": "Science fiction"
            },
            "score": {
              "N": "10"
            },
            "title": {
              "S": "The Force Awakens"
            },
            "year": {
              "N": "2015"
            }
          }
        },
        "attributes": {
          "genre": "Science fiction",
          "score": 10,
          "title": "The Force Awakens",
          "year": 2015
        }
      }))
      done()
    })
  })

})
