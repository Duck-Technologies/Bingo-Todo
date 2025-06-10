terraform {
  required_version = ">= 1.2"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.32.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.5"
    }
  }
  backend "azurerm" {}
}

provider "azurerm" {
  features {}
}

provider "github" {
  token = var.github_personal_access_token
  owner = "Duck-Technologies"
}