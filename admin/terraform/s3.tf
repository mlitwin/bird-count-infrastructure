module "s3_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "birdcount-api-storage"
  acl    = "private"

  versioning = {
    enabled = true
  }

}