terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.98, < 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}