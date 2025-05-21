resource "github_actions_repository_oidc_subject_claim_customization_template" "this" {
  repository         = var.repository_name
  use_default        = false
  include_claim_keys = ["repository", "environment"]
}

