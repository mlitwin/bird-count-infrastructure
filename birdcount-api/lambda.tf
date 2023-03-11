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

resource "aws_iam_role_policy_attachment" "lambda-attach" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.observations_writepolicy.arn
}

resource "aws_lambda_function" "observations_lambda" {
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


