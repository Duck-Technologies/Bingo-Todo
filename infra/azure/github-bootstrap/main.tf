resource "random_string" "unique_name" {
  length  = 3
  special = false
  upper   = false
  numeric = false
}

module "entra" {
  source                = "./entra"
  for_each              = local.environments
  personal_access_token = var.personal_access_token
  organization_name     = var.organization_name
  environment           = each.key
  app_name              = "bingo_todo"
  app_display_name      = "Bingo TODO"
  add_test_appreg       = each.key == var.test_environment
  ui_urls = []
}