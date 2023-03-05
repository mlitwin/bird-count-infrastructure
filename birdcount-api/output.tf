output "observations_db_id" {
  value = aws_dynamodb_table.observations_table.id
}

output "observations_db_arn" {
  value = aws_dynamodb_table.observations_table.arn
}