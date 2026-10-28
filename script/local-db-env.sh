#!/usr/bin/env bash
# Source this file from Bash; the password file stays outside the repository.

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  printf 'Use: source %s [--save-password|--prompt-password]\n' "$0" >&2
  exit 1
fi

export SPRING_DATASOURCE_USERNAME=cdmga_dev
_cdmga_password_file="$HOME/.config/cdmga/db-password"

if [[ "${1:-}" == "--save-password" || "${1:-}" == "--prompt-password" ]]; then
  if [[ ! -t 0 ]]; then
    printf 'Password input requires an interactive terminal.\n' >&2
    unset _cdmga_password_file
    return 1
  fi
  if ! read -r -s -p 'Local CDMGA database password: ' _cdmga_db_password; then
    printf '\nPassword input cancelled.\n' >&2
    unset _cdmga_db_password _cdmga_password_file
    return 1
  fi
  printf '\n'
  if [[ -z "$_cdmga_db_password" ]]; then
    printf 'Password cannot be empty.\n' >&2
    unset _cdmga_db_password _cdmga_password_file
    return 1
  fi
  if [[ "${1:-}" == "--save-password" ]]; then
    if ! install -d -m 700 "$HOME/.config/cdmga"; then
      unset _cdmga_db_password _cdmga_password_file
      return 1
    fi
    chmod 700 "$HOME/.config/cdmga"
    if ! (umask 077; printf '%s\n' "$_cdmga_db_password" > "$_cdmga_password_file"); then
      unset _cdmga_db_password _cdmga_password_file
      return 1
    fi
    chmod 600 "$_cdmga_password_file"
  fi
  export SPRING_DATASOURCE_PASSWORD="$_cdmga_db_password"
  unset _cdmga_db_password
elif [[ -f "$_cdmga_password_file" ]]; then
  IFS= read -r SPRING_DATASOURCE_PASSWORD < "$_cdmga_password_file"
  export SPRING_DATASOURCE_PASSWORD
fi

unset _cdmga_password_file