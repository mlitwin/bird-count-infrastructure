terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

terraform {
  backend "s3" {
    bucket = "birdcount-terraform-state"
    key    = "tfstate/birdcount-api"
    region = "us-east-1"
  }
}

