data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "iam_for_lambda" {
  name               = "iam_for_lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_lambda_function" "test_lambda" {
  filename      = "${path.module}/lambda/dist/index.zip"
  function_name = "birdcount_api"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "index.handler"

  source_code_hash = filesha256("${path.module}/lambda/dist/index.js")

  runtime = "nodejs16.x"

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.observations_table.name
    }
  }
}


// dynamodb table Read Policy
data "aws_iam_policy_document" "readpolicy" {
  statement {
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:GetRecords",
      "dynamodb:ListTables",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]

    resources = [aws_dynamodb_table.observations_table.arn]

    effect = "Allow"
  }
}

resource "aws_iam_policy" "readpolicy" {
  name   = "${local.app_name}-${local.region}-DynamoDb-Read-Policy"
  policy = "${data.aws_iam_policy_document.readpolicy.json}"
}

// dynamodb table Write Policy
data "aws_iam_policy_document" "writepolicy" {
  statement {
    actions = [
      "dynamodb:DeleteItem",
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:GetRecords",
      "dynamodb:ListTables",
      "dynamodb:PutItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:UpdateItem",
      "dynamodb:UpdateTable",
    ]

    resources = [aws_dynamodb_table.observations_table.arn]

    effect = "Allow"
  }
}

resource "aws_iam_policy" "writepolicy" {
  name   = "${local.app_name}-${local.region}-DynamoDb-Write-Policy"
  policy = "${data.aws_iam_policy_document.writepolicy.json}"
}

resource "aws_iam_role_policy_attachment" "lambda-attach" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.writepolicy.arn
}
