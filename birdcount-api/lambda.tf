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
      foo = "bar"
    }
  }
}

