resource "aws_dynamodb_table" "observations_table" {
  name         = "birdcount-observations-dev"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "group"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }
  
  hash_key  = "group"
  range_key = "timestamp"

  point_in_time_recovery {
    enabled = true
  }
}