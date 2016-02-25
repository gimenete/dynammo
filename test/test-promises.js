var assert = require('assert')
var _ = require('underscore')

var AWS = require('aws-sdk')
var dynamo = new AWS.DynamoDB({
  region: 'us-east-1',
  endpoint: 'http://localhost:4567',
})

describe('Should test', function() {

  var prefix = 'dynammo_'
  var tableName = 'movies'
  var fullTableName = prefix+tableName
  var ammo = require('../')(dynamo, prefix)

  before(function(done) {
    this.timeout(10000)
    require('./test-utils').createTable(dynamo, fullTableName, done)
  })

  it('#PutItem', function() {
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
    return putItem.run()
      .then(function(res) {
        assert.ok(_.isEqual(res, { raw: {} }))
      })
  })

  it('#UpdateItem', function() {
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
    return updateItem.run()
      .then(function(res) {
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
      })
  })

  it('#UpdateItem', function() {
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
    return updateItem.run()
      .then(() => { throw new Error('UpdateItem should have failed') })
      .catch(function(err) {
        assert.ok(err && err.code === 'ConditionalCheckFailedException')
      })
  })

  it('#Query', function() {
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
    return query.run()
      .then(function(res) {
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
      })
  })

  it('#Query', function() {
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
    return query.run()
      .then(function(res) {
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
      })
  })

  it('#Scan', function() {
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
    return scan.run()
      .then(function(res) {
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
      })
  })

  it('#GetItem', function() {
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
    return getItem.run()
      .then(function(res) {
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
      })
  })

  it('#DeleteItem', function() {
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
    return deleteItem.run()
      .then(() => { throw new Error('DeleteItem should have failed') })
      .catch(function(err) {
        assert.ok(err && err.code === 'ConditionalCheckFailedException')
      })
  })

  it('#DeleteItem', function() {
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
    return deleteItem.run()
      .then(function(res) {
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
      })
  })

})
