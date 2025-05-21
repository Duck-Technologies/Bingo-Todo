locals {
  apply_key = "apply"
}

resource "github_repository_environment" "this" {
  for_each    = local.environment_split
  environment = each.key
  repository  = var.repository_name

  dynamic "deployment_branch_policy" {
    for_each = each.value.type == local.apply_key ? [1] : []
    content {
      protected_branches     = true
      custom_branch_policies = false
    }
  }
}
