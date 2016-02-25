
exports.createTable = function(dynamo, fullTableName, done) {
  dynamo.deleteTable({ TableName: fullTableName }, function(err) {
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
          "IndexName": fullTableName+"_index_genre",
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
      "TableName": fullTableName,
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
}
